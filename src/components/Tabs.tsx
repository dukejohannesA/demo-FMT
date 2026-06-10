import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip, 
  XAxis,
  YAxis,
} from "recharts";
import { fmt, YEAR_LABELS } from "@/lib/engine";
import type { EngineResults } from "@/lib/engine";
import { Badge, KPI, YearTable } from "./YearTable";

const COLORS = {
  primary: "oklch(0.72 0.16 220)",
  pos: "oklch(0.78 0.18 145)",
  neg: "oklch(0.66 0.22 25)",
  warn: "oklch(0.80 0.16 80)",
  axis: "oklch(0.66 0.02 250)",
  grid: "oklch(0.30 0.025 250)",
  series1: "oklch(0.72 0.16 220)",
  series2: "oklch(0.78 0.16 60)",
  series3: "oklch(0.70 0.18 320)",
  series4: "oklch(0.78 0.18 145)",
};

const tooltipStyle = {
  backgroundColor: "oklch(0.21 0.025 250)",
  border: "1px solid oklch(0.30 0.025 250)",
  borderRadius: 4,
  fontSize: 12,
  color: "oklch(0.95 0.01 240)",
};

function ChartFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-card border border-border rounded p-3 mt-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const xData = (arr: number[]) =>
  YEAR_LABELS.map((y, i) => ({ year: y, v: arr[i] }));

function makeData(series: Record<string, number[]>) {
  return YEAR_LABELS.map((y, i) => {
    const row: any = { year: y };
    for (const k of Object.keys(series)) row[k] = series[k][i];
    return row;
  });
}

const nadmFmt = (v: number) => `${(v / 1e6).toFixed(1)}m`;

export function RolloutTab({ r }: { r: EngineResults }) {
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const data = makeData({
    Densification: r.denseCapex.map((v) => v / 1e6),
    Extension: r.extCapex.map((v) => v / 1e6),
    GridReinf: r.gridReinfCapex.map((v) => v / 1e6),
    CumHH: r.cumHH,
  });
  return (
    <>
      <YearTable
        rows={[
          { label: "New HH connected", values: r.newHH, total: sum(r.newHH) },
          { label: "Cumulative HH", values: r.cumHH, total: r.cumHH[9] },
          { label: "  Densification HH", values: r.denseHH, total: sum(r.denseHH) },
          { label: "  Extension HH", values: r.extHH, total: sum(r.extHH) },
          { label: "Densification CapEx (NADm)", values: r.denseCapex.map(v=>v/1e6), total: sum(r.denseCapex)/1e6, format: (v)=>v.toFixed(1) },
          { label: "Extension CapEx (NADm)", values: r.extCapex.map(v=>v/1e6), total: sum(r.extCapex)/1e6, format: (v)=>v.toFixed(1) },
          { label: "Grid Reinforcement (NADm)", values: r.gridReinfCapex.map(v=>v/1e6), total: sum(r.gridReinfCapex)/1e6, format: (v)=>v.toFixed(1) },
          { label: "TOTAL CAPEX (NADm)", values: r.totalCapex.map(v=>v/1e6), total: r.totalCapex10/1e6, format: (v)=>v.toFixed(1), highlight: true },
        ]}
      />
      <ChartFrame title="CapEx composition & cumulative connections">
        <ComposedChart data={data}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke={COLORS.axis} fontSize={11} />
          <YAxis yAxisId="l" stroke={COLORS.axis} fontSize={11} tickFormatter={(v)=>`${v.toFixed(0)}m`} />
          <YAxis yAxisId="r" orientation="right" stroke={COLORS.axis} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="l" dataKey="Densification" stackId="a" fill={COLORS.series1} />
          <Bar yAxisId="l" dataKey="Extension" stackId="a" fill={COLORS.series2} />
          <Bar yAxisId="l" dataKey="GridReinf" stackId="a" fill={COLORS.series3} />
          <Line yAxisId="r" type="monotone" dataKey="CumHH" stroke={COLORS.pos} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ChartFrame>
    </>
  );
}

