import { getMonthName } from '../../utils/helpers';
import './MonthSelector.css';

export default function MonthSelector({ year, month, onPrev, onNext, onCreateMonth }) {
  return (
    <div className="month-selector">
      <button className="month-selector__arrow" onClick={onPrev} title="Previous Month" type="button" id="month-prev">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
      </button>

      <div className="month-selector__display">
        <h1 className="month-selector__heading">
          {getMonthName(month)} {year}
        </h1>
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
