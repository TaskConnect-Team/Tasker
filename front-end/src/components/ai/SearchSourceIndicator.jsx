import { Search, Sparkles } from 'lucide-react';
import { formatSearchSource } from '../../utils/searchHelpers';

function SearchSourceIndicator({ source, count, isLoading = false }) {
  if (!source && !isLoading) {
    return null;
  }

  const isAI = source === 'vector' || source === 'ai' || source === 'hybrid';

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
        {isAI ? <Sparkles className="h-4 w-4 text-indigo-600" /> : <Search className="h-4 w-4 text-slate-500" />}
        {isLoading ? 'Searching...' : formatSearchSource(source)}
      </span>
      {typeof count === 'number' && (
        <span className="text-xs font-medium text-slate-500">
          {isLoading ? (
            <span className="inline-block h-2 w-2 animate-spin rounded-full border-2 border-current border-t-transparent text-slate-500 mr-1" />
          ) : (
            count
          )} result{count === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}

export default SearchSourceIndicator;
