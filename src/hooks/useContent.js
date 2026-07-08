import { useState, useEffect, useCallback } from 'react';
import * as contentService from '../services/contentService';

export function useContent(year, month) {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contentService.fetchContentByMonth(year, month);
      // Sort by date
      data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setContent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const addContent = useCallback(async (contentData) => {
    try {
      const newItem = await contentService.createContent(contentData);
      setContent(prev => [...prev, newItem].sort((a, b) => new Date(a.date) - new Date(b.date)));
      return newItem;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateContentItem = useCallback(async (id, updates) => {
    try {
      const updated = await contentService.updateContent(id, updates);
      setContent(prev =>
        prev.map(item => item.id === id ? updated : item)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeContent = useCallback(async (id) => {
    try {
      await contentService.deleteContent(id);
      setContent(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const batchAddContent = useCallback(async (items) => {
    try {
      const newItems = await contentService.createBatchContent(items);
      setContent(prev => [...prev, ...newItems].sort((a, b) => new Date(a.date) - new Date(b.date)));
      return newItems;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const refreshContent = useCallback(() => {
    return fetchContent();
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    addContent,
    batchAddContent,
    updateContentItem,
    removeContent,
    refreshContent,
  };
}
