// frontend/src/components/AIEnhancementModal.jsx
import React, { useEffect, useState } from 'react';
import { Sparkles, X, Check, AlertCircle } from 'lucide-react';
import { useAI } from '../../hooks/useAI';

const AIEnhancementModal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  category,
  onApply 
}) => {
  const [loading, setLoading] = useState(false);
  const [enhanced, setEnhanced] = useState(null);
  const [error, setError] = useState(null);
  const { enhanceTask } = useAI();

  // Generate enhancement on modal open
  useEffect(() => {
    if (isOpen && !enhanced && !loading) {
      handleEnhance();
    }
  }, [isOpen]);

  const handleEnhance = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await enhanceTask(title, description, Array.isArray(category) ? category[0] : category);
      setEnhanced(result);
    } catch (err) {
      setError(err.message || 'Failed to enhance description');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(enhanced);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="ai-enhancement-title">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 id="ai-enhancement-title" className="text-lg font-semibold">AI Enhancement</h2>
              <p className="text-sm text-gray-500">Professional description & skill tags</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close AI enhancement"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">AI is analyzing your task...</p>
              <p className="text-sm text-gray-400">This may take a few seconds</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Enhancement Failed</p>
                <p className="text-sm text-red-600">{error}</p>
                <button 
                  onClick={handleEnhance}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : enhanced ? (
            <>
              {/* Comparison View */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Original</h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {description}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">AI Enhanced</h4>
                  <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700 max-h-32 overflow-y-auto border border-green-200">
                    {enhanced.enhancedDescription}
                  </div>
                </div>
              </div>

              {/* Skill Tags */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Suggested Skill Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {(enhanced.tags || []).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Tags are filtered to match available categories
                </p>
              </div>

              {/* Confidence & Rationale */}
              <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  Confidence: {Math.round((enhanced.confidence || 0) * 100)}%
                </span>
                <span>•</span>
                <span>
                  {(enhanced.tags || []).length} tags suggested
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleApply}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Suggestions
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AIEnhancementModal;
