import type { Kpi } from '@/lib/content-types';

/** KPI-плитки (docs/04 S8): значение крупно моно, подпись, подсказка. */
export function KpiBlock({ kpis }: { kpis: Kpi[] }) {
  if (kpis.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {kpis.map((k, i) => (
        <div key={i} className="border border-line bg-paper-panel p-4">
          <div className="font-mono text-xl text-t900">{k.value}</div>
          <div className="mt-1 text-xs font-light text-t600">{k.label}</div>
          {k.hint ? (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-t400">{k.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
