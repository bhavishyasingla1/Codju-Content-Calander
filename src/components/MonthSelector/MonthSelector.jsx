import './MonthSelector.css';

export default function MonthSelector({
  year,
  month,
  onPrev,
  onNext,
  onCreateMonth,
  onChangeDate,
}) {
  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const yearsList = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div className="month-selector">
      <button className="month-selector__arrow" onClick={onPrev} title="Previous Month" type="button" id="month-prev">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
      </button>

      <div className="month-selector__dropdowns">
        <select
          className="month-selector__select month-selector__select--month"
          value={month}
          onChange={(e) => onChangeDate(year, parseInt(e.target.value, 10))}
        >
          {monthsList.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          className="month-selector__select month-selector__select--year"
          value={year}
          onChange={(e) => onChangeDate(parseInt(e.target.value, 10), month)}
        >
          {yearsList.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <button className="month-selector__arrow" onClick={onNext} title="Next Month" type="button" id="month-next">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9,6 15,12 9,18" />
        </svg>
      </button>

      <button className="month-selector__create" onClick={onCreateMonth} title="Create New Month" type="button" id="create-month-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>New Month</span>
      </button>
    </div>
  );
}
