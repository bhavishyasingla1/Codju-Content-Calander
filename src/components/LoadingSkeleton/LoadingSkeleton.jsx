import './LoadingSkeleton.css';

export default function LoadingSkeleton({ view = 'list' }) {
  const renderListSkeleton = () => (
    <div className="skeleton-list">
      <div className="skeleton-list__header">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-block skeleton-block--header" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-list__row">
          <div className="skeleton-block skeleton-block--cell" />
          <div className="skeleton-block skeleton-block--cell skeleton-block--double" />
          <div className="skeleton-block skeleton-block--cell" />
          <div className="skeleton-block skeleton-block--cell skeleton-block--triple" />
          <div className="skeleton-block skeleton-block--cell" />
          <div className="skeleton-block skeleton-block--cell" />
          <div className="skeleton-block skeleton-block--cell" />
          <div className="skeleton-block skeleton-block--cell" />
        </div>
      ))}
    </div>
  );

  const renderGridSkeleton = () => (
    <div className="skeleton-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-block skeleton-card__thumb" />
          <div className="skeleton-card__body">
            <div className="skeleton-block skeleton-card__date" />
            <div className="skeleton-block skeleton-card__title" />
            <div className="skeleton-block skeleton-card__text" />
            <div className="skeleton-card__footer">
              <div className="skeleton-block skeleton-card__badge" />
              <div className="skeleton-block skeleton-card__btn" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCalendarSkeleton = () => (
    <div className="skeleton-calendar">
      <div className="skeleton-calendar__header">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton-block skeleton-calendar__day-name" />
        ))}
      </div>
      <div className="skeleton-calendar__grid">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="skeleton-calendar__cell">
            <div className="skeleton-block skeleton-calendar__number" />
            {i % 5 === 0 && <div className="skeleton-block skeleton-calendar__item" />}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="loading-skeleton">
      {view === 'grid' && renderGridSkeleton()}
      {view === 'calendar' && renderCalendarSkeleton()}
      {view === 'list' && renderListSkeleton()}
    </div>
  );
}
