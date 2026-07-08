import { getDaysInMonth, getFirstDayOfMonth, getMonthName } from '../utils/helpers';
import { CONTENT_TYPES } from '../data/mockContent';
import './CalendarView.css';

export default function CalendarView({
  year,
  month,
  content,
  onEditItem,
  onCreateNewForDate,
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthName = getMonthName(month);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to match items to a day
  const getItemsForDay = (day) => {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return content.filter(item => item.date === dateString);
  };

  // Render cells list
  const cells = [];
  
  // Previous month blank cells
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-grid__cell calendar-grid__cell--empty" />);
  }

  // Active month day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const items = getItemsForDay(day);
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if cell represents today
    const today = new Date();
    const isToday = today.getFullYear() === year && (today.getMonth() + 1) === month && today.getDate() === day;

    cells.push(
      <div key={`day-${day}`} className={`calendar-grid__cell ${isToday ? 'calendar-grid__cell--today' : ''}`}>
        <div className="calendar-grid__day-header">
          <span className="calendar-grid__day-number">{day}</span>
          <button
            className="calendar-grid__add-btn"
            onClick={() => onCreateNewForDate(dateString)}
            title={`Add content on ${monthName} ${day}`}
            type="button"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="calendar-grid__items">
          {items.map(item => {
            const typeInfo = CONTENT_TYPES.find(t => t.value === item.type) || CONTENT_TYPES[0];
            return (
              <button
                key={item.id}
                className="calendar-grid__item"
                style={{
                  borderLeft: `3px solid ${typeInfo.color}`,
                  background: typeInfo.bg,
                }}
                onClick={() => onEditItem(item)}
                title={`${item.name} (${typeInfo.label})`}
                type="button"
              >
                <span className="calendar-grid__item-title">{item.name}</span>
                <span className={`calendar-grid__item-status calendar-grid__item-status--${item.status}`} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-view animate-fade-in">
      <div className="calendar-grid">
        {/* Week headers */}
        {weekDays.map(d => (
          <div key={d} className="calendar-grid__week-header">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells}
      </div>
    </div>
  );
}
