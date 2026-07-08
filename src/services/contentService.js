// Content Service Layer
// Communicates with our Vite backend API connected to Supabase Postgres.

import { PLATFORMS, CONTENT_TYPES, STATUSES } from '../data/mockContent';

// Generate a random temporary ID for client-side items
function generateId() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Fetch all content for a specific month
 * @param {number} year
 * @param {number} month - 1-indexed (1=Jan, 7=Jul)
 * @returns {Promise<Array>}
 */
export async function fetchContentByMonth(year, month) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const response = await fetch(`/api/content?month=${monthKey}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch content');
  }
  return response.json();
}

/**
 * Get all available months that have content (defaults to current/prev months)
 * @returns {Promise<string[]>}
 */
export async function fetchAvailableMonths() {
  // Return standard active months list, or we could query from API
  return ['2026-06', '2026-07', '2026-08'];
}

/**
 * Create a new content item
 * @param {object} contentData
 * @returns {Promise<object>}
 */
export async function createContent(contentData) {
  const response = await fetch('/api/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: generateId(),
      ...contentData,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create content');
  }

  return response.json();
}

/**
 * Update an existing content item
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateContent(id, updates) {
  const response = await fetch(`/api/content/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update content');
  }

  return response.json();
}

/**
 * Delete a content item
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteContent(id) {
  const response = await fetch(`/api/content/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete content');
  }

  const result = await response.json();
  return result.success;
}

/**
 * Create a new empty month
 * @param {number} year
 * @param {number} month
 * @returns {Promise<boolean>}
 */
export async function createMonth(year, month) {
  // Just return true because the database queries dynamically.
  return true;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an asset (converts to base64 Data URL for persistent storage)
 * @param {File} file
 * @returns {Promise<object>}
 */
export async function uploadAsset(file) {
  try {
    const dataUrl = await fileToDataURL(file);
    return {
      id: 'a' + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      url: dataUrl,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to convert file to data URL', error);
    throw error;
  }
}

/**
 * Download an asset
 * @param {string} url
 * @param {string} filename
 */
export function downloadAsset(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Reset all data to mock defaults
 * @returns {Promise<boolean>}
 */
export async function resetData() {
  // Client can just re-initialize if needed, or we could hit a reset endpoint.
  return true;
}
export { PLATFORMS, CONTENT_TYPES, STATUSES };
