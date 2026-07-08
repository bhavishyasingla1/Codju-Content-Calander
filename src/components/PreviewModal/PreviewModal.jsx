import { useEffect, useCallback, useState } from 'react';
import { isImageFile, isVideoFile, isPdfFile, stripHtml } from '../../utils/helpers';
import { downloadAsset } from '../../services/contentService';
import './PreviewModal.css';

export default function PreviewModal({ asset, richText, caption, onClose }) {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    let textToCopy = '';
    if (richText) {
      textToCopy = stripHtml(richText);
    } else if (caption) {
      textToCopy = caption;
    }
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (asset?.url) {
      downloadAsset(asset.url, asset.name || 'download');
    }
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

  const hasCopyableText = !!richText || !!caption;

  return (
    <div className="preview-modal__backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal animate-scale-in">
        <div className="preview-modal__header">
          <div className="preview-modal__header-left">
            <span className="preview-modal__name">
              {richText ? 'Text Preview' : (asset?.name || 'Preview')}
            </span>
          </div>

          <div className="preview-modal__actions">
            {/* Copy Text Button */}
            {hasCopyableText && (
              <button
                className={`preview-modal__action-btn ${copied ? 'preview-modal__action-btn--success' : ''}`}
                onClick={handleCopy}
                title="Copy Caption Text"
                type="button"
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            )}

            {/* Download HD Button */}
            {asset && (
              <button
                className="preview-modal__action-btn preview-modal__action-btn--primary"
                onClick={handleDownload}
                title="Download HD Quality File"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download HD</span>
              </button>
            )}

            <button className="preview-modal__close" onClick={onClose} type="button" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="preview-modal__body">
          {renderContent()}
          {/* Display caption block if present beneath the preview asset */}
          {caption && !richText && (
            <div className="preview-modal__caption-box">
              <h4 className="preview-modal__caption-title">Caption</h4>
              <p className="preview-modal__caption-text">{caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
