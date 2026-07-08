import { useState } from 'react';
import { generateAIContent } from '../../services/contentService';
import loaderGif from './loader.gif';
import './AiModal.css';

export default function AiModal({ year, month, onGenerate, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const items = await generateAIContent(prompt, year, month);
      onGenerate(items);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while generating content.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-modal-backdrop" onClick={onClose}>
      <div className="ai-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal__header">
          <h3 className="ai-modal__title">Generate Content Schedule with AI</h3>
          <button className="ai-modal__close-btn" onClick={onClose} title="Close" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ai-modal__body">
          {error && <div className="ai-modal__error">{error}</div>}

          {loading ? (
            <div className="ai-modal__loading">
              <img src={loaderGif} className="ai-modal__loader-gif" alt="Panda loading..." />
              <p className="ai-modal__loading-text">Panda is writing the captions and scheduling your rows...</p>
            </div>
          ) : (
            <>
              <div className="ai-modal__field">
                <label className="ai-modal__label">Paste Your Content Ideas, Scripts, or Outline</label>
                <textarea
                  className="ai-modal__textarea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: 'Create 5 posts for a marketing dashboard startup. One static welcome, one carousel explaining features, one reel previewing team workflow, and two LinkedIn text posts sharing stats.'"
                  required
                  rows={8}
                />
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
                  Generate Schedule
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
