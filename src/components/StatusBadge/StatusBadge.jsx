import { STATUSES } from '../../data/mockContent';
import './StatusBadge.css';

const statusOrder = ['draft', 'ready', 'published'];

export default function StatusBadge({ status, onClick, size = 'default' }) {
  const statusInfo = STATUSES.find(s => s.value === status) || STATUSES[0];

  const handleClick = () => {
    if (onClick) {
      const currentIndex = statusOrder.indexOf(status);
      const nextIndex = (currentIndex + 1) % statusOrder.length;
      onClick(statusOrder[nextIndex]);
    }
  };

  return (
    <button
      className={`status-badge status-badge--${status} status-badge--${size}`}
      onClick={handleClick}
      title={`Status: ${statusInfo.label}. Click to change.`}
      type="button"
    >
      <span className="status-badge__dot" />
      <span className="status-badge__label">{statusInfo.label}</span>
    </button>
  );
}
