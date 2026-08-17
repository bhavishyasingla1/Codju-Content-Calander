import { STATUSES } from '../../data/mockContent';
import './StatusBadge.css';

export default function StatusBadge({ status, onClick, onOpenRevision, disabled = false, size = 'default' }) {
  const statusInfo = STATUSES.find(s => s.value === status) || STATUSES[0];

  const handleClick = (e) => {
    e?.stopPropagation();
    if (status === 'revision' && onOpenRevision) {
      onOpenRevision();
      return;
    }
    if (disabled) return;
    if (onClick) {
      onClick();
    }
  };

  const isClickable = !disabled || (status === 'revision' && !!onOpenRevision);

  return (
    <button
      className={`status-badge status-badge--${status} status-badge--${size} ${!isClickable ? 'status-badge--disabled' : ''}`}
      onClick={handleClick}
      title={
        status === 'revision'
          ? `Status: Needs Changes. Click to view feedback.`
          : disabled
          ? `Status: ${statusInfo.label}`
          : `Status: ${statusInfo.label}. Click to manage.`
      }
      type="button"
      disabled={!isClickable}
    >
      <span className="status-badge__dot" />
      <span className="status-badge__label">{statusInfo.label}</span>
      {status === 'revision' && (
        <span className="status-badge__feedback-icon" title="Feedback notes available">
          💬
        </span>
      )}
    </button>
  );
}
