import type { Assumptions } from "@/lib/engine";
import { DEFAULT_ASSUMPTIONS } from "@/lib/engine";

type Field =
  | { key: keyof Assumptions; label: string; type: "number"; unit?: string; step?: number }
  | { key: keyof Assumptions; label: string; type: "slider"; min: number; max: number; step: number; unit?: string; pct?: boolean }; 

interface Group {
  title: string;
  fields: Field[];
}

const GROUPS: Group[] = [
  {
    title: "A — Urban Planning & Demand",
    fields: [
      { key: "totalHH", label: "Total HH Target", type: "number", unit: "HH" },
      { key: "paceY1_3", label: "Pace Yrs 1–3", type: "number", unit: "HH/yr" },
      { key: "paceY4_7", label: "Pace Yrs 4–7", type: "number", unit: "HH/yr" },
      { key: "paceY8_10", label: "Pace Yrs 8–10", type: "number", unit: "HH/yr" },
      { key: "densificationShare", label: "Densification share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "socialShare", label: "Social tariff HH share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "standardShare", label: "Standard tariff HH share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "higherShare", label: "Higher tariff HH share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "avgConsumption", label: "Avg monthly consumption", type: "number", unit: "kWh/mo" },
      { key: "demandGrowth", label: "Annual demand growth", type: "slider", min: 0, max: 0.15, step: 0.005, pct: true },
      { key: "technicalLosses", label: "Technical losses", type: "slider", min: 0, max: 0.2, step: 0.005, pct: true },
      { key: "collectionRate", label: "Collection rate", type: "slider", min: 0.5, max: 1, step: 0.01, pct: true },
    ],
  },
  {
    title: "B — RED Grid Infrastructure",
    fields: [
      { key: "capexDense", label: "CapEx Densification", type: "number", unit: "NAD/HH" },
      { key: "capexExtension", label: "CapEx Extension", type: "number", unit: "NAD/HH" },
      { key: "substationCost", label: "Substation cost", type: "number", unit: "NAD" },
      { key: "numSubstations", label: "# Substations", type: "number" },
      { key: "mvReinforcement", label: "MV reinforcement (Yr 3)", type: "number", unit: "NAD" },
      { key: "opexPerHH", label: "OpEx per HH per year", type: "number", unit: "NAD/HH/yr" },
      { key: "depreciationRate", label: "Depreciation rate", type: "slider", min: 0, max: 0.2, step: 0.005, pct: true },
      { key: "nampowerBulk", label: "NamPower bulk price", type: "number", unit: "NAD/kWh", step: 0.05 },
      { key: "costEscalation", label: "Cost escalation", type: "slider", min: 0, max: 0.15, step: 0.005, pct: true },
    ],
  },
  {
    title: "C — Solar Integration",
    fields: [
      { key: "solarCapex", label: "Solar CapEx", type: "number", unit: "NAD/MW" },
      { key: "solarCapacityFactor", label: "Solar capacity factor", type: "slider", min: 0, max: 0.5, step: 0.01, pct: true },
      { key: "solarOMM", label: "Solar O&M", type: "number", unit: "NAD/MW/yr" },
      { key: "solarLCOE", label: "Solar LCOE", type: "number", unit: "NAD/kWh", step: 0.01 },
      { key: "solarGrantShare", label: "Solar grant share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "solarConcLoanShare", label: "Solar conc. loan share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
    ],
  },
  {
    title: "D — ECB Tariffs",
    fields: [
      { key: "socialTariff", label: "Social tariff", type: "number", unit: "NAD/kWh", step: 0.05 },
      { key: "standardTariff", label: "Standard tariff", type: "number", unit: "NAD/kWh", step: 0.05 },
      { key: "higherTariff", label: "Higher tariff", type: "number", unit: "NAD/kWh", step: 0.05 },
      { key: "tariffEscalation", label: "Annual tariff escalation", type: "slider", min: 0, max: 0.15, step: 0.005, pct: true },
    ],
  },
  {
    title: "E — Financing Structure",
    fields: [
      { key: "grantShare", label: "Grant share of CapEx", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "concessionalShare", label: "Concessional loan share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "commercialShare", label: "Commercial loan share", type: "slider", min: 0, max: 1, step: 0.01, pct: true },
      { key: "concessionalRate", label: "Concessional rate", type: "slider", min: 0, max: 0.15, step: 0.005, pct: true },
      { key: "commercialRate", label: "Commercial rate", type: "slider", min: 0, max: 0.20, step: 0.005, pct: true },
      { key: "concessionalTenor", label: "Concessional tenor", type: "number", unit: "yrs" },
      { key: "commercialTenor", label: "Commercial tenor", type: "number", unit: "yrs" },
      { key: "gracePeriod", label: "Grace period", type: "number", unit: "yrs" },
      { key: "dscrThreshold", label: "DSCR covenant", type: "number", step: 0.1 },
      { key: "rbfUSD", label: "RBF per HH", type: "number", unit: "USD/HH" },
      { key: "fxRate", label: "NAD/USD exchange", type: "number", step: 0.1 },
    ],
  },
  {
    title: "F — Macroeconomic",
    fields: [
      { key: "urbanPopGrowth", label: "Urban pop growth", type: "slider", min: 0, max: 0.1, step: 0.005, pct: true },
      { key: "incomeElasticity", label: "Income elasticity", type: "number", step: 0.1 },
      { key: "contingency", label: "Contingency factor", type: "slider", min: 0, max: 0.3, step: 0.01, pct: true },
      { key: "jobsPerNADm", label: "Direct jobs / NADm", type: "number", step: 0.1 },
      { key: "indirectJobMult", label: "Indirect jobs mult.", type: "number", step: 0.1 },
      { key: "gdpMultiplier", label: "GDP multiplier", type: "number", step: 0.1 },
      { key: "co2Factor", label: "CO₂ factor", type: "number", unit: "tCO₂/kWh", step: 0.0001 },
      { key: "hhIncomeGain", label: "HH income gain", type: "slider", min: 0, max: 0.3, step: 0.01, pct: true },
      { key: "avgHHIncome", label: "Avg HH income", type: "number", unit: "NAD/yr" },
      { key: "carbonPriceUSD", label: "Carbon credit price", type: "number", unit: "USD/tCO₂" },
      { key: "marginalTax", label: "Marginal tax rate", type: "slider", min: 0, max: 0.5, step: 0.005, pct: true },
    ],
  },
];

interface Props {
  a: Assumptions;
  setA: (next: Assumptions) => void;
}

export function AssumptionsPanel({ a, setA }: Props) {
  const update = (k: keyof Assumptions, v: number) => setA({ ...a, [k]: v });

  const tariffSum = a.socialShare + a.standardShare + a.higherShare;
  const finSum = a.grantShare + a.concessionalShare + a.commercialShare;
  const blended =
    a.socialShare * a.socialTariff +
    a.standardShare * a.standardTariff +
    a.higherShare * a.higherTariff;

  return (
    <aside className="w-[340px] shrink-0 border-r border-border bg-panel overflow-y-auto scrollbar-thin h-full">
      <div className="p-3 border-b border-border sticky top-0 bg-panel z-10">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Assumptions</div>
        <div className="text-sm font-semibold mt-0.5">Live model inputs</div>
        <button
          onClick={() => setA({ ...DEFAULT_ASSUMPTIONS })}
          className="mt-2 text-xs text-primary hover:underline"
        >
          Reset to defaults
        </button>
      </div>

      {GROUPS.map((g) => (
        <details key={g.title} open className="border-b border-border">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/30">
            {g.title}
          </summary>
          <div className="px-3 pb-3 space-y-3">
            {g.fields.map((f) => {
              const val = a[f.key] as number;
              if (f.type === "slider") {
                return (
                  <div key={f.key as string}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="num text-foreground">
                        {f.pct ? `${(val * 100).toFixed(1)}%` : val}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={val}
                      onChange={(e) => update(f.key, parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                );
              }
              return (
                <div key={f.key as string}>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {f.label} {f.unit && <span className="opacity-60">({f.unit})</span>}
                  </label>
                  <input
                    type="number"
                    step={f.step ?? 1}
                    value={val}
                    onChange={(e) => update(f.key, parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-input text-foreground rounded border border-border num text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              );
            })}

            {g.title.startsWith("A") && (
              <div
                className={`text-xs rounded px-2 py-1.5 border ${
                  Math.abs(tariffSum - 1) > 0.005
                    ? "border-warn text-warn bg-warn/10"
                    : "border-border text-muted-foreground"
                }`}
              >
                Tariff shares sum: {(tariffSum * 100).toFixed(1)}%
                {Math.abs(tariffSum - 1) > 0.005 && " (will be normalized)"}
              </div>
            )}
            {g.title.startsWith("D") && (
              <div className="text-xs rounded px-2 py-1.5 bg-accent/30 text-muted-foreground space-y-0.5">
                <div>
                  Blended tariff: <span className="num text-foreground">{blended.toFixed(2)} NAD/kWh</span>
                </div>
                <div>
                  Margin/kWh:{" "}
                  <span className="num text-foreground">{(blended - a.nampowerBulk).toFixed(2)}</span>
                </div>
                <div>
                  Cross-subsidy loss/kWh:{" "}
                  <span className="num text-foreground">
                    {Math.max(0, a.nampowerBulk - a.socialTariff).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            {g.title.startsWith("E") && (
              <>
                <div
                  className={`text-xs rounded px-2 py-1.5 border ${
                    Math.abs(finSum - 1) > 0.005
                      ? "border-warn text-warn bg-warn/10"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Financing shares sum: {(finSum * 100).toFixed(1)}%
                  {Math.abs(finSum - 1) > 0.005 && " (will be normalized)"}
                </div>
                <div className="text-xs rounded px-2 py-1.5 bg-accent/30 text-muted-foreground space-y-0.5">
                  <div>
                    RBF/HH (NAD):{" "}
                    <span className="num text-foreground">{(a.rbfUSD * a.fxRate).toFixed(0)}</span>
                  </div>
                  <div>
                    Total RBF potential:{" "}
                    <span className="num text-foreground">
                      {((a.rbfUSD * a.fxRate * a.totalHH) / 1e6).toFixed(1)} NADm
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </details>
      ))}
    </aside>
  );
}
