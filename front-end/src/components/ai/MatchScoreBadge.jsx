import { Sparkles } from 'lucide-react';
import { getMatchColor, getMatchLabel, normalizeScore } from '../../utils/searchHelpers';

function MatchScoreBadge({ score = 0, size = 'sm' }) {
  const normalized = normalizeScore(score);
  const compact = size === 'sm';

  if (!normalized) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${getMatchColor(normalized)} ${
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
      aria-label={`${getMatchLabel(normalized)} with ${normalized} percent confidence`}
    >
      <Sparkles className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
      {normalized}% {getMatchLabel(normalized)}
    </span>
  );
}

export default MatchScoreBadge;
