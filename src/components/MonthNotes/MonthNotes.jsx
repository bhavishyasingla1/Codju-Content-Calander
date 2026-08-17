import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNotesByMonth, saveNotesByMonth } from '../../services/contentService';
import { useAutoSave } from '../../hooks/useAutoSave';
import { getMonthName, sanitizeUrl, safeJsonParse } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import './MonthNotes.css';

/**
 * Safely parse existing notes content into links and text body
 */
function parseNotesPayload(raw) {
  if (!raw) return { links: [], notes: '' };

  const parsed = safeJsonParse(raw, null);
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.links)) {
    const cleanLinks = parsed.links
      .map(link => {
        const cleanUrl = sanitizeUrl(link.url);
        return cleanUrl ? { ...link, url: cleanUrl } : null;
      })
      .filter(Boolean);
    return {
      links: cleanLinks,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    };
  }

  // Legacy plain text parsing fallback
  if (typeof raw === 'string') {
    const lines = raw.split('\n');
    const links = [];
    const remainingLines = [];

    for (const line of lines) {
      const urlMatch = line.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) {
        let title = line.replace(urlMatch[0], '').replace(/[-–—:|()[\]]/g, ' ').trim();
        if (!title) {
          try {
            const urlObj = new URL(urlMatch[0]);
            title = urlObj.hostname.replace('www.', '');
          } catch {
            title = 'Resource Link';
          }
        }
        const cleanUrl = sanitizeUrl(urlMatch[0]);
        if (cleanUrl) {
          links.push({
            id: 'l_' + Math.random().toString(36).substr(2, 7),
            title: title || 'Resource Link',
            url: cleanUrl,
          });
        }
      } else {
        remainingLines.push(line);
      }
    }

    return {
      links,
      notes: remainingLines.join('\n').trim(),
    };
  }

  return { links: [], notes: String(raw) };
}

