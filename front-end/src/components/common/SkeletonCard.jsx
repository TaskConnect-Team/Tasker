const SkeletonCard = ({ delay = 0 }) => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
  >
    <div className="h-4 w-1/2 rounded bg-slate-200"></div>
    <div className="mt-3 h-3 w-1/3 rounded bg-slate-100"></div>
    <div className="mt-4 h-3 w-full rounded bg-slate-100"></div>
  </div>
);

export default SkeletonCard;
