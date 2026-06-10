import { fmt, YEAR_LABELS } from "@/lib/engine";
import type { EngineResults } from "@/lib/engine";
import type { ReactNode } from "react";

interface Row {
  label: string;
  values: (number | string | null)[];
  total?: number | string | null;
  highlight?: boolean; 
  format?: (v: number) => string;
  colorByValue?: boolean;
}

export function YearTable({ rows, totalLabel = "10-yr Total" }: { rows: Row[]; totalLabel?: string }) {
  return (
    <div className="overflow-x-auto scrollbar-thin border border-border rounded">
      <table className="w-full text-xs num">
        <thead className="bg-panel">
          <tr>
            <th className="text-left px-2 py-1.5 font-medium text-muted-foreground sticky left-0 bg-panel z-10 border-r border-border min-w-[220px]">
              Metric
            </th>
            {YEAR_LABELS.map((y) => (
              <th key={y} className="text-right px-2 py-1.5 font-medium text-muted-foreground min-w-[70px]">
                {y}
              </th>
            ))}
            <th className="text-right px-2 py-1.5 font-medium text-primary border-l border-border min-w-[90px]">
              {totalLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.label + idx}
              className={`border-t border-border ${
                r.highlight ? "bg-accent/30 font-semibold" : "hover:bg-accent/20"
              }`}
            >
              <td className="px-2 py-1 text-foreground sticky left-0 bg-card border-r border-border font-sans">
                {r.label}
              </td>
              {r.values.map((v, i) => (
                <td key={i} className={cellClass(v, r.colorByValue)}>
                  {formatCell(v, r.format)}
                </td>
              ))}
              <td
                className={`text-right px-2 py-1 border-l border-border text-primary ${
                  r.highlight ? "font-semibold" : ""
                }`}
              >
                {formatCell(r.total ?? null, r.format)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellClass(v: number | string | null, colorByValue?: boolean) {
  let base = "text-right px-2 py-1";
  if (colorByValue && typeof v === "number") {
    if (v > 0) base += " text-pos";
    else if (v < 0) base += " text-neg";
  }
  return base;
}

function formatCell(v: number | string | null, format?: (v: number) => string) {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (!isFinite(v)) return "—";
  return format ? format(v) : fmt.num(v);
}

export function sumValues(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

export function avgValues(arr: number[]) {
  return arr.length ? sumValues(arr) / arr.length : 0;
}

export function KPI({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: "pos" | "neg" | "warn" | "neutral" }) {
  const toneCls = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "warn" ? "text-warn" : "text-foreground";
  return (
    <div className="bg-card border border-border rounded px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold num mt-0.5 ${toneCls}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function Badge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${
        ok ? "border-pos/40 bg-pos/10 text-pos" : "border-warn/40 bg-warn/10 text-warn"
      }`}
    >
      {ok ? "✓" : "⚠"} {text}
    </span>
  );
}

export function useEngineHelpers(_r: EngineResults) {
  return null;
}
