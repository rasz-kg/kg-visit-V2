export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-200/70" />
    </div>
  );
}
