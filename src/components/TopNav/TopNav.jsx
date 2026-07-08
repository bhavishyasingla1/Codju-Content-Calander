import MonthSelector from '../MonthSelector/MonthSelector';
import ViewToggle from '../ViewToggle/ViewToggle';
import SearchBar from '../SearchBar/SearchBar';
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

        {/* Right side: View Toggle + Search */}
        <div className="top-nav__actions">
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
