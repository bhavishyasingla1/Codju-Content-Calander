import { CONTENT_TYPES } from '../../data/mockContent';
import './TypeBadge.css';

export default function TypeBadge({ type, size = 'default' }) {
  const typeInfo = CONTENT_TYPES.find(t => t.value === type) || CONTENT_TYPES[0];

  const icons = {
    static: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21,15 16,10 5,21" />
      </svg>
    ),
    carousel: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="16" height="16" rx="2" />
        <rect x="6" y="2" width="16" height="16" rx="2" />
      </svg>
    ),
    reel: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5,3 19,12 5,21 5,3" />
      </svg>
    ),
    text: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  };

  return (
    <span className={`type-badge type-badge--${type} type-badge--${size}`}>
      <span className="type-badge__icon">{icons[type]}</span>
      <span className="type-badge__label">{typeInfo.label}</span>
    </span>
  );
}
