import { useState } from 'react';
import api from '../api/axios';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enhanceTask = async (title, description, category) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/ai/enhance-task', {
        title,
        description,
        category,
      });
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'AI enhancement failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const suggestPrice = async (city, category, description, urgency) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/ai/suggest-price', {
        city,
        category,
        description,
        urgency,
      });
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Price suggestion failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const semanticSearch = async (query, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });
      const response = await api.get(`/ai/search?${params}`);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const semanticTaskSearch = async (query, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });
      const response = await api.get(`/ai/tasks/search?${params}`);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Task search failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    enhanceTask,
    suggestPrice,
    semanticSearch,
    semanticTaskSearch,
  };
};