export default function MonthNotes({ year, month, category = 'social' }) {
  const { isAdmin, openPinModal } = useAuth();
  const baseKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthKey = category === 'written' ? `${baseKey}-written` : `${baseKey}-social`;
  const cacheKey = `codju_notes_cache_${monthKey}`;

  // Instant SWR Cache
  const [links, setLinks] = useState(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = parseNotesPayload(cached);
        return parsed.links || [];
      }
    } catch {}
    return [];
  });

  const [notes, setNotes] = useState(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = parseNotesPayload(cached);
        return parsed.notes || '';
      }
    } catch {}
    return '';
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return false;
    } catch {}
    return true;
  });

  const [error, setError] = useState(null);

  // In-flight typing ref so background sync doesn't overwrite active typing
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);

  // New link form state
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  const titleInputRef = useRef(null);

  // Helper to persist cache
  const persistNotesCache = useCallback((rawNotes) => {
    try {
      localStorage.setItem(cacheKey, typeof rawNotes === 'string' ? rawNotes : JSON.stringify(rawNotes));
    } catch {
      // ignore
    }
  }, [cacheKey]);

  // Load notes function (supports silent background revalidation)
  const loadNotes = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchNotesByMonth(year, month, category);
      if (!isTypingRef.current) {
        const parsed = parseNotesPayload(data.notes || '');
        setLinks(parsed.links);
        setNotes(parsed.notes);
        persistNotesCache(data.notes || '');
      }
    } catch (err) {
      if (!isSilent) {
        setError(err.message || 'Failed to load notes');
      }
    } finally {
      setLoading(false);
    }
  }, [year, month, category, persistNotesCache]);

  // Fetch notes on month/year/category change
  useEffect(() => {
    let hasCache = false;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        hasCache = true;
        const parsed = parseNotesPayload(cached);
        setLinks(parsed.links);
        setNotes(parsed.notes);
        setLoading(false);
      }
    } catch {}

    if (!hasCache) {
      setLinks([]);
      setNotes('');
      setLoading(true);
    }

    loadNotes(hasCache);
  }, [year, month, category, cacheKey, loadNotes]);

  // Multi-Device & Focus Sync for notes
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isTypingRef.current && isMounted) {
        loadNotes(true);
      }
    }, 4000);

    const handleFocus = () => {
      if (document.visibilityState === 'visible' && !isTypingRef.current && isMounted) {
        loadNotes(true);
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadNotes]);

  // Save notes handler (serializes links + notes to JSON)
  const saveFunction = useCallback(async () => {
    if (!isAdmin) return;
    const payload = JSON.stringify({ links, notes });
    persistNotesCache(payload);
    await saveNotesByMonth(year, month, payload, category);
  }, [year, month, category, links, notes, isAdmin, persistNotesCache]);

  const { saveStatus, triggerSave } = useAutoSave(saveFunction, 2000);

  const handleNotesChange = (e) => {
    if (!isAdmin) {
      openPinModal();
      return;
    }
    isTypingRef.current = true;
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 3000);

    setNotes(e.target.value);
    triggerSave();
  };

  const handleStartAddLink = () => {
    if (!isAdmin) {
      openPinModal();
      return;
    }
    setIsAddingLink(true);
    setNewTitle('');
    setNewUrl('');
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const handleCancelAddLink = () => {
    setIsAddingLink(false);
    setNewTitle('');
    setNewUrl('');
  };

  const handleConfirmAddLink = (e) => {
    e?.preventDefault();
    if (!newUrl.trim()) return;

    const validatedUrl = sanitizeUrl(newUrl.trim());
    if (!validatedUrl) {
      alert('Please enter a valid website URL (e.g. https://notion.so/doc)');
      return;
    }

    let resolvedTitle = newTitle.trim();
    if (!resolvedTitle) {
      try {
        const urlObj = new URL(validatedUrl);
        resolvedTitle = urlObj.hostname.replace('www.', '');
      } catch {
        resolvedTitle = 'Link ' + (links.length + 1);
      }
    }

    const newLink = {
      id: 'l_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      title: resolvedTitle,
      url: validatedUrl,
    };

    setLinks(prev => [...prev, newLink]);
    setIsAddingLink(false);
    setNewTitle('');
    setNewUrl('');
    triggerSave();
  };

  const handleDeleteLink = (id) => {
    setLinks(prev => prev.filter(link => link.id !== id));
    triggerSave();
  };

  const handleCopyLink = (link) => {
    if (!link?.url) return;
    navigator.clipboard.writeText(link.url);
    setCopiedLinkId(link.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const getDomain = (urlStr) => {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace('www.', '');
    } catch {
      return urlStr;
    }
  };

  return (
    <div className="month-notes-card animate-fade-in-up">
      {/* Card Header */}
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
            {category === 'written' ? '✍️ Written Content Resource Links & Notes' : '📱 Social Content Resource Links & Notes'} — {getMonthName(month)} {year}
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
          <>
            {/* Subsection 1: Links with Title Boxes */}
            <div className="month-notes__section">
              <div className="month-notes__section-header">
                <div className="month-notes__section-title-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <h4 className="month-notes__section-title">
                    {category === 'written' ? 'Article Links & Research References' : 'Reference Links & Inspiration'}
                  </h4>
                  <span className="month-notes__count-badge">{links.length}</span>
                </div>

                {!isAddingLink && (
                  <button
                    className="month-notes__add-btn"
                    onClick={handleStartAddLink}
                    type="button"
                    title="Add a new resource link"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Link</span>
                  </button>
                )}
              </div>

              {/* Add Link Form */}
              {isAddingLink && (
                <form onSubmit={handleConfirmAddLink} className="month-notes__add-link-form animate-scale-in">
                  <div className="month-notes__form-row">
                    <input
                      ref={titleInputRef}
                      type="text"
                      className="month-notes__form-input"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Link Title (e.g. ChatGPT Prompt Thread, Medium Outline)"
                    />
                    <input
                      type="text"
                      className="month-notes__form-input"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="URL (e.g. https://chatgpt.com/...)"
                      required
                    />
                  </div>
                  <div className="month-notes__form-actions">
                    <button
                      type="button"
                      onClick={handleCancelAddLink}
                      className="month-notes__form-btn month-notes__form-btn--cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newUrl.trim()}
                      className="month-notes__form-btn month-notes__form-btn--submit"
                    >
                      Add Link
                    </button>
                  </div>
                </form>
              )}

              {/* Links Grid */}
              <div className="month-notes__links-grid">
                {links.map((link) => (
                  <div key={link.id} className="month-notes__link-card animate-scale-in">
                    <div className="month-notes__link-content">
                      <span className="month-notes__link-title" title={link.title}>
                        {link.title}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="month-notes__link-url"
                        title={link.url}
                      >
                        <span>{getDomain(link.url)}</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>

                    <div className="month-notes__link-actions">
                      <button
                        className="month-notes__link-btn"
                        onClick={() => handleCopyLink(link)}
                        title="Copy link URL"
                        type="button"
                      >
                        {copiedLinkId === link.id ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>

                      {isAdmin && (
                        <button
                          className="month-notes__link-btn month-notes__link-btn--delete"
                          onClick={() => handleDeleteLink(link.id)}
                          title="Delete link"
                          type="button"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsection 2: Dedicated Month Notes Box */}
            <div className="month-notes__section">
              <div className="month-notes__section-header">
                <div className="month-notes__section-title-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <h4 className="month-notes__section-title">
                    {category === 'written' ? 'Editorial Strategy & Blog Outlines' : 'Social Campaign Strategy & Hook Notes'}
                  </h4>
                </div>
              </div>

              <textarea
                className="month-notes-card__textarea"
                value={notes}
                onChange={handleNotesChange}
                placeholder={
                  isAdmin
                    ? (category === 'written'
                        ? `Write your editorial themes, newsletter topics, SEO keywords, or blog outlines for ${getMonthName(month)} ${year}...`
                        : `Write your campaign goals, brand guidelines, content prompts, or ideas for ${getMonthName(month)} ${year}...`)
                    : `${category === 'written' ? 'Written content' : 'Social content'} strategy & notes for ${getMonthName(month)} ${year} (Admin access required to edit)`
                }
                rows={6}
                readOnly={!isAdmin}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
