import { useState, useCallback } from 'react';
import { CONTENT_TYPES } from '../../data/mockContent';
import UploadZone from '../UploadZone/UploadZone';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import StatusBadge from '../StatusBadge/StatusBadge';
import SaveButton from '../SaveButton/SaveButton';
import { useAutoSave } from '../../hooks/useAutoSave';
import { uploadAsset } from '../../services/contentService';
import './ContentEditor.css';

export default function ContentEditor({ item, onUpdate, onDelete, onPreview }) {
  const [formData, setFormData] = useState({ ...item });

  const saveFunction = useCallback(async () => {
    await onUpdate(item.id, formData);
  }, [item.id, formData, onUpdate]);

  const { saveStatus, triggerSave, forceSave } = useAutoSave(saveFunction, 3000);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    triggerSave();
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => ({ ...prev, type: newType }));
    triggerSave();
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
    onUpdate(item.id, { ...formData, status: newStatus });
  };

  const handleUpload = async (file) => {
    const asset = await uploadAsset(file);
    setFormData(prev => ({
      ...prev,
      assets: [...(prev.assets || []), asset],
    }));
    triggerSave();
  };

  const handleRemoveAsset = (assetId) => {
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.filter((a, idx) => (a.id || idx) !== assetId),
    }));
    triggerSave();
  };

  const renderTypeFields = () => {
    switch (formData.type) {
      case 'static':
        return (
          <>
            <div className="editor__field">
              <label className="editor__label">Caption</label>
              <textarea
                className="editor__textarea"
                value={formData.caption || ''}
                onChange={(e) => handleChange('caption', e.target.value)}
                placeholder="Write your caption..."
                rows={4}
              />
            </div>
            <UploadZone
              label="Upload Asset (Image, Video, or PDF)"
              assets={formData.assets || []}
              onUpload={handleUpload}
              onRemove={handleRemoveAsset}
              onPreview={onPreview}
              accept="image/*,video/*,application/pdf"
            />
          </>
        );

      case 'carousel':
        return (
          <>
            <div className="editor__field">
              <label className="editor__label">Caption</label>
              <textarea
                className="editor__textarea"
                value={formData.caption || ''}
                onChange={(e) => handleChange('caption', e.target.value)}
                placeholder="Write your caption..."
                rows={4}
              />
            </div>
            <UploadZone
              label="Upload Images (4-5 Slides)"
              assets={(formData.assets || []).filter(a => a.type?.startsWith('image/'))}
              onUpload={handleUpload}
              onRemove={handleRemoveAsset}
              onPreview={onPreview}
              multiple
              accept="image/*"
            />
            <UploadZone
              label="Upload PDF"
              assets={formData.pdfAsset ? [formData.pdfAsset] : []}
              onUpload={async (file) => {
                const asset = await uploadAsset(file);
                setFormData(prev => ({ ...prev, pdfAsset: asset }));
                triggerSave();
              }}
              onRemove={() => {
                setFormData(prev => ({ ...prev, pdfAsset: null }));
                triggerSave();
              }}
              onPreview={onPreview}
              accept=".pdf"
            />
          </>
        );

      case 'reel':
        return (
          <>
            <div className="editor__field">
              <label className="editor__label">Caption</label>
              <textarea
                className="editor__textarea"
                value={formData.caption || ''}
                onChange={(e) => handleChange('caption', e.target.value)}
                placeholder="Write your caption..."
                rows={4}
              />
            </div>
            <UploadZone
              label="Upload Reel Video"
              assets={formData.assets || []}
              onUpload={handleUpload}
              onRemove={handleRemoveAsset}
              onPreview={onPreview}
              accept="video/*"
            />
          </>
        );

      case 'text':
        return (
          <>
            <div className="editor__field">
              <label className="editor__label">Content (LinkedIn/Text Post)</label>
              <RichTextEditor
                value={formData.richText || ''}
                onChange={(html) => handleChange('richText', html)}
                placeholder="Start writing your post..."
                showCopyButton
                showCharCount
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="editor animate-fade-in-up">
      <div className="editor__header">
        <div className="editor__header-left">
          <h3 className="editor__title">Edit Content</h3>
          <StatusBadge status={formData.status} onClick={handleStatusChange} />
        </div>
        <div className="editor__header-right">
          {saveStatus !== 'idle' && (
            <span className={`editor__auto-save editor__auto-save--${saveStatus}`}>
              {saveStatus === 'saving' && 'Auto-saving...'}
              {saveStatus === 'saved' && 'Auto-saved ✓'}
            </span>
          )}
          <SaveButton onSave={forceSave} saveStatus={saveStatus} />
          <button className="editor__delete-btn" onClick={() => onDelete(item.id)} title="Delete Content" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="editor__body">
        {/* Common fields */}
        <div className="editor__row">
          <div className="editor__field editor__field--flex">
            <label className="editor__label">Date</label>
            <input
              type="date"
              className="editor__input"
              value={formData.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>
          <div className="editor__field editor__field--flex">
            <label className="editor__label">Content Name</label>
            <input
              type="text"
              className="editor__input"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Content name..."
            />
          </div>
          <div className="editor__field">
            <label className="editor__label">Type</label>
            <select
              className="editor__select"
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {CONTENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type-specific fields */}
        <div className="editor__type-fields">
          {renderTypeFields()}
        </div>
      </div>
    </div>
  );
}
