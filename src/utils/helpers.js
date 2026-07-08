// Utility helpers for the Codju Content Dashboard

/**
 * Format a date string to a readable format
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(dateStr, options = {}) {
  const date = new Date(dateStr + 'T00:00:00');
  const defaults = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', { ...defaults, ...options });
}

/**
 * Format a date for the date input
 * @param {string} dateStr
 * @returns {string} YYYY-MM-DD
 */
export function toInputDate(dateStr) {
  return dateStr ? dateStr.substring(0, 10) : '';
}

/**
 * Get month name from month number
 * @param {number} month - 1-indexed
 * @returns {string}
 */
export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

/**
 * Get number of days in a month
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Get the day of the week for the first day of a month (0=Sun, 6=Sat)
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {number}
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Truncate text to a max length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '…';
}

/**
 * Strip HTML tags from a string
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Get character count from HTML content
 * @param {string} html
 * @returns {number}
 */
export function getCharCount(html) {
  return stripHtml(html).length;
}

/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

/**
 * Check if a file is an image
 * @param {string} filename
 * @returns {boolean}
 */
export function isImageFile(filename) {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  return imageExts.includes(getFileExtension(filename));
}

/**
 * Check if a file is a video
 * @param {string} filename
 * @returns {boolean}
 */
export function isVideoFile(filename) {
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  return videoExts.includes(getFileExtension(filename));
}

/**
 * Check if a file is a PDF
 * @param {string} filename
 * @returns {boolean}
 */
export function isPdfFile(filename) {
  return getFileExtension(filename) === 'pdf';
}

/**
 * Format file size
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a consistent color from a string
 * @param {string} str
 * @returns {string} HSL color
 */
export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 65%, 55%)`;
}
