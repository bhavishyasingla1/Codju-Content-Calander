import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Auto-save hook with debounced saving
 * @param {Function} saveFn - Async function to call for saving
 * @param {number} delayMs - Debounce delay in milliseconds
 * @returns {{ saveStatus, triggerSave, forceSave }}
 */
export function useAutoSave(saveFn, delayMs = 3000) {
  // 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const timerRef = useRef(null);
  const savedTimerRef = useRef(null);
  const saveFnRef = useRef(saveFn);

  // Keep the save function reference up to date
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const triggerSave = useCallback(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set debounced save
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveFnRef.current();
        setSaveStatus('saved');

        // Reset to idle after showing "Saved" for 2 seconds
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch {
        setSaveStatus('error');
        // Reset to idle after showing error
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    }, delayMs);
  }, [delayMs]);

  const forceSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setSaveStatus('saving');
    try {
      await saveFnRef.current();
      setSaveStatus('saved');

      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch {
      setSaveStatus('error');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, []);

  return { saveStatus, triggerSave, forceSave };
}
