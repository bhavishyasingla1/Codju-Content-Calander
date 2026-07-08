import './EmptyState.css';

export default function EmptyState({ onCreateFirst }) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state__mascot">
        <img src="/assets/codju-mascot.png" alt="Codju Panda" className="empty-state__mascot-img" />
      </div>
      <h2 className="empty-state__heading">No content created yet.</h2>
      <p className="empty-state__text">
        Start building your content calendar for this month.
      </p>
      <button className="empty-state__btn" onClick={onCreateFirst} type="button" id="create-first-content">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Create First Content
      </button>
    </div>
  );
}
