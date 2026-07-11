import { Loader2, Sparkles } from 'lucide-react';

function SearchModeToggle({ mode, setMode, isLoading = false }) {
  const isAI = mode === 'ai';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-[0_0_18px_rgba(99,102,241,0.18)]">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </span>
        <span>Search Mode</span>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
          AI
        </span>
      </div>

      <div
        className="inline-flex rounded-full bg-slate-100 p-1"
        role="group"
        aria-label="Choose search mode"
      >
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            !isAI ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-pressed={!isAI}
          disabled={isLoading}
        >
          Regular
        </button>
        <button
          type="button"
          onClick={() => setMode('ai')}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            isAI ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-pressed={isAI}
          disabled={isLoading}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Smart Search
        </button>
      </div>
    </div>
  );
}

export default SearchModeToggle;
