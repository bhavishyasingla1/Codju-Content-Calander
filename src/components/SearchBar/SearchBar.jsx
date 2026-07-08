import './SearchBar.css';

export default function SearchBar({ query, onChange, onClear }) {
  return (
    <div className={`search-bar ${query ? 'search-bar--active' : ''}`}>
      <svg className="search-bar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        className="search-bar__input"
        placeholder="Search content..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        id="search-content"
      />
      {query && (
        <button className="search-bar__clear" onClick={onClear} type="button" aria-label="Clear search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
