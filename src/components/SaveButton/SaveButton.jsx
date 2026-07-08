import './SaveButton.css';

export default function SaveButton({ onSave, saveStatus = 'idle', size = 'default' }) {
  const getLabel = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved ✓';
      case 'error': return 'Error!';
      default: return 'Save';
    }
  };

  return (
    <button
      className={`save-btn save-btn--${saveStatus} save-btn--${size}`}
      onClick={onSave}
      disabled={saveStatus === 'saving'}
      type="button"
    >
      {saveStatus === 'saving' && (
        <span className="save-btn__spinner" />
      )}
      {saveStatus === 'saved' && (
        <svg className="save-btn__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )}
      <span>{getLabel()}</span>
    </button>
  );
}
