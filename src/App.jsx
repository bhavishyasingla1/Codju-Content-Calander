import { useState } from 'react';
import { useContent } from './hooks/useContent';
import { useSearch } from './hooks/useSearch';
import TopNav from './components/TopNav/TopNav';
import ListView from './views/ListView';
import GridView from './views/GridView';
import CalendarView from './views/CalendarView';
import EmptyState from './components/EmptyState/EmptyState';
import LoadingSkeleton from './components/LoadingSkeleton/LoadingSkeleton';
import PreviewModal from './components/PreviewModal/PreviewModal';
import Footer from './components/Footer/Footer';
import ContentEditor from './components/ContentEditor/ContentEditor';
import './App.css';

export default function App() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(7); // July 2026 default
  const [view, setView] = useState('list'); // 'list' | 'grid' | 'calendar'

  // Service CRUD Hook
  const {
    content,
    loading,
    error,
    addContent,
    updateContentItem,
    removeContent,
  } = useContent(year, month);

  // Search Hook
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    filteredContent,
    clearSearch,
  } = useSearch(content);

  // Modals state
  const [editingItem, setEditingItem] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [previewText, setPreviewText] = useState(null);

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
  };

  const handleCreateMonth = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setYear(nextYear);
    setMonth(nextMonth);
    setEditingItem(null);
  };

  const handleDateChange = (newYear, newMonth) => {
    setYear(newYear);
    setMonth(newMonth);
    setEditingItem(null);
  };

  // Content CRUD Triggers
  const handleCreateNew = async () => {
    // Find all content for the current year/month
    const currentMonthItems = content.filter(item => {
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
        // Increment by 1 day
        maxDate.setDate(maxDate.getDate() + 1);
        
        // Ensure it's still within the same month
        if (maxDate.getFullYear() === year && (maxDate.getMonth() + 1) === month) {
          dateStr = maxDate.toISOString().split('T')[0];
        } else {
          const lastDay = new Date(year, month, 0).getDate();
          dateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        }
      }
    }

    try {
      const newItem = await addContent({
        date: dateStr,
        name: 'New Content Piece',
        type: 'static',
        status: 'draft',
      });
      // In grid/calendar view, open editing modal immediately. In list view, row will appear.
      if (view !== 'list') {
        setEditingItem(newItem);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNewForDate = async (dateString) => {
    try {
      const newItem = await addContent({
        date: dateString,
        name: 'New Content Piece',
        type: 'static',
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id) => {
    const confirmed = confirm('Are you sure you want to delete this content item?');
    if (!confirmed) return;

    try {
      await removeContent(id);
      setEditingItem(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Preview triggers
  const handleOpenPreview = (target) => {
    if (target.richText) {
      setPreviewText(target.richText);
    } else {
      setPreviewAsset(target);
    }
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
      </main>

      {/* Footer */}
      <Footer />

      {/* Editing Dialog Modal (Grid & Calendar views only) */}
      {editingItem && (
        <div className="app-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditingItem(null)}>
          <div className="app-modal animate-scale-in">
            <div className="app-modal__close-wrapper">
              <button className="app-modal__close-btn" onClick={() => setEditingItem(null)} type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <ContentEditor
              item={editingItem}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onPreview={handleOpenPreview}
            />
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {(previewAsset || previewText) && (
        <PreviewModal
          asset={previewAsset}
          richText={previewText}
          onClose={() => {
            setPreviewAsset(null);
            setPreviewText(null);
          }}
        />
      )}
    </div>
  );
}
