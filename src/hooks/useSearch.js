import { useState, useMemo, useCallback } from 'react';

/**
 * Search hook for instant content filtering
 * @param {Array} content - Array of content items
 * @returns {{ query, setQuery, filteredContent, clearSearch }}
 */
export function useSearch(content) {
  const [query, setQuery] = useState('');

  const filteredContent = useMemo(() => {
    if (!query.trim()) return content;

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return content.filter(item => {
      const searchableText = [
        item.name,
        item.summary,
        item.type,
        item.platform,
        item.caption,
        item.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [content, query]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return { query, setQuery, filteredContent, clearSearch };
}
