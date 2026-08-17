import { useState } from 'react';
import { generateAIContent } from '../../services/contentService';
import loaderGif from './loader.gif';
import './AiModal.css';

export default function AiModal({ year, month, category = 'social', onGenerate, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setLoadingStep(category === 'written' 
      ? 'Panda is analyzing your editorial outline & drafting schedule...' 
      : 'Panda is writing creative hooks, captions & scheduling rows...'
    );

    try {
      // Step 1: AI Generation
      const items = await generateAIContent(prompt, year, month, category);
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('No content items were generated. Please try with a more detailed prompt.');
      }

      setLoadingStep(`Panda is saving ${items.length} new content items to your calendar...`);

      // Step 2: Batch insert into database and update local state
      if (onGenerate) {
        await onGenerate(items);
      }

      setLoadingStep('Calendar updated successfully! ✨');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('AI Generation error:', err);
      setError(err.message || 'Something went wrong while generating content. Please try again.');
      setLoading(false);
    }
  };

  const isWritten = category === 'written';

  return (
    <div className="ai-modal-backdrop" onClick={loading ? undefined : onClose}>
      <div className="ai-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal__header">
          <div className="ai-modal__header-title-wrap">
            <span className="ai-modal__sparkle-icon">✨</span>
            <h3 className="ai-modal__title">
              {isWritten ? 'Generate Written Editorial Schedule with AI' : 'Generate Social Content Table with AI'}
            </h3>
          </div>
          {!loading && (
            <button className="ai-modal__close-btn" onClick={onClose} title="Close" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="ai-modal__body">
          {error && (
            <div className="ai-modal__error animate-fade-in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="ai-modal__loading animate-fade-in">
              <div className="ai-modal__panda-container">
                <img src={loaderGif} className="ai-modal__panda-gif" alt="Panda scheduling content..." />
              </div>
              <div className="ai-modal__loading-line-container">
                <div className="ai-modal__loading-line" />
              </div>
              <p className="ai-modal__loading-text">{loadingStep}</p>
            </div>
          ) : (
            <>
              <div className="ai-modal__field">
                <label className="ai-modal__label">
                  {isWritten ? 'Paste Your Article Topics, Outlines, or Themes' : 'Paste Your Content Ideas, Themes, or Outline'}
                </label>
                <textarea
                  className="ai-modal__textarea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isWritten
                    ? "Example: 'Plan 4 weekly blog posts and 2 bi-weekly newsletters for this month. Topics: Next.js edge caching, database indexing, and designing AI agents for production.'"
                    : "Example: 'Plan 5 high-converting posts for Codju marketing. Include 1 launch carousel, 1 product spotlight, 1 behind-the-scenes video idea, and 2 thought leadership posts.'"
                  }
                  required
                  rows={7}
                  autoFocus
                />
              </div>

              <div className="ai-modal__hints">
                <span className="ai-modal__hint-badge">💡 Tip:</span>
                <span className="ai-modal__hint-text">
                  You can paste bullet points, article titles, or rough notes. AI will structure dates, names, formats, and ready-to-use captions automatically.
                </span>
              </div>

              <div className="ai-modal__footer">
                <button className="ai-modal__btn-cancel" onClick={onClose} type="button">
                  Cancel
                </button>
                <button
                  className="ai-modal__btn-submit"
                  type="submit"
                  disabled={!prompt.trim()}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Generate Table
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
