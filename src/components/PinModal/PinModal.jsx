import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import './PinModal.css';

export default function PinModal({ isOpen, onClose }) {
  const { role, login, logout } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(null);
  const [successRole, setSuccessRole] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setError(null);
      setSuccessRole(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanValue;
    setDigits(newDigits);
    setError(null);

    // Auto-advance
    if (cleanValue && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 4 digits entered, auto-submit
    if (cleanValue && index === 3) {
      const fullPin = newDigits.join('');
      if (fullPin.length === 4) {
        verifyPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) {
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      if (pasted.length === 4) {
        verifyPin(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const verifyPin = useCallback((pinToVerify) => {
    const res = login(pinToVerify);
    if (res.success) {
      setSuccessRole(res.role);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setError(res.error || 'Incorrect PIN');
      setDigits(['', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [login, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullPin = digits.join('');
    if (fullPin.length === 4) {
      verifyPin(fullPin);
    } else {
      setError('Please enter all 4 digits');
    }
  };

  const handleSelectViewer = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pin-modal__backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pin-modal animate-scale-in">
        <div className="pin-modal__header">
          <div className="pin-modal__header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="pin-modal__title">Workspace Access</h3>
          <p className="pin-modal__subtitle">
            Enter PIN to unlock Designer or Admin editing privileges
          </p>
          <button className="pin-modal__close" onClick={onClose} type="button" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pin-modal__body">
          {/* Current Active Mode Indicator */}
          <div className="pin-modal__current-role">
            <span className="pin-modal__role-label">Current Access:</span>
            <span className={`pin-modal__role-tag pin-modal__role-tag--${role}`}>
              {role === ROLES.ADMIN && '👑 Admin (Full Access)'}
              {role === ROLES.DESIGNER && '🎨 Designer (Uploads & Revisions)'}
              {role === ROLES.VIEWER && '👁️ Viewer (Read Only)'}
            </span>
          </div>

          {/* PIN Input Slots */}
          <div className="pin-modal__inputs" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`pin-modal__input ${error ? 'pin-modal__input--error' : ''} ${digit ? 'pin-modal__input--filled' : ''}`}
                autoComplete="off"
              />
            ))}
          </div>

          {/* Error / Success message */}
          {error && (
            <div className="pin-modal__alert pin-modal__alert--error animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successRole && (
            <div className="pin-modal__alert pin-modal__alert--success animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Unlocked as {successRole === ROLES.ADMIN ? 'Admin' : 'Designer'}!</span>
            </div>
          )}

          <div className="pin-modal__actions">
            <button type="submit" className="pin-modal__submit-btn">
              Unlock Workspace
            </button>
            {role !== ROLES.VIEWER && (
              <button
                type="button"
                className="pin-modal__logout-btn"
                onClick={handleSelectViewer}
              >
                Switch to Read-Only Viewer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
