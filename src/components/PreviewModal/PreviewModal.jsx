import { useEffect, useCallback } from 'react';
import { isImageFile, isVideoFile, isPdfFile } from '../../utils/helpers';
import './PreviewModal.css';

export default function PreviewModal({ asset, richText, onClose }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderContent = () => {
    // Rich text preview
    if (richText) {
      return (
        <div className="preview-modal__text">
          <div className="preview-modal__text-content" dangerouslySetInnerHTML={{ __html: richText }} />
        </div>
      );
    }

    if (!asset) return null;

    // Image preview
    if (isImageFile(asset.name)) {
      return (
        <div className="preview-modal__image-wrap">
          <img src={asset.url} alt={asset.name} className="preview-modal__image" />
        </div>
      );
    }

    // Video preview
    if (isVideoFile(asset.name)) {
      return (
        <div className="preview-modal__video-wrap">
          <video src={asset.url} controls className="preview-modal__video" autoPlay>
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    // PDF preview
    if (isPdfFile(asset.name)) {
      return (
        <div className="preview-modal__pdf-wrap">
          <iframe src={asset.url} className="preview-modal__pdf" title={asset.name} />
        </div>
      );
    }

    // Generic file
    return (
      <div className="preview-modal__generic">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13,2 13,9 20,9" />
        </svg>
        <p>{asset.name}</p>
      </div>
    );
  };

  return (
    <div className="preview-modal__backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal animate-scale-in">
        <div className="preview-modal__header">
          <span className="preview-modal__name">
            {richText ? 'Text Preview' : (asset?.name || 'Preview')}
          </span>
          <button className="preview-modal__close" onClick={onClose} type="button" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="preview-modal__body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
