import { useState, useMemo } from 'react';
import { useContent } from './hooks/useContent';
import { useSearch } from './hooks/useSearch';
import TopNav from './components/TopNav/TopNav';
import ListView from './views/ListView';
import GridView from './views/GridView';
import CalendarView from './views/CalendarView';
import EmptyState from './components/EmptyState/EmptyState';
import LoadingSkeleton from './components/LoadingSkeleton/LoadingSkeleton';
import PreviewModal from './components/PreviewModal/PreviewModal';
import PinModal from './components/PinModal/PinModal';
import RevisionModal from './components/RevisionModal/RevisionModal';
import Footer from './components/Footer/Footer';
import ContentEditor from './components/ContentEditor/ContentEditor';
import AiModal from './components/AiModal/AiModal';
import MonthNotes from './components/MonthNotes/MonthNotes';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMonthName } from './utils/helpers';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function MainApp() {
  const { isAdmin, isPinModalOpen, closePinModal, openPinModal } = useAuth();

  // Always default to the current active month and year
  const currentDate = useMemo(() => new Date(), []);
  const [year, setYear] = useState(() => currentDate.getFullYear());
  const [month, setMonth] = useState(() => currentDate.getMonth() + 1);
  const [view, setView] = useState('list'); // 'list' | 'grid' | 'calendar'
  const [activeCategory, setActiveCategory] = useState('social'); // 'social' | 'written'

  // Service CRUD Hook
  const {
    content,
    loading,
    error,
    addContent,
    batchAddContent,
    updateContentItem,
    removeContent,
  } = useContent(year, month);

  // Filter content by current active category (Social vs Written)
  const categoryContent = useMemo(() => {
    return content.filter(item => (item.category || 'social') === activeCategory);
  }, [content, activeCategory]);

  // Counts for tab badges
  const socialCount = useMemo(() => {
    return content.filter(item => (item.category || 'social') === 'social').length;
  }, [content]);

  const writtenCount = useMemo(() => {
    return content.filter(item => item.category === 'written').length;
  }, [content]);

  // Search Hook on filtered category items
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    filteredContent,
    clearSearch,
  } = useSearch(categoryContent);

  // Modals state
  const [editingItem, setEditingItem] = useState(null);
  const [revisionItem, setRevisionItem] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Preview state
  const [previewAsset, setPreviewAsset] = useState(null);
  const [previewAssets, setPreviewAssets] = useState([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [previewText, setPreviewText] = useState(null);
  const [previewCaption, setPreviewCaption] = useState(null);

  // Month navigation
  const handlePrevMonth = () => {
    setMonth(prev => {
      if (prev === 1) {
        setYear(y => y - 1);
        return 12;
      }
      return prev - 1;
    });
    setEditingItem(null);
    setRevisionItem(null);
  };

  const handleNextMonth = () => {
    setMonth(prev => {
      if (prev === 12) {
        setYear(y => y + 1);
        return 1;
      }
      return prev + 1;
    });
    setEditingItem(null);
    setRevisionItem(null);
  };

  const handleCreateMonth = () => {
    if (!isAdmin) {
      openPinModal();
      return;
    }
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setYear(nextYear);
    setMonth(nextMonth);
    setEditingItem(null);
    setRevisionItem(null);
  };

  const handleDateChange = (newYear, newMonth) => {
    setYear(newYear);
    setMonth(newMonth);
    setEditingItem(null);
    setRevisionItem(null);
  };

  // Content CRUD Triggers
  const handleCreateNew = async () => {
    if (!isAdmin) {
      openPinModal();
      return;
    }

    const currentMonthItems = categoryContent.filter(item => {
      return item.date.startsWith(`${year}-${String(month).padStart(2, '0')}`);
    });

    let dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    if (currentMonthItems.length > 0) {
      const dates = currentMonthItems
        .map(item => new Date(item.date).getTime())
        .filter(t => !isNaN(t));
      if (dates.length > 0) {
        const maxTime = Math.max(...dates);
        const maxDate = new Date(maxTime);
        maxDate.setDate(maxDate.getDate() + 1);

        if (maxDate.getFullYear() === year && (maxDate.getMonth() + 1) === month) {
          dateStr = maxDate.toISOString().split('T')[0];
        } else {
          const lastDay = new Date(year, month, 0).getDate();
          dateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }
      }
    }

    const defaultType = activeCategory === 'written' ? 'blog' : 'static';
    const defaultPlatform = activeCategory === 'written' ? 'website' : 'instagram';
    const defaultName = activeCategory === 'written' ? 'New Article Draft' : 'New Content Piece';

    try {
      const newItem = await addContent({
        date: dateStr,
        name: defaultName,
        type: defaultType,
        category: activeCategory,
        platform: defaultPlatform,
        status: 'draft',
      });
      if (view !== 'list') {
        setEditingItem(newItem);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNewForDate = async (dateString) => {
    if (!isAdmin) {
      openPinModal();
      return;
    }
    const defaultType = activeCategory === 'written' ? 'blog' : 'static';
    const defaultPlatform = activeCategory === 'written' ? 'website' : 'instagram';
    const defaultName = activeCategory === 'written' ? 'New Article Draft' : 'New Content Piece';

    try {
      const newItem = await addContent({
        date: dateString,
        name: defaultName,
        type: defaultType,
        category: activeCategory,
        platform: defaultPlatform,
        status: 'draft',
      });
      setEditingItem(newItem);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateItem = async (id, updates) => {
    try {
      const updated = await updateContentItem(id, updates);
      if (editingItem && editingItem.id === id) {
        setEditingItem(updated);
      }
      if (revisionItem && revisionItem.id === id) {
        setRevisionItem(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!isAdmin) {
      openPinModal();
      return;
    }
    try {
      await removeContent(id);
      setEditingItem(null);
      if (revisionItem && revisionItem.id === id) {
        setRevisionItem(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-delete stray drafts when closed without changes
  const handleCloseEditor = async (item) => {
    setEditingItem(null);
    if (!item) return;

    const isDefaultName = item.name === 'New Content Piece' || item.name === 'New Article Draft' || !item.name.trim();
    const hasNoCaption = !item.caption?.trim();
    const hasNoSummary = !item.summary?.trim();
    const hasNoRichText = !item.richText?.trim() || item.richText === '<p><br></p>';
    const hasNoAssets = !item.assets || item.assets.length === 0;
    const hasNoPdf = !item.pdfAsset;
    const hasNoThumbnail = !item.thumbnailAsset;

    if (isAdmin && isDefaultName && hasNoCaption && hasNoSummary && hasNoRichText && hasNoAssets && hasNoPdf && hasNoThumbnail) {
      try {
        await removeContent(item.id);
      } catch (e) {
        console.error('Failed to auto-delete empty item:', e);
      }
    }
  };

  // Preview triggers with multi-image support
  const handleOpenPreview = (target) => {
    if (!target) return;

    if (target.assets && Array.isArray(target.assets) && target.assets.length > 0) {
      setPreviewAssets(target.assets);
      setPreviewInitialIndex(target.initialIndex || 0);
      setPreviewAsset(target.assets[target.initialIndex || 0]);
      setPreviewText(null);
      setPreviewCaption(target.caption || null);
    } else if (target.asset !== undefined || target.richText !== undefined) {
      setPreviewAsset(target.asset || null);
      setPreviewAssets(target.asset ? [target.asset] : []);
      setPreviewInitialIndex(0);
      setPreviewText(target.richText || null);
      setPreviewCaption(target.caption || null);
    } else {
      if (target.url) {
        setPreviewAsset(target);
        setPreviewAssets([target]);
        setPreviewInitialIndex(0);
        setPreviewText(null);
      } else if (target.richText) {
        setPreviewText(target.richText);
        setPreviewAsset(null);
        setPreviewAssets([]);
      }
      setPreviewCaption(target.caption || null);
    }
  };

  // Revision Modal Handlers
  const handleSaveFeedback = async ({ feedback, feedbackAssets, status }) => {
    if (!revisionItem) return;
    await handleUpdateItem(revisionItem.id, {
      feedback,
      feedbackAssets,
      status: status || 'revision',
      reviewedAt: new Date().toISOString(),
    });
  };

  const handleResubmitForReview = async () => {
    if (!revisionItem) return;
    await handleUpdateItem(revisionItem.id, {
      status: 'pending',
    });
  };

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <TopNav
        year={year}
        month={month}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onCreateMonth={handleCreateMonth}
        onChangeDate={handleDateChange}
        currentView={view}
        onViewChange={setView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={clearSearch}
      />

      {/* Main Content Area */}
      <main className="app-main animate-fade-in">
        <div className="app-main__subheader">
          <div className="app-main__subheader-left">
            <h2 className="app-main__month-title">
              {getMonthName(month)} {year}
            </h2>

            {/* Category Channel Switcher */}
            <div className="app-category-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'social'}
                className={`app-category-tab ${activeCategory === 'social' ? 'app-category-tab--active' : ''}`}
                onClick={() => setActiveCategory('social')}
              >
                <span>📱 Social Content</span>
                <span className="app-category-tab__badge">{socialCount}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'written'}
                className={`app-category-tab ${activeCategory === 'written' ? 'app-category-tab--active' : ''}`}
                onClick={() => setActiveCategory('written')}
              >
                <span>✍️ Written Content (Blogs & Newsletters)</span>
                <span className="app-category-tab__badge">{writtenCount}</span>
              </button>
            </div>
          </div>

          <div className="app-main__subheader-right">
            <button
              className="app-main__ai-btn"
              onClick={() => {
                if (isAdmin) {
                  setIsAiModalOpen(true);
                } else {
                  openPinModal();
                }
              }}
              type="button"
              title={`Generate ${activeCategory === 'written' ? 'editorial articles schedule' : 'social content schedule'} with AI`}
            >
              Generate Table
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton view={view} />
        ) : error ? (
          <div className="app-error">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h2>Something went wrong</h2>
            <p>{error}</p>
          </div>
        ) : filteredContent.length === 0 && !searchQuery ? (
          <EmptyState onCreateFirst={handleCreateNew} />
        ) : (
          <>
            {view === 'list' && (
              <ListView
                content={filteredContent}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                onPreview={handleOpenPreview}
                onCreateNew={handleCreateNew}
                onEditItem={setEditingItem}
                onOpenRevision={setRevisionItem}
                year={year}
                month={month}
              />
            )}

            {view === 'grid' && (
              <GridView
                content={filteredContent}
                onEditItem={setEditingItem}
                onUpdate={handleUpdateItem}
                onCreateNew={handleCreateNew}
              />
            )}

            {view === 'calendar' && (
              <CalendarView
                year={year}
                month={month}
                content={filteredContent}
                onEditItem={setEditingItem}
                onCreateNewForDate={handleCreateNewForDate}
              />
            )}
          </>
        )}

        <MonthNotes year={year} month={month} category={activeCategory} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Editing Dialog Modal (Grid & Calendar views only) */}
      {editingItem && (
        <div className="app-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditingItem(null)}>
          <div className="app-modal animate-scale-in">
            <ContentEditor
              item={editingItem}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onPreview={handleOpenPreview}
              onClose={() => handleCloseEditor(editingItem)}
              onOpenRevision={() => setRevisionItem(editingItem)}
            />
          </div>
        </div>
      )}

      {/* Multi-Image Carousel & PDF Lightbox Preview Modal */}
      {(previewAsset || previewAssets.length > 0 || previewText) && (
        <PreviewModal
          asset={previewAsset}
          assets={previewAssets}
          initialIndex={previewInitialIndex}
          richText={previewText}
          caption={previewCaption}
          onClose={() => {
            setPreviewAsset(null);
            setPreviewAssets([]);
            setPreviewInitialIndex(0);
            setPreviewText(null);
            setPreviewCaption(null);
          }}
        />
      )}

      {/* PIN Unlock Modal */}
      <PinModal isOpen={isPinModalOpen} onClose={closePinModal} />

      {/* Revision Feedback Modal */}
      {revisionItem && (
        <RevisionModal
          contentItem={revisionItem}
          onSaveFeedback={handleSaveFeedback}
          onResubmitForReview={handleResubmitForReview}
          onPreviewAsset={handleOpenPreview}
          onClose={() => setRevisionItem(null)}
        />
      )}

      {/* AI Generator Modal */}
      {isAiModalOpen && (
        <AiModal
          year={year}
          month={month}
          category={activeCategory}
          onGenerate={batchAddContent}
          onClose={() => setIsAiModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
