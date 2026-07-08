import { useState } from 'react';
import ContentRow from '../components/ContentRow/ContentRow';
import './ListView.css';

export default function ListView({
  content,
  onUpdate,
  onDelete,
  onPreview,
  onCreateNew,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
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
          // Skip the editor rows which have class content-row__editor-row
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

  return (
    <div className="list-view-container animate-fade-in" onKeyDown={handleKeyDown}>
      <div className="list-view__scroll">
        <table className="list-view__table">
          <thead>
            <tr>
              <th className="list-view__th list-view__th--drag" />
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
            {content.map(item => (
              <ContentRow
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                onToggleExpand={() => handleToggleExpand(item.id)}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </tbody>
        </table>
      </div>

      <button className="list-view__add-row" onClick={onCreateNew} type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Row
      </button>
    </div>
  );
}
