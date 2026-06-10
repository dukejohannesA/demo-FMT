import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AssumptionsPanel } from "@/components/AssumptionsPanel";
import { OutcomeDashboard } from "@/components/OutcomeDashboard";
import { ChatPanel } from "@/components/ChatPanel";
import {
  CashFlowTab,
  CostsTab,
  FinancingTab,
  GrantMapTab,
  MacroTab,
  RevenueTab,
  RolloutTab,
  SolarTab,
} from "@/components/Tabs";
import { calculate, DEFAULT_ASSUMPTIONS, fmt, YEAR_LABELS } from "@/lib/engine";
import type { Assumptions } from "@/lib/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alfred's City Urban Electrification — Financial Model" },
      { name: "description", content: "10-year financial model for urban electrification of 50,000 households (2025–2034)." },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "rollout", label: "Rollout" },
  { id: "revenue", label: "Revenue" },
  { id: "costs", label: "Costs" },
  { id: "financing", label: "Financing" },
  { id: "cashflow", label: "Cash Flow" },
  { id: "solar", label: "Solar" },
  { id: "macro", label: "Macro" },
  { id: "grant", label: "Grant Map" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Index() {
  const [a, setA] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const r = useMemo(() => calculate(a), [a]);
  const [tab, setTab] = useState<TabId>("rollout");

  function exportCSV() {
    const lines: string[] = [];
    const header = ["Metric", ...YEAR_LABELS.map(String), "10yr_Total"].join(",");
    lines.push(header);
    const push = (label: string, vals: (number | null | string)[], total?: number | string) => {
      lines.push([label, ...vals.map((v) => (v == null ? "" : String(v))), total ?? ""].join(","));
    };
    const sum = (arr: number[]) => arr.reduce((x, y) => x + y, 0);
    push("New HH", r.newHH, sum(r.newHH));
    push("Cumulative HH", r.cumHH, r.cumHH[9]);
    push("Total CapEx NAD", r.totalCapex, r.totalCapex10);
    push("Revenue Collected NAD", r.revCollected, r.totalRevenue10);
    push("Bulk Cost NAD", r.bulkCost, sum(r.bulkCost));
    push("OpEx NAD", r.totalOpex, sum(r.totalOpex));
    push("EBITDA NAD", r.ebitda, r.totalEBITDA10);
    push("Debt Service NAD", r.debtService, r.totalDebtService10);
    push("FCF NAD", r.fcf, r.totalFCF10);
    push("DSCR", r.dscr.map((d) => (d == null ? "" : (d as number).toFixed(3))));
    push("Grant NAD", r.grantFunding, r.totalGrant10);
    push("RBF NAD", r.rbfReceived, sum(r.rbfReceived));

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alfreds-city-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* TOP BAR */}
      <header className="border-b border-border bg-panel shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <div className="text-sm font-semibold tracking-tight">
              Alfred's City — Urban Electrification <span className="text-muted-foreground font-normal">| 2025–2034 Financial Model</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Pure-browser financial engine · live recalculation · {r.warnings.length > 0 && <span className="text-warn">⚠ {r.warnings.join(" · ")}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 num text-xs">
            <Stat label="CapEx" v={`${fmt.nadm(r.totalCapex10)}m`} />
            <Stat label="Revenue" v={`${fmt.nadm(r.totalRevenue10)}m`} />
            <Stat label="EBITDA" v={`${fmt.nadm(r.totalEBITDA10)}m`} tone={r.totalEBITDA10>0?"pos":"neg"} />
            <Stat label="NPV" v={`${fmt.nadm(r.npv)}m`} tone={r.npv>0?"pos":"neg"} />
            <Stat label="IRR" v={r.irr==null?"—":`${(r.irr*100).toFixed(1)}%`} tone={r.irr==null?undefined:r.irr>a.discountRate?"pos":r.irr>0?"warn":"neg"} />
            <Stat label="DSCR" v={`${r.avgDSCR.toFixed(2)}×`} tone={r.avgDSCR>=a.dscrThreshold?"pos":r.avgDSCR>=1?"warn":"neg"} />
            <button onClick={exportCSV} className="ml-2 px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <AssumptionsPanel a={a} setA={setA} />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-border bg-panel shrink-0">
            <div className="flex">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider border-r border-border transition-colors ${
                    tab === t.id
                      ? "bg-background text-primary border-b-2 border-b-primary -mb-px"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-4">
              {tab === "rollout" && <RolloutTab r={r} />}
              {tab === "revenue" && <RevenueTab r={r} />}
              {tab === "costs" && <CostsTab r={r} />}
              {tab === "financing" && <FinancingTab r={r} threshold={a.dscrThreshold} />}
              {tab === "cashflow" && (
                <CashFlowTab r={r} discountRate={a.discountRate} setDiscountRate={(v) => setA({ ...a, discountRate: v })} />
              )}
              {tab === "solar" && <SolarTab r={r} />}
              {tab === "macro" && <MacroTab r={r} />}
              {tab === "grant" && <GrantMapTab r={r} />}
            </div>

            <OutcomeDashboard r={r} a={a} />
          </div>

          <ChatPanel key={JSON.stringify(a)} r={r} a={a} />
        </main>
      </div>
    </div>
  );
}

function Stat({ label, v, tone }: { label: string; v: string; tone?: "pos" | "neg" | "warn" }) {
  const cls = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "warn" ? "text-warn" : "text-foreground";
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`font-semibold ${cls}`}>{v}</span>
    </div>
  );
}
