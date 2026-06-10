import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "@/lib/engine";
import type { EngineResults, Assumptions } from "@/lib/engine";
import { Badge, KPI, YearTable } from "./YearTable";

interface Props {
  r: EngineResults;
  a: Assumptions;
}
 
const tooltipStyle = {
  backgroundColor: "oklch(0.21 0.025 250)",
  border: "1px solid oklch(0.30 0.025 250)",
  borderRadius: 4,
  fontSize: 12,
  color: "oklch(0.95 0.01 240)",
};

export function OutcomeDashboard({ r, a }: Props) {
  const v = r.verdicts;
  // Sensitivity bars: approx FCF at different grant shares
  const sumDebt = r.totalDebtService10;
  const sensitivity = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((g) => ({
    grant: `${(g * 100).toFixed(0)}%`,
    fcf: (r.totalEBITDA10 - r.totalCapex10 * (1 - g) - sumDebt) / 1e6,
    isCurrent: Math.abs(g - a.grantShare) < 0.01,
  }));

  return (
    <section className="border-t border-border bg-background">
      <div className="px-4 pt-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          KPI & Outcome Dashboard
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-3">
          <KPI label="10-yr Revenue" value={`${fmt.nadm(r.totalRevenue10)}m`} />
          <KPI label="10-yr EBITDA" value={`${fmt.nadm(r.totalEBITDA10)}m`} tone={r.totalEBITDA10>0?"pos":"neg"} />
          <KPI label="10-yr CapEx" value={`${fmt.nadm(r.totalCapex10)}m`} />
          <KPI label="Total Grant" value={`${fmt.nadm(r.totalGrant10)}m`} />
          <KPI label="Grant per HH" value={fmt.num(r.grantPerHH, 0)} sub="NAD" />
          <KPI label="Avg DSCR" value={r.avgDSCR.toFixed(2) + "×"} tone={r.avgDSCR>=a.dscrThreshold?"pos":r.avgDSCR>=1?"warn":"neg"} />
          <KPI label="Project IRR" value={r.irr==null?"—":`${(r.irr*100).toFixed(1)}%`} tone={r.irr==null?"neutral":r.irr>0.08?"pos":r.irr>0?"warn":"neg"} />
          <KPI label="NPV (8%)" value={`${fmt.nadm(r.npv)}m`} tone={r.npv>0?"pos":"neg"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <div className="bg-card border border-border rounded p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">4A · RED Commercial P&L</div>
            <div className="flex flex-wrap gap-2">
              <Badge ok={v.ebitdaPositive} text={v.ebitdaPositive ? "EBITDA positive over 10yr" : "EBITDA negative – grant essential"} />
              <Badge ok={v.dscrOk} text={v.dscrOk ? `Avg DSCR ≥ ${a.dscrThreshold}×` : "DSCR below covenant"} />
            </div>
          </div>
          <div className="bg-card border border-border rounded p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">4B · Cross-subsidy & Tariff</div>
            <div className="flex flex-wrap gap-2">
              <Badge ok={v.marginPositive} text={v.marginPositive ? "Margin positive" : "Margin inadequate – structural subsidy required"} />
              <span className="text-xs text-muted-foreground num">
                Blended {r.blendedTariff.toFixed(2)} / Bulk {a.nampowerBulk.toFixed(2)} / Margin {r.marginPerKWhBlended.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="bg-card border border-border rounded p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">4C · Financing Structure</div>
            <div className="flex flex-wrap gap-2">
              <Badge ok={v.noGap} text={v.noGap ? "No financing gap" : `Gap NAD ${fmt.nadm(r.financingGap.reduce((a,b)=>a+b,0))}m – blended finance required`} />
              <span className="text-xs text-muted-foreground num">
                Grant {(a.grantShare*100).toFixed(0)}% · Conc {(a.concessionalShare*100).toFixed(0)}% · Comm {(a.commercialShare*100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="bg-card border border-border rounded p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">4D · Sensitivity — Approx FCF by Grant %</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sensitivity} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="oklch(0.30 0.025 250)" strokeDasharray="3 3" />
                  <XAxis dataKey="grant" stroke="oklch(0.66 0.02 250)" fontSize={11} />
                  <YAxis stroke="oklch(0.66 0.02 250)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="fcf">
                    {sensitivity.map((d, i) => (
                      <Cell key={i} fill={d.isCurrent ? "oklch(0.72 0.16 220)" : d.fcf >= 0 ? "oklch(0.78 0.18 145)" : "oklch(0.66 0.22 25)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded p-3 mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">4E · Investment Viability Verdict (5-layer composite)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <VerdictRow label="1 · Urban Planning" ok={v.layer1} pass="Sufficient HH base for programme" fail="HH target may be insufficient for scale" />
            <VerdictRow label="2 · RED Grid Margin" ok={v.layer2} pass="Positive margin per kWh" fail="Negative margin – RED loses money per kWh" />
            <VerdictRow label="3 · ECB Tariff" ok={v.layer3} pass="Tariff above bulk price" fail={`Social tariff below bulk – cross-subsidy of NAD ${v.layer3Loss.toFixed(2)}/kWh required`} />
            <VerdictRow label="4 · Financing" ok={v.layer4} pass="Grant share manageable" fail={`Grant share ${(v.layer4GrantPct*100).toFixed(0)}% – development finance dependent`} />
            <VerdictRow label="5 · Macroeconomic" ok={v.layer5} pass="GDP contribution exceeds total CapEx" fail="Verify macro multiplier assumptions" />
            <div className={`px-2 py-1.5 rounded border flex items-center gap-2 ${v.overall==="viable"?"border-pos/40 bg-pos/10 text-pos":v.overall==="concessional"?"border-warn/40 bg-warn/10 text-warn":"border-neg/40 bg-neg/10 text-neg"}`}>
              <span className="font-semibold">OVERALL:</span>
              <span>
                {v.overall === "viable" && "✓ IRR exceeds WACC – viable with grant support"}
                {v.overall === "concessional" && "⚠ Below WACC – concessional terms needed"}
                {v.overall === "subsidy" && "✗ Negative IRR – requires substantial public subsidy"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VerdictRow({ label, ok, pass, fail }: { label: string; ok: boolean; pass: string; fail: string }) {
  return (
    <div className={`flex gap-2 items-start px-2 py-1.5 rounded border ${ok ? "border-pos/30 bg-pos/5" : "border-warn/30 bg-warn/5"}`}>
      <span className={ok ? "text-pos" : "text-warn"}>{ok ? "✓" : "⚠"}</span>
      <div>
        <div className="font-semibold text-foreground">{label}</div>
        <div className={ok ? "text-pos/90" : "text-warn/90"}>{ok ? pass : fail}</div>
      </div>
    </div>
  );
}
