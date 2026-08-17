import MonthSelector from '../MonthSelector/MonthSelector';
import ViewToggle from '../ViewToggle/ViewToggle';
import SearchBar from '../SearchBar/SearchBar';
import { useAuth, ROLES } from '../../context/AuthContext';
import './TopNav.css';

export default function TopNav({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onCreateMonth,
  onChangeDate,
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onSearchClear,
}) {
  const { role, openPinModal } = useAuth();

  return (
    <nav className="top-nav" id="top-nav">
      <div className="top-nav__inner">
        {/* Logo */}
        <div className="top-nav__logo">
          <img src="/assets/codju-logo.png" alt="Codju" className="top-nav__logo-img" />
        </div>

        {/* Month Selector */}
        <MonthSelector
          year={year}
          month={month}
          onPrev={onPrevMonth}
          onNext={onNextMonth}
          onCreateMonth={onCreateMonth}
          onChangeDate={onChangeDate}
        />

        {/* Right side: Role Switcher + View Toggle + Search */}
        <div className="top-nav__actions">
          <button
            className={`top-nav__role-btn top-nav__role-btn--${role}`}
            onClick={() => openPinModal()}
            type="button"
            title="Click to enter PIN and change role"
          >
            <span className="top-nav__role-dot" />
            <span className="top-nav__role-text">
              {role === ROLES.ADMIN && 'Admin'}
              {role === ROLES.DESIGNER && 'Designer'}
              {role === ROLES.VIEWER && 'Viewer'}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>

          <ViewToggle currentView={currentView} onViewChange={onViewChange} />
          <SearchBar
            query={searchQuery}
            onChange={onSearchChange}
            onClear={onSearchClear}
          />
        </div>
      </div>
    </nav>
  );
}
