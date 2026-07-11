import { Sparkles } from 'lucide-react';
import { normalizeScore } from '../../utils/searchHelpers';

function AITagDisplay({ tags = [] }) {
  const normalizedTags = tags
    .map((tag) => (typeof tag === 'string' ? { label: tag, confidence: 0.8 } : tag))
    .filter((tag) => tag?.label);

  if (!normalizedTags.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="AI generated task tags">
      {normalizedTags.map((tag) => (
        <span
          key={tag.label}
          className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
          title={`${normalizeScore(tag.confidence)}% confidence`}
        >
          <Sparkles className="h-3 w-3" />
          {tag.label}
          <span className="text-indigo-500">{normalizeScore(tag.confidence)}%</span>
        </span>
      ))}
    </div>
  );
}

export default AITagDisplay;
