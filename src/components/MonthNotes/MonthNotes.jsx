import { useState, useEffect, useCallback } from 'react';
import { fetchNotesByMonth, saveNotesByMonth } from '../../services/contentService';
import { useAutoSave } from '../../hooks/useAutoSave';
import { getMonthName } from '../../utils/helpers';
import './MonthNotes.css';

export default function MonthNotes({ year, month }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notes on month/year change
  useEffect(() => {
    let active = true;
    async function loadNotes() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotesByMonth(year, month);
        if (active) {
          setNotes(data.notes || '');
        }
      } catch (err) {
        if (active) {
          setError('Failed to load notes');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadNotes();
    return () => {
      active = false;
    };
  }, [year, month]);

  // Save notes handler
  const saveFunction = useCallback(async () => {
    await saveNotesByMonth(year, month, notes);
  }, [year, month, notes]);

  const { saveStatus, triggerSave } = useAutoSave(saveFunction, 2000);

  const handleChange = (e) => {
    setNotes(e.target.value);
    triggerSave();
  };

  return (
    <div className="month-notes-card animate-fade-in-up">
      <div className="month-notes-card__header">
        <div className="month-notes-card__title-group">
          <svg className="month-notes-card__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <h3 className="month-notes-card__title">
            Notes & Links — {getMonthName(month)} {year}
          </h3>
        </div>
        {saveStatus !== 'idle' && (
          <span className={`month-notes-card__save-status month-notes-card__save-status--${saveStatus}`}>
            {saveStatus === 'saving' && 'Auto-saving...'}
            {saveStatus === 'saved' && 'Saved ✓'}
            {saveStatus === 'error' && 'Save failed ❌'}
          </span>
        )}
      </div>

      <div className="month-notes-card__body">
        {loading ? (
          <div className="month-notes-card__loading">
            <div className="month-notes-card__shimmer" />
          </div>
        ) : error ? (
          <div className="month-notes-card__error">{error}</div>
        ) : (
          <textarea
            className="month-notes-card__textarea"
            value={notes}
            onChange={handleChange}
            placeholder={`Add notes, links, campaign goals, or hashtags for ${getMonthName(month)} content calendar here...`}
            rows={6}
          />
        )}
      </div>
    </div>
  );
}
