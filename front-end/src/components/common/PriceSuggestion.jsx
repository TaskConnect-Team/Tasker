// frontend/src/components/PriceSuggestion.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { useAI } from '../../hooks/useAI';

const PriceSuggestion = ({ 
  isOpen, 
  onClose, 
  city, 
  category, 
  description, 
  urgency,
  onApply 
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState(null);
  const { suggestPrice } = useAI();

  useEffect(() => {
    if (isOpen && !suggestion && !loading) {
      handleGetSuggestion();
    }
  }, [isOpen]);

  const handleGetSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await suggestPrice(city, Array.isArray(category) ? category[0] : category, description, urgency);
      setSuggestion(result);
    } catch (err) {
      setError(err.message || 'Failed to get price suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(suggestion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="price-suggestion-title">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 id="price-suggestion-title" className="text-lg font-semibold">Market Price Estimate</h2>
              <p className="text-sm text-gray-500">AI-powered fair pricing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close price suggestion">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-600">Analyzing market rates...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={handleGetSuggestion}
                className="mt-2 text-sm text-red-700 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : suggestion ? (
            <div className="space-y-4">
              {/* Price Display */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600">Suggested Price</p>
                <p className="text-4xl font-bold text-blue-600">
                  PKR {suggestion.suggestedPrice}
                </p>
                {suggestion.minPrice && suggestion.maxPrice && (
                  <p className="text-sm text-gray-500 mt-1">
                    Range: PKR {suggestion.minPrice} - {suggestion.maxPrice}
                  </p>
                )}
                {suggestion.isFallback && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Estimated based on similar markets
                  </p>
                )}
              </div>

              {/* Rationale */}
              {suggestion.rationale && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Why this price?</p>
                  <p className="text-sm text-gray-600">{suggestion.rationale}</p>
                </div>
              )}

              {/* Context Info */}
              <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  Confidence: {Math.round((suggestion.confidence || 0) * 100)}%
                </span>
                <span>•</span>
                <span className="capitalize">Urgency: {urgency}</span>
                {suggestion.isFallback && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600">Fallback Estimate</span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Price
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PriceSuggestion;
