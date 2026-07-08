import { useState, useEffect, useRef } from 'react';
import ContentRow from '../components/ContentRow/ContentRow';
import './ListView.css';

export default function ListView({
  content,
  onUpdate,
  onDelete,
  onPreview,
  onCreateNew,
  onEditItem,
  year,
  month,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [localContent, setLocalContent] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const dragNode = useRef(null);

  // Sync state and apply custom sort order from localStorage
  useEffect(() => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const storedOrder = localStorage.getItem(`codju_order_${monthKey}`);
    
    let sortedContent = [...content];
    if (storedOrder) {
      const idArray = JSON.parse(storedOrder);
      sortedContent.sort((a, b) => {
        const idxA = idArray.indexOf(a.id);
        const idxB = idArray.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }
    setLocalContent(sortedContent);
  }, [content, year, month]);

  // Reset selections when changing view/month
  useEffect(() => {
    setSelectedIds([]);
  }, [year, month]);

  const handleToggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === localContent.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localContent.map(item => item.id));
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = confirm(`Are you sure you want to delete the ${selectedIds.length} selected items?`);
    if (!confirmed) return;

    try {
      for (const id of selectedIds) {
        await onDelete(id, true); // Silent delete to bypass multiple confirm alerts
      }
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to bulk delete items:', e);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Swap elements in state immediately for visual feedback
    const updated = [...localContent];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setLocalContent(updated);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      const idOrder = localContent.map(item => item.id);
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      localStorage.setItem(`codju_order_${monthKey}`, JSON.stringify(idOrder));
    }
    setDraggedIndex(null);
    dragNode.current = null;
  };

  // Keyboard navigation helpers
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'INPUT') {
        const currentTd = activeElement.closest('td');
        const currentTr = activeElement.closest('tr');
        if (currentTd && currentTr) {
          const cellIndex = Array.from(currentTr.children).indexOf(currentTd);
          const nextTr = currentTr.nextElementSibling;
          let targetTr = nextTr;
          while (targetTr && targetTr.classList.contains('content-row__editor-row')) {
            targetTr = targetTr.nextElementSibling;
          }
          if (targetTr) {
            const targetCell = targetTr.children[cellIndex];
            const targetInput = targetCell?.querySelector('input, select');
            targetInput?.focus();
            e.preventDefault();
          }
        }
      }
    }
  };

  const isAllSelected = localContent.length > 0 && selectedIds.length === localContent.length;

  return (
    <div className="list-view-container animate-fade-in" onKeyDown={handleKeyDown}>
      <div className="list-view__scroll">
        <table className="list-view__table">
          <thead>
            <tr>
              <th className="list-view__th list-view__th--drag" />
              <th className="list-view__th list-view__th--checkbox">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="list-view__checkbox"
                />
              </th>
              <th className="list-view__th">Date</th>
              <th className="list-view__th">Content Name</th>
              <th className="list-view__th">Type</th>
              <th className="list-view__th">Summary</th>
              <th className="list-view__th list-view__th--center">Content</th>
              <th className="list-view__th list-view__th--center">Upload</th>
              <th className="list-view__th list-view__th--center">View</th>
              <th className="list-view__th">Status</th>
            </tr>
          </thead>
          <tbody>
            {localContent.map((item, idx) => (
              <ContentRow
                key={item.id}
                item={item}
                index={idx}
                isExpanded={expandedId === item.id}
                onToggleExpand={() => handleToggleExpand(item.id)}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onPreview={onPreview}
                onEditItem={onEditItem}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragging={draggedIndex === idx}
                isSelected={selectedIds.includes(item.id)}
                onSelectChange={() => handleSelectRow(item.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="list-view__footer-actions">
        <button className="list-view__add-row" onClick={onCreateNew} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Row
        </button>

        {selectedIds.length > 0 && (
          <button className="list-view__delete-bulk animate-scale-in" onClick={handleBulkDelete} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>
    </div>
  );
}
