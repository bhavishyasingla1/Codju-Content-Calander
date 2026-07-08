import { useState } from 'react';
import TypeBadge from '../TypeBadge/TypeBadge';
import StatusBadge from '../StatusBadge/StatusBadge';
import ContentEditor from '../ContentEditor/ContentEditor';
import SaveButton from '../SaveButton/SaveButton';
import { formatDate } from '../../utils/helpers';
import { PLATFORMS, CONTENT_TYPES } from '../../data/mockContent';
import './ContentRow.css';

export default function ContentRow({
  item,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onPreview,
  saveStatus,
  onEditItem,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isSelected,
  onSelectChange,
}) {
  const [localItem, setLocalItem] = useState({ ...item });
  const [isDraggable, setIsDraggable] = useState(false);

  const handleInputChange = (field, value) => {
    const updated = { ...localItem, [field]: value };
    setLocalItem(updated);
    onUpdate(item.id, { [field]: value });
  };

  const handleStatusChange = (newStatus) => {
    const updated = { ...localItem, status: newStatus };
    setLocalItem(updated);
    onUpdate(item.id, { status: newStatus });
  };

  const fileCount = item.assets?.length || 0;
  const hasMedia = fileCount > 0 || !!item.thumbnailAsset || !!item.pdfAsset;

  const handleViewPreview = () => {
    if (item.type === 'text' && item.richText) {
      onPreview({ richText: item.richText, caption: item.caption });
    } else if (item.thumbnailAsset) {
      onPreview({ asset: item.thumbnailAsset, caption: item.caption });
    } else if (item.assets && item.assets.length > 0) {
      onPreview({ asset: item.assets[0], caption: item.caption });
    } else if (item.pdfAsset) {
      onPreview({ asset: item.pdfAsset, caption: item.caption });
    }
  };

  const handleClose = () => {
    onToggleExpand();

    const isDefaultName = item.name === 'New Content Piece' || !item.name.trim();
    const hasNoCaption = !item.caption?.trim();
    const hasNoSummary = !item.summary?.trim();
    const hasNoRichText = !item.richText?.trim() || item.richText === '<p><br></p>';
    const hasNoAssets = !item.assets || item.assets.length === 0;
    const hasNoPdf = !item.pdfAsset;
    const hasNoThumbnail = !item.thumbnailAsset;

    if (isDefaultName && hasNoCaption && hasNoSummary && hasNoRichText && hasNoAssets && hasNoPdf && hasNoThumbnail) {
      onDelete(item.id, true);
    }
  };

  return (
    <>
      <tr
        className={`content-row ${isExpanded ? 'content-row--expanded' : ''} ${isDragging ? 'content-row--dragging' : ''}`}
        id={`row-${item.id}`}
        draggable={isDraggable}
        onDragStart={(e) => {
          setIsDraggable(false); // Reset once dragging initiates
          onDragStart(e, index);
        }}
        onDragOver={(e) => onDragOver(e, index)}
        onDragEnd={onDragEnd}
      >
        {/* Cell: Drag Handle */}
        <td className="content-row__cell content-row__cell--drag">
          <div
            className="content-row__drag-handle"
            title="Drag to reorder"
            onMouseDown={() => setIsDraggable(true)}
            onMouseUp={() => setIsDraggable(false)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="5" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="9" cy="19" r="1.5" />
              <circle cx="15" cy="5" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="15" cy="19" r="1.5" />
            </svg>
          </div>
        </td>

        {/* Cell: Checkbox selection */}
        <td className="content-row__cell content-row__cell--checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelectChange}
            className="content-row__checkbox"
          />
        </td>

        {/* Cell: Date */}
        <td className="content-row__cell content-row__cell--date">
          <input
            type="date"
            className="content-row__input content-row__input--date"
            value={localItem.date || ''}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </td>

        {/* Cell: Name */}
        <td className="content-row__cell content-row__cell--name">
          <input
            type="text"
            className="content-row__input content-row__input--name"
            value={localItem.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Content name..."
          />
        </td>

        {/* Cell: Type */}
        <td className="content-row__cell content-row__cell--type">
          <select
            className="content-row__select"
            value={localItem.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            {CONTENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </td>

        {/* Cell: Summary */}
        <td className="content-row__cell content-row__cell--summary">
          <input
            type="text"
            className="content-row__input content-row__input--summary"
            value={localItem.summary || ''}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            placeholder="Enter summary..."
          />
        </td>

        {/* Cell: Expand Editor */}
        <td className="content-row__cell content-row__cell--center">
          <button
            className={`content-row__btn-expand ${isExpanded ? 'content-row__btn-expand--active' : ''}`}
            onClick={onToggleExpand}
            title={isExpanded ? 'Collapse Editor' : 'Expand Editor'}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </td>

        {/* Cell: Upload Indicator */}
        <td className="content-row__cell content-row__cell--center">
          <button
            className={`content-row__btn-upload ${fileCount > 0 ? 'content-row__btn-upload--has-files' : ''}`}
            onClick={() => onEditItem(item)}
            title={`${fileCount} files uploaded. Click to edit/upload.`}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {fileCount > 0 && <span className="content-row__file-count">{fileCount}</span>}
          </button>
        </td>

        {/* Cell: View Preview */}
        <td className="content-row__cell content-row__cell--center">
          <button
            className="content-row__btn-view"
            onClick={handleViewPreview}
            disabled={!hasMedia && !(item.type === 'text' && item.richText)}
            title="View Preview"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </td>

        {/* Cell: Status */}
        <td className="content-row__cell content-row__cell--status">
          <StatusBadge status={item.status} onClick={handleStatusChange} size="small" />
        </td>
      </tr>

      {/* Expandable Editor Row */}
      {isExpanded && (
        <tr className="content-row__editor-row">
          <td colSpan={11} className="content-row__editor-cell">
            <div className="content-row__editor-wrapper">
              <ContentEditor
                item={item}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onPreview={onPreview}
                onClose={handleClose}
                showSummary={true}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