export function RevenueTab({ r }: { r: EngineResults }) {
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const data = makeData({
    RevCollected: r.revCollected.map(v=>v/1e6),
    BulkCost: r.bulkCost.map(v=>v/1e6),
    GrossMargin: r.grossMargin.map(v=>v/1e6),
  });
  return (
    <>
      <YearTable rows={[
        { label: "Cumulative HH", values: r.cumHH, total: r.cumHH[9] },
        { label: "Total kWh sold (m)", values: r.annualKWh.map(v=>v/1e6), total: sum(r.annualKWh)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Social kWh (m)", values: r.socialKWh.map(v=>v/1e6), total: sum(r.socialKWh)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Social revenue (NADm)", values: r.socialRev.map(v=>v/1e6), total: sum(r.socialRev)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Standard kWh (m)", values: r.stdKWh.map(v=>v/1e6), total: sum(r.stdKWh)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Standard revenue (NADm)", values: r.stdRev.map(v=>v/1e6), total: sum(r.stdRev)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Higher kWh (m)", values: r.higherKWh.map(v=>v/1e6), total: sum(r.higherKWh)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Higher revenue (NADm)", values: r.higherRev.map(v=>v/1e6), total: sum(r.higherRev)/1e6, format:(v)=>v.toFixed(1) },
        { label: "GROSS REVENUE (NADm)", values: r.grossRev.map(v=>v/1e6), total: sum(r.grossRev)/1e6, format:(v)=>v.toFixed(1), highlight: true },
        { label: "REVENUE COLLECTED (NADm)", values: r.revCollected.map(v=>v/1e6), total: r.totalRevenue10/1e6, format:(v)=>v.toFixed(1), highlight: true },
        { label: "NamPower bulk cost (NADm)", values: r.bulkCost.map(v=>v/1e6), total: sum(r.bulkCost)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Gross energy margin (NADm)", values: r.grossMargin.map(v=>v/1e6), total: sum(r.grossMargin)/1e6, format:(v)=>v.toFixed(1), highlight: true, colorByValue: true },
        { label: "Avg margin per kWh (NAD)", values: r.marginPerKWh, total: r.marginPerKWh.reduce((a,b)=>a+b,0)/10, format:(v)=>v.toFixed(2), colorByValue: true },
      ]} />
      <ChartFrame title="Revenue vs Bulk Cost vs Margin (NADm)">
        <LineChart data={data}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke={COLORS.axis} fontSize={11} />
          <YAxis stroke={COLORS.axis} fontSize={11} tickFormatter={(v)=>v.toFixed(0)} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="RevCollected" stroke={COLORS.pos} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="BulkCost" stroke={COLORS.warn} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="GrossMargin" stroke={COLORS.primary} strokeWidth={2} dot={false} />
        </LineChart>
      </ChartFrame>
    </>
  );
}

export function CostsTab({ r }: { r: EngineResults }) {
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const data = makeData({
    EBITDA: r.ebitda.map(v=>v/1e6),
    OpEx: r.totalOpex.map(v=>v/1e6),
    Depreciation: r.depreciation.map(v=>v/1e6),
  });
  return (
    <>
      <YearTable rows={[
        { label: "OpEx per HH (NAD)", values: r.opexPerHHEsc, format: (v)=>v.toFixed(0) },
        { label: "Total OpEx (NADm)", values: r.totalOpex.map(v=>v/1e6), total: sum(r.totalOpex)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Cumulative CapEx (NADm)", values: r.cumCapex.map(v=>v/1e6), total: r.cumCapex[9]/1e6, format:(v)=>v.toFixed(1) },
        { label: "Depreciation (NADm)", values: r.depreciation.map(v=>v/1e6), total: sum(r.depreciation)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Gross energy margin (NADm)", values: r.grossMargin.map(v=>v/1e6), total: sum(r.grossMargin)/1e6, format:(v)=>v.toFixed(1), colorByValue: true },
        { label: "Less: OpEx (NADm)", values: r.totalOpex.map(v=>-v/1e6), total: -sum(r.totalOpex)/1e6, format:(v)=>v.toFixed(1) },
        { label: "EBITDA (NADm)", values: r.ebitda.map(v=>v/1e6), total: r.totalEBITDA10/1e6, format:(v)=>v.toFixed(1), highlight: true, colorByValue: true },
        { label: "Less: Depreciation (NADm)", values: r.depreciation.map(v=>-v/1e6), total: -sum(r.depreciation)/1e6, format:(v)=>v.toFixed(1) },
        { label: "EBIT (NADm)", values: r.ebit.map(v=>v/1e6), total: sum(r.ebit)/1e6, format:(v)=>v.toFixed(1), highlight: true, colorByValue: true },
      ]} />
      <ChartFrame title="EBITDA / OpEx / Depreciation (NADm)">
        <BarChart data={data}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke={COLORS.axis} fontSize={11} />
          <YAxis stroke={COLORS.axis} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="EBITDA" fill={COLORS.pos} />
          <Bar dataKey="OpEx" fill={COLORS.warn} />
          <Bar dataKey="Depreciation" fill={COLORS.series3} />
        </BarChart>
      </ChartFrame>
    </>
  );
}

export function FinancingTab({ r, threshold }: { r: EngineResults; threshold: number }) {
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const data = YEAR_LABELS.map((y, i) => ({
    year: y,
    DSCR: r.dscr[i] != null && isFinite(r.dscr[i] as number) ? r.dscr[i] : null,
  }));
  return (
    <>
      <YearTable rows={[
        { label: "Annual CapEx (NADm)", values: r.totalCapex.map(v=>v/1e6), total: r.totalCapex10/1e6, format:(v)=>v.toFixed(1) },
        { label: "Grant funding (NADm)", values: r.grantFunding.map(v=>v/1e6), total: r.totalGrant10/1e6, format:(v)=>v.toFixed(1) },
        { label: "Concessional drawn (NADm)", values: r.concLoanDrawn.map(v=>v/1e6), total: sum(r.concLoanDrawn)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Commercial drawn (NADm)", values: r.commLoanDrawn.map(v=>v/1e6), total: sum(r.commLoanDrawn)/1e6, format:(v)=>v.toFixed(1) },
        { label: "RBF received (NADm)", values: r.rbfReceived.map(v=>v/1e6), total: sum(r.rbfReceived)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Financing gap (NADm)", values: r.financingGap.map(v=>v/1e6), total: sum(r.financingGap)/1e6, format:(v)=>v.toFixed(1), colorByValue: true },
        { label: "Cum. concessional bal (NADm)", values: r.cumConcBalance.map(v=>v/1e6), format:(v)=>v.toFixed(1) },
        { label: "Concessional interest (NADm)", values: r.concInterest.map(v=>v/1e6), total: sum(r.concInterest)/1e6, format:(v)=>v.toFixed(2) },
        { label: "Concessional principal (NADm)", values: r.concPrincipal.map(v=>v/1e6), total: sum(r.concPrincipal)/1e6, format:(v)=>v.toFixed(2) },
        { label: "Commercial interest (NADm)", values: r.commInterest.map(v=>v/1e6), total: sum(r.commInterest)/1e6, format:(v)=>v.toFixed(2) },
        { label: "TOTAL DEBT SERVICE (NADm)", values: r.debtService.map(v=>v/1e6), total: r.totalDebtService10/1e6, format:(v)=>v.toFixed(2), highlight: true },
        { label: "EBITDA (NADm)", values: r.ebitda.map(v=>v/1e6), total: r.totalEBITDA10/1e6, format:(v)=>v.toFixed(1), colorByValue: true },
        { label: "DSCR", values: r.dscr.map((d)=> d==null?"—":(d as number).toFixed(2)), format: (v)=>v.toFixed(2), highlight: true },
        { label: "DSCR ≥ threshold?", values: r.dscr.map((d)=> d==null?"—":(d as number) >= threshold ? "✓" : "⚠") },
        { label: "Grant % of CapEx", values: r.grantPctCapex.map(v=>v*100), format:(v)=>`${v.toFixed(0)}%` },
        { label: "Grant per HH (NAD)", values: r.grantPerHHConn, format:(v)=>v.toFixed(0) },
      ]} />
      <ChartFrame title={`DSCR vs ${threshold}× covenant`}>
        <LineChart data={data}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke={COLORS.axis} fontSize={11} />
          <YAxis stroke={COLORS.axis} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine y={threshold} stroke={COLORS.warn} strokeDasharray="4 4" label={{ value: `${threshold}×`, fill: COLORS.warn, fontSize: 11 }} />
          <Line type="monotone" dataKey="DSCR" stroke={COLORS.primary} strokeWidth={2} />
        </LineChart>
      </ChartFrame>
    </>
  );
}

export function CashFlowTab({ r, discountRate, setDiscountRate }: { r: EngineResults; discountRate: number; setDiscountRate: (n: number) => void }) {
  const data = YEAR_LABELS.map((y, i) => ({
    year: y,
    FCF: r.fcf[i] / 1e6,
    Cumulative: r.cumFCF[i] / 1e6,
  }));
  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-card border border-border rounded p-2 col-span-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Discount rate</div>
          <input
            type="number"
            step={0.005}
            value={discountRate}
            onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
            className="w-full mt-1 bg-input rounded px-2 py-1 border border-border num text-sm"
          />
        </div>
        <KPI label="NPV (Free Cash Flow)" value={`${fmt.nadm(r.npv)} m`} tone={r.npv > 0 ? "pos" : "neg"} />
        <KPI label="Project IRR" value={r.irr == null ? "—" : `${(r.irr * 100).toFixed(1)}%`} tone={r.irr == null ? "neutral" : r.irr > discountRate ? "pos" : r.irr > 0 ? "warn" : "neg"} />
        <KPI label="Break-even" value={r.breakEven} tone={r.breakEven.startsWith("Year") ? "pos" : "warn"} />
      </div>
      <YearTable rows={[
        { label: "Revenue collected (NADm)", values: r.revCollected.map(v=>v/1e6), total: r.totalRevenue10/1e6, format:(v)=>v.toFixed(1) },
        { label: "NamPower bulk (NADm)", values: r.bulkCost.map(v=>-v/1e6), format:(v)=>v.toFixed(1) },
        { label: "OpEx (NADm)", values: r.totalOpex.map(v=>-v/1e6), format:(v)=>v.toFixed(1) },
        { label: "EBITDA (NADm)", values: r.ebitda.map(v=>v/1e6), total: r.totalEBITDA10/1e6, format:(v)=>v.toFixed(1), highlight: true, colorByValue: true },
        { label: "Interest expense (NADm)", values: r.interestExpense.map(v=>-v/1e6), format:(v)=>v.toFixed(2) },
        { label: "Depreciation (NADm)", values: r.depreciation.map(v=>-v/1e6), format:(v)=>v.toFixed(2) },
        { label: "Net Operating Surplus (NADm)", values: r.netOperatingSurplus.map(v=>v/1e6), format:(v)=>v.toFixed(1), highlight: true, colorByValue: true },
        { label: "Less: Total CapEx (NADm)", values: r.totalCapex.map(v=>-v/1e6), format:(v)=>v.toFixed(1) },
        { label: "Add: Grant (NADm)", values: r.grantFunding.map(v=>v/1e6), format:(v)=>v.toFixed(1) },
        { label: "Add: RBF (NADm)", values: r.rbfReceived.map(v=>v/1e6), format:(v)=>v.toFixed(1) },
        { label: "Less: Debt service (NADm)", values: r.debtService.map(v=>-v/1e6), format:(v)=>v.toFixed(2) },
        { label: "FREE CASH FLOW (NADm)", values: r.fcf.map(v=>v/1e6), total: r.totalFCF10/1e6, format:(v)=>v.toFixed(1), highlight: true, colorByValue: true },
        { label: "Cumulative FCF (NADm)", values: r.cumFCF.map(v=>v/1e6), format:(v)=>v.toFixed(1), colorByValue: true },
      ]} />
      <ChartFrame title="Free Cash Flow (NADm)">
        <ComposedChart data={data}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke={COLORS.axis} fontSize={11} />
          <YAxis stroke={COLORS.axis} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke={COLORS.grid} />
          <Bar dataKey="FCF">
            {data.map((d, i) => (
              <Cell key={i} fill={d.FCF >= 0 ? COLORS.pos : COLORS.neg} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="Cumulative" stroke={COLORS.primary} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ChartFrame>
    </>
  );
}

export function SolarTab({ r }: { r: EngineResults }) {
  const scenarios = [r.solar.noSolar, r.solar.fiveMW, r.solar.tenMW];
  const data = YEAR_LABELS.map((y, i) => ({
    year: y,
    NoSolar: r.solar.noSolar.years[i].totalPowerCost / 1e6,
    "5MW": r.solar.fiveMW.years[i].totalPowerCost / 1e6,
    "10MW": r.solar.tenMW.years[i].totalPowerCost / 1e6,
  }));
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((s) => (
          <div key={s.name} className="bg-card border border-border rounded p-3">
            <div className="text-sm font-semibold mb-2">{s.name}</div>
            <div className="text-xs space-y-1 num">
              <div className="flex justify-between"><span className="text-muted-foreground">10-yr total cost</span><span>{fmt.nadm(s.totalCost)}m</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">10-yr saving vs No Solar</span><span className={s.totalSaving>=0?"text-pos":"text-neg"}>{fmt.nadm(s.totalSaving)}m</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">10-yr CO₂ avoided</span><span>{fmt.num(s.totalCO2, 0)} tCO₂</span></div>
            </div>
          </div>
        ))}
      </div>
      <ChartFrame title="Total power supply cost per year (NADm)">
        <LineChart data={data}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke={COLORS.axis} fontSize={11} />
          <YAxis stroke={COLORS.axis} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="NoSolar" stroke={COLORS.warn} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="5MW" stroke={COLORS.primary} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="10MW" stroke={COLORS.pos} strokeWidth={2} dot={false} />
        </LineChart>
      </ChartFrame>
    </>
  );
}

export function MacroTab({ r }: { r: EngineResults }) {
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const data = YEAR_LABELS.map((y, i) => ({
    year: y,
    GDP: r.gdpContribution[i] / 1e6,
    CumJobs: r.cumJobs[i],
  }));
  return (
    <>
      <YearTable rows={[
        { label: "CapEx invested (NADm)", values: r.capexNADm, total: sum(r.capexNADm), format:(v)=>v.toFixed(1) },
        { label: "Direct jobs", values: r.directJobs, total: sum(r.directJobs), format:(v)=>v.toFixed(0) },
        { label: "Indirect jobs", values: r.indirectJobs, total: sum(r.indirectJobs), format:(v)=>v.toFixed(0) },
        { label: "Total jobs", values: r.totalJobs, total: sum(r.totalJobs), format:(v)=>v.toFixed(0), highlight: true },
        { label: "GDP contribution (NADm)", values: r.gdpContribution.map(v=>v/1e6), total: sum(r.gdpContribution)/1e6, format:(v)=>v.toFixed(1), highlight: true },
        { label: "HH income gain (NADm)", values: r.hhIncomeGain.map(v=>v/1e6), total: sum(r.hhIncomeGain)/1e6, format:(v)=>v.toFixed(1) },
        { label: "Tax revenue (NADm)", values: r.taxRevenue.map(v=>v/1e6), total: sum(r.taxRevenue)/1e6, format:(v)=>v.toFixed(1) },
        { label: "CO₂ avoided 5MW (tCO₂)", values: r.solar.fiveMW.years.map(y=>y.co2Avoided), total: r.solar.fiveMW.totalCO2, format:(v)=>v.toFixed(0) },
        { label: "Carbon credit value (NADm)", values: r.carbonValue.map(v=>v/1e6), total: sum(r.carbonValue)/1e6, format:(v)=>v.toFixed(2) },
      ]} />
      <ChartFrame title="GDP contribution (bars) vs Cumulative jobs (line)">
        <ComposedChart data={data}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke={COLORS.axis} fontSize={11} />
          <YAxis yAxisId="l" stroke={COLORS.axis} fontSize={11} tickFormatter={(v)=>`${v.toFixed(0)}m`} />
          <YAxis yAxisId="r" orientation="right" stroke={COLORS.axis} fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="l" dataKey="GDP" fill={COLORS.primary} />
          <Line yAxisId="r" type="monotone" dataKey="CumJobs" stroke={COLORS.pos} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ChartFrame>
    </>
  );
}

function colorFor(pct: number) {
  if (pct < 0.3) return "bg-pos/30 text-pos";
  if (pct < 0.6) return "bg-warn/30 text-warn";
  return "bg-neg/30 text-neg";
}

export function GrantMapTab({ r }: { r: EngineResults }) {
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Matrix 1 — Grant % required by connection type × tariff mix
        </div>
        <div className="overflow-x-auto scrollbar-thin border border-border rounded">
          <table className="w-full text-xs num">
            <thead className="bg-panel">
              <tr>
                <th className="text-left px-2 py-1.5 text-muted-foreground border-r border-border min-w-[160px]">Connection Type</th>
                {r.grantMatrixCols.map((c) => (
                  <th key={c} className="text-center px-2 py-1.5 text-muted-foreground font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.grantMatrixRows.map((row, ri) => (
                <tr key={row} className="border-t border-border">
                  <td className="px-2 py-1 border-r border-border font-sans">{row}</td>
                  {r.grantMatrix[ri].map((cell, ci) => (
                    <td key={ci} className={`text-center px-2 py-1 ${colorFor(cell.grantPct)}`}>
                      {(cell.grantPct * 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Matrix 2 — Funding sources (current model)
        </div>
        <FundingTable r={r} />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Matrix 3 — Annual grant disbursement schedule
        </div>
        <YearTable rows={[
          { label: "New connections", values: r.newHH, total: sum(r.newHH) },
          { label: "Annual CapEx (NADm)", values: r.capexNADm, total: sum(r.capexNADm), format:(v)=>v.toFixed(1) },
          { label: "Grant disbursed (NADm)", values: r.grantFunding.map(v=>v/1e6), total: r.totalGrant10/1e6, format:(v)=>v.toFixed(1), highlight: true },
          { label: "Grant % of CapEx", values: r.grantPctCapex.map(v=>v*100), format:(v)=>`${v.toFixed(0)}%` },
          { label: "Grant per HH (NAD)", values: r.grantPerHHConn, format:(v)=>v.toFixed(0) },
          { label: "Cumulative grant (NADm)", values: r.grantFunding.reduce<number[]>((acc,v,i)=>{ acc.push((acc[i-1]??0)+v/1e6); return acc; }, []), format:(v)=>v.toFixed(1) },
          { label: "RBF available (NADm)", values: r.rbfReceived.map(v=>v/1e6), total: sum(r.rbfReceived)/1e6, format:(v)=>v.toFixed(1) },
          { label: "Net grant after RBF (NADm)", values: r.grantFunding.map((g,i)=>(g - r.rbfReceived[i])/1e6), format:(v)=>v.toFixed(1) },
        ]} />
      </div>

      <div className="bg-card border border-border rounded p-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Financing gap verdict</div>
        {sum(r.financingGap) === 0 ? (
          <Badge ok text="No financing gap" />
        ) : (
          <Badge ok={false} text={`Gap remains — ${fmt.nadm(sum(r.financingGap))} NADm`} />
        )}
      </div>
    </div>
  );
}

function FundingTable({ r }: { r: EngineResults }) {
  const rows = [
    { src: "GRN MME Budget", type: "Grant", min: "5%", max: "15%", cur: r.verdicts.layer4GrantPct * 0.25, note: "Annual ~NAD40m/yr" },
    { src: "AfDB / RBF", type: "RBF Grant", min: "10%", max: "25%", cur: (r.totalCapex10>0? (50000 * 570 * 18.5)/r.totalCapex10 : 0), note: "USD 570/conn verified" },
    { src: "KfW / GCF", type: "Conc. Loan", min: "0%", max: "30%", cur: r.verdicts.layer4GrantPct === 0 ? 0 : (r.grantFunding.reduce((a,b)=>a+b,0)/r.totalCapex10) * 0 + (1 - r.verdicts.layer4GrantPct) , note: "Climate co-benefit" },
  ];
  // simpler & faithful display
  const grantPct = r.totalCapex10 > 0 ? r.totalGrant10/r.totalCapex10 : 0;
  const concPct = r.totalCapex10 > 0 ? r.concLoanDrawn.reduce((a,b)=>a+b,0)/r.totalCapex10 : 0;
  const commPct = r.totalCapex10 > 0 ? r.commLoanDrawn.reduce((a,b)=>a+b,0)/r.totalCapex10 : 0;
  const display = [
    { src: "GRN MME Budget", type: "Grant", min: "5%", max: "15%", cur: grantPct * 0.25, note: "Annual ~NAD40m/yr" },
    { src: "AfDB / RBF", type: "RBF Grant", min: "10%", max: "25%", cur: r.totalCapex10>0 ? r.rbfReceived.reduce((a,b)=>a+b,0)/r.totalCapex10 : 0, note: "USD 570/conn verified" },
    { src: "KfW / GCF", type: "Conc. Loan", min: "0%", max: "30%", cur: concPct, note: "Climate co-benefit" },
    { src: "World Bank / IDA", type: "Grant+Loan", min: "20%", max: "40%", cur: grantPct * 0.5, note: "Poverty targeting" },
    { src: "Electrification Fund", type: "Blended", min: "30%", max: "60%", cur: grantPct, note: "NELFP framework" },
    { src: "Commercial (RED)", type: "Loan", min: "0%", max: "20%", cur: commPct, note: "⚠ avoid on RED balance" },
    { src: "TOTAL BLENDED", type: "All", min: "40%", max: "80%", cur: grantPct + concPct, note: "Optimal blend" },
  ];
  return (
    <div className="overflow-x-auto scrollbar-thin border border-border rounded">
      <table className="w-full text-xs num">
        <thead className="bg-panel">
          <tr>
            {["Source", "Type", "Min", "Max", "Current %", "Notes"].map((h) => (
              <th key={h} className="text-left px-2 py-1.5 text-muted-foreground font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {display.map((r) => (
            <tr key={r.src} className="border-t border-border hover:bg-accent/20">
              <td className="px-2 py-1 font-sans">{r.src}</td>
              <td className="px-2 py-1 font-sans text-muted-foreground">{r.type}</td>
              <td className="px-2 py-1">{r.min}</td>
              <td className="px-2 py-1">{r.max}</td>
              <td className="px-2 py-1 text-primary">{(r.cur*100).toFixed(1)}%</td>
              <td className="px-2 py-1 font-sans text-muted-foreground">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
