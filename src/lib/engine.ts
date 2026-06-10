// Pure financial engine for Alfred's City Urban Electrification 10-year model.
// All inputs in NAD unless noted. Years are indexed 0..9 (2025..2034).

export const YEARS = 10;
export const YEAR_LABELS = Array.from({ length: YEARS }, (_, i) => 2025 + i);

export interface Assumptions {
  // A — Urban Planning & Demand
  totalHH: number;
  paceY1_3: number;
  paceY4_7: number;
  paceY8_10: number;
  densificationShare: number; // 0..1
  socialShare: number; // 0..1
  standardShare: number;
  higherShare: number;
  avgConsumption: number; // kWh/HH/month
  demandGrowth: number; // 0..1
  technicalLosses: number; // 0..1
  collectionRate: number; // 0..1

  // B — RED Grid
  capexDense: number; // NAD/HH
  capexExtension: number; // NAD/HH
  substationCost: number; // NAD
  numSubstations: number;
  mvReinforcement: number; // NAD
  opexPerHH: number; // NAD/HH/yr
  depreciationRate: number; // 0..1
  nampowerBulk: number; // NAD/kWh
  costEscalation: number; // 0..1

  // C — Solar
  solarCapex: number; // NAD/MW
  solarCapacityFactor: number; // 0..1
  solarOMM: number; // NAD/MW/yr (unused in core, stored)
  solarLCOE: number; // NAD/kWh
  solarGrantShare: number;
  solarConcLoanShare: number;

  // D — Tariffs
  socialTariff: number; // NAD/kWh
  standardTariff: number;
  higherTariff: number;
  tariffEscalation: number; // 0..1

  // E — Financing
  grantShare: number;
  concessionalShare: number;
  commercialShare: number;
  concessionalRate: number;
  commercialRate: number;
  concessionalTenor: number;
  commercialTenor: number;
  gracePeriod: number;
  dscrThreshold: number;
  rbfUSD: number;
  fxRate: number;

  // F — Macro 
  urbanPopGrowth: number;
  incomeElasticity: number;
  contingency: number;
  jobsPerNADm: number;
  indirectJobMult: number;
  gdpMultiplier: number;
  co2Factor: number; // tCO2/kWh
  hhIncomeGain: number;
  avgHHIncome: number;
  carbonPriceUSD: number;
  marginalTax: number;

  // Cash flow
  discountRate: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  totalHH: 50000,
  paceY1_3: 3000,
  paceY4_7: 5000,
  paceY8_10: 6500,
  densificationShare: 0.7,
  socialShare: 0.5,
  standardShare: 0.35,
  higherShare: 0.15,
  avgConsumption: 400,
  demandGrowth: 0.035,
  technicalLosses: 0.08,
  collectionRate: 0.88,

  capexDense: 20000,
  capexExtension: 32000,
  substationCost: 15_000_000,
  numSubstations: 4,
  mvReinforcement: 50_000_000,
  opexPerHH: 1200,
  depreciationRate: 0.05,
  nampowerBulk: 1.85,
  costEscalation: 0.055,

  solarCapex: 15_850_000,
  solarCapacityFactor: 0.25,
  solarOMM: 344_000,
  solarLCOE: 0.711,
  solarGrantShare: 0.3,
  solarConcLoanShare: 0.7,

  socialTariff: 1.5,
  standardTariff: 2.75,
  higherTariff: 3.1,
  tariffEscalation: 0.07,

  grantShare: 0.4,
  concessionalShare: 0.4,
  commercialShare: 0.2,
  concessionalRate: 0.03,
  commercialRate: 0.085,
  concessionalTenor: 20,
  commercialTenor: 10,
  gracePeriod: 3,
  dscrThreshold: 1.2,
  rbfUSD: 570,
  fxRate: 18.5,

  urbanPopGrowth: 0.03,
  incomeElasticity: 0.8,
  contingency: 0.15,
  jobsPerNADm: 2.5,
  indirectJobMult: 1.5,
  gdpMultiplier: 1.8,
  co2Factor: 0.00078,
  hhIncomeGain: 0.12,
  avgHHIncome: 60000,
  carbonPriceUSD: 15,
  marginalTax: 0.18,

  discountRate: 0.08,
};

const zeros = () => new Array<number>(YEARS).fill(0);
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0);

export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0);
}

export function irr(cashflows: number[], guess = 0.1): number | null {
  // bisection between -0.99 and 5
  let lo = -0.99;
  let hi = 5;
  const f = (r: number) => npv(r, cashflows);
  let fLo = f(lo);
  let fHi = f(hi);
  if (isNaN(fLo) || isNaN(fHi)) return null;
  if (fLo * fHi > 0) {
    // try newton
    let r = guess;
    for (let i = 0; i < 100; i++) {
      const v = f(r);
      const dv = (f(r + 1e-6) - v) / 1e-6;
      if (Math.abs(dv) < 1e-12) break;
      const nr = r - v / dv;
      if (!isFinite(nr)) break;
      if (Math.abs(nr - r) < 1e-7) return nr;
      r = nr;
    }
    return null;
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-3) return mid;
    if (fLo * fm < 0) {
      hi = mid;
      fHi = fm;
    } else {
      lo = mid;
      fLo = fm;
    }
  }
  return (lo + hi) / 2;
}

export interface EngineResults {
  years: number[];
  newHH: number[];
  cumHH: number[];
  denseHH: number[];
  extHH: number[];
  denseCapex: number[];
  extCapex: number[];
  gridReinfCapex: number[];
  connectionFeeRev: number[];
  totalCapex: number[];

  annualKWh: number[];
  socialKWh: number[];
  socialRev: number[];
  stdKWh: number[];
  stdRev: number[];
  higherKWh: number[];
  higherRev: number[];
  grossRev: number[];
  revCollected: number[];
  bulkCost: number[];
  grossMargin: number[];
  marginPerKWh: number[];

  opexPerHHEsc: number[];
  totalOpex: number[];
  cumCapex: number[];
  depreciation: number[];
  ebitda: number[];
  ebit: number[];

  grantFunding: number[];
  concLoanDrawn: number[];
  commLoanDrawn: number[];
  rbfReceived: number[];
  financingGap: number[];
  cumConcBalance: number[];
  concInterest: number[];
  concPrincipal: number[];
  commInterest: number[];
  commPrincipal: number[];
  debtService: number[];
  dscr: (number | null)[];
  grantPctCapex: number[];
  grantPerHHConn: number[];

  interestExpense: number[];
  netOperatingSurplus: number[];
  fcf: number[];
  cumFCF: number[];

  // solar
  solar: SolarScenarioSet;

  // macro
  capexNADm: number[];
  directJobs: number[];
  indirectJobs: number[];
  totalJobs: number[];
  cumJobs: number[];
  investmentNADm: number[];
  gdpContribution: number[];
  hhIncomeGain: number[];
  taxRevenue: number[];
  carbonValue: number[];

  // summary KPIs
  totalRevenue10: number;
  totalEBITDA10: number;
  totalCapex10: number;
  totalGrant10: number;
  grantPerHH: number;
  avgDSCR: number;
  irr: number | null;
  npv: number;
  totalDebtService10: number;
  totalFCF10: number;
  breakEven: string;

  blendedTariff: number;
  marginPerKWhBlended: number;
  crossSubsidyLossPerKWh: number;

  verdicts: Verdicts;

  // grant heatmap
  grantMatrix: GrantMatrixCell[][];
  grantMatrixRows: string[];
  grantMatrixCols: string[];

  warnings: string[];
}

export interface GrantMatrixCell {
  grantPct: number;
  capex: number;
}

export interface Verdicts {
  ebitdaPositive: boolean;
  dscrOk: boolean;
  marginPositive: boolean;
  noGap: boolean;
  layer1: boolean;
  layer2: boolean;
  layer3: boolean;
  layer4: boolean; // true = pass (grant share <=50)
  layer5: boolean;
  overall: "viable" | "concessional" | "subsidy";
  layer3Loss: number;
  layer4GrantPct: number;
  layer5GDP: number;
  layer5Capex: number;
}

export interface SolarScenarioYear {
  solarKWh: number;
  solarCost: number;
  offset: number;
  residualBulk: number;
  totalPowerCost: number;
  savingVsNoSolar: number;
  co2Avoided: number;
}

export interface SolarScenario {
  name: string;
  mw: number;
  startYear: number; // index
  years: SolarScenarioYear[];
  totalSaving: number;
  totalCO2: number;
  totalCost: number;
}

export interface SolarScenarioSet {
  noSolar: SolarScenario;
  fiveMW: SolarScenario;
  tenMW: SolarScenario;
}

function newHHPerYear(a: Assumptions): number[] {
  const arr = zeros();
  for (let y = 0; y < YEARS; y++) {
    if (y < 3) arr[y] = a.paceY1_3;
    else if (y < 7) arr[y] = a.paceY4_7;
    else arr[y] = a.paceY8_10;
  }
  // cap cumulative at totalHH
  let cum = 0;
  for (let y = 0; y < YEARS; y++) {
    const remaining = Math.max(0, a.totalHH - cum);
    arr[y] = Math.min(arr[y], remaining);
    cum += arr[y];
  }
  return arr;
}

function computeSolarScenario(
  name: string,
  mw: number,
  startYear: number,
  demandKWh: number[],
  noSolarBulk: number[],
  a: Assumptions,
): SolarScenario {
  const years: SolarScenarioYear[] = [];
  let totalSaving = 0;
  let totalCO2 = 0;
  let totalCost = 0;
  for (let y = 0; y < YEARS; y++) {
    const active = y >= startYear && mw > 0;
    const solarKWh = active ? mw * 1000 * a.solarCapacityFactor * 8760 : 0;
    const solarCost = solarKWh * a.solarLCOE;
    const offset = Math.min(solarKWh, demandKWh[y]);
    const residualBulk =
      (demandKWh[y] - offset) * a.nampowerBulk * Math.pow(1 + a.costEscalation, y);
    const totalPowerCost = solarCost + residualBulk;
    const saving = noSolarBulk[y] - totalPowerCost;
    const co2 = solarKWh * a.co2Factor;
    years.push({
      solarKWh,
      solarCost,
      offset,
      residualBulk,
      totalPowerCost,
      savingVsNoSolar: saving,
      co2Avoided: co2,
    });
    totalSaving += saving;
    totalCO2 += co2;
    totalCost += totalPowerCost;
  }
  return { name, mw, startYear, years, totalSaving, totalCO2, totalCost };
}

export function calculate(input: Assumptions): EngineResults {
  const warnings: string[] = [];
  const a = { ...input };

  // Validate & normalize tariff shares
  const tariffSum = a.socialShare + a.standardShare + a.higherShare;
  if (Math.abs(tariffSum - 1) > 0.005) {
    warnings.push(
      `Tariff shares sum to ${(tariffSum * 100).toFixed(1)}% (normalized to 100%)`,
    );
    if (tariffSum > 0) {
      a.socialShare /= tariffSum;
      a.standardShare /= tariffSum;
      a.higherShare /= tariffSum;
    }
  }
  const finSum = a.grantShare + a.concessionalShare + a.commercialShare;
  if (Math.abs(finSum - 1) > 0.005) {
    warnings.push(
      `Financing shares sum to ${(finSum * 100).toFixed(1)}% (normalized to 100%)`,
    );
    if (finSum > 0) {
      a.grantShare /= finSum;
      a.concessionalShare /= finSum;
      a.commercialShare /= finSum;
    }
  }

  // Rollout
  const newHH = newHHPerYear(a);
  const cumHH = zeros();
  let c = 0;
  for (let y = 0; y < YEARS; y++) {
    c += newHH[y];
    cumHH[y] = c;
  }
  const denseHH = newHH.map((n) => Math.round(n * a.densificationShare));
  const extHH = newHH.map((n, i) => n - denseHH[i]);
  const denseCapex = denseHH.map((h) => h * a.capexDense);
  const extCapex = extHH.map((h) => h * a.capexExtension);
  const gridReinfCapex = zeros();
  gridReinfCapex[0] = a.substationCost * a.numSubstations;
  gridReinfCapex[2] = a.mvReinforcement;
  const connectionFeeRev = zeros(); // not modeled separately; could be added
  const totalCapex = denseCapex.map((d, i) => d + extCapex[i] + gridReinfCapex[i]);

  // Revenue
  const annualKWh = zeros();
  const socialKWh = zeros();
  const stdKWh = zeros();
  const higherKWh = zeros();
  const socialRev = zeros();
  const stdRev = zeros();
  const higherRev = zeros();
  const grossRev = zeros();
  const revCollected = zeros();
  const bulkCost = zeros();
  const grossMargin = zeros();
  const marginPerKWh = zeros();
  for (let y = 0; y < YEARS; y++) {
    const kwhMonth = cumHH[y] * a.avgConsumption * Math.pow(1 + a.demandGrowth, y);
    const sold = kwhMonth * 12 * (1 - a.technicalLosses);
    annualKWh[y] = sold;
    socialKWh[y] = sold * a.socialShare;
    stdKWh[y] = sold * a.standardShare;
    higherKWh[y] = sold * a.higherShare;
    const esc = Math.pow(1 + a.tariffEscalation, y);
    socialRev[y] = socialKWh[y] * a.socialTariff * esc;
    stdRev[y] = stdKWh[y] * a.standardTariff * esc;
    higherRev[y] = higherKWh[y] * a.higherTariff * esc;
    grossRev[y] = socialRev[y] + stdRev[y] + higherRev[y];
    revCollected[y] = grossRev[y] * a.collectionRate;
    bulkCost[y] = sold * a.nampowerBulk * Math.pow(1 + a.costEscalation, y);
    grossMargin[y] = revCollected[y] - bulkCost[y];
    marginPerKWh[y] = sold > 0 ? grossMargin[y] / sold : 0;
  }

  // OpEx + EBITDA
  const opexPerHHEsc = zeros();
  const totalOpex = zeros();
  const cumCapex = zeros();
  const depreciation = zeros();
  const ebitda = zeros();
  const ebit = zeros();
  let cumCap = 0;
  for (let y = 0; y < YEARS; y++) {
    opexPerHHEsc[y] = a.opexPerHH * Math.pow(1 + a.costEscalation, y);
    totalOpex[y] = cumHH[y] * opexPerHHEsc[y];
    cumCap += totalCapex[y];
    cumCapex[y] = cumCap;
    depreciation[y] = cumCapex[y] * a.depreciationRate;
    ebitda[y] = grossMargin[y] - totalOpex[y];
    ebit[y] = ebitda[y] - depreciation[y];
  }

  // Financing
  const grantFunding = totalCapex.map((c) => c * a.grantShare);
  const concLoanDrawn = totalCapex.map((c) => c * a.concessionalShare);
  const commLoanDrawn = totalCapex.map((c) => c * a.commercialShare);
  const rbfReceived = newHH.map((n) => n * a.rbfUSD * a.fxRate);
  const financingGap = totalCapex.map((c, i) =>
    Math.max(0, c - grantFunding[i] - concLoanDrawn[i] - commLoanDrawn[i] - rbfReceived[i]),
  );

  const cumConcBalance = zeros();
  const concInterest = zeros();
  const concPrincipal = zeros();
  const commInterest = zeros();
  const commPrincipal = zeros();
  let concBal = 0;
  let commBal = 0;
  for (let y = 0; y < YEARS; y++) {
    concBal += concLoanDrawn[y];
    commBal += commLoanDrawn[y];
    cumConcBalance[y] = concBal;
    concInterest[y] = concBal * a.concessionalRate;
    if (y + 1 > a.gracePeriod && a.concessionalTenor > a.gracePeriod) {
      concPrincipal[y] = concBal / Math.max(1, a.concessionalTenor - a.gracePeriod);
    }
    commInterest[y] = commBal * a.commercialRate;
    if (a.commercialTenor > 0) {
      commPrincipal[y] = commBal / a.commercialTenor;
    }
  }
  const debtService = concInterest.map(
    (ci, i) => ci + concPrincipal[i] + commInterest[i] + commPrincipal[i],
  );
  const dscr: (number | null)[] = debtService.map((d, i) =>
    d > 0 ? ebitda[i] / d : null,
  );
  const grantPctCapex = grantFunding.map((g, i) => (totalCapex[i] > 0 ? g / totalCapex[i] : 0));
  const grantPerHHConn = grantFunding.map((g, i) => (newHH[i] > 0 ? g / newHH[i] : 0));

  // Cash flow
  const interestExpense = concInterest.map((c, i) => c + commInterest[i]);
  const netOperatingSurplus = ebitda.map(
    (e, i) => e - interestExpense[i] - depreciation[i],
  );
  const fcf = ebitda.map(
    (e, i) => e - totalCapex[i] + grantFunding[i] + rbfReceived[i] - debtService[i],
  );
  const cumFCF = zeros();
  let cf = 0;
  for (let y = 0; y < YEARS; y++) {
    cf += fcf[y];
    cumFCF[y] = cf;
  }
  const projectIRR = irr(fcf);
  const projectNPV = npv(a.discountRate, fcf);
  const breakEvenYear = cumFCF.findIndex((v) => v >= 0);
  const breakEven = breakEvenYear >= 0 ? `Year ${2025 + breakEvenYear}` : "Beyond 10 years";

  // Solar scenarios — base noSolar bulk uses same demand
  const noSolarBulk = bulkCost.slice();
  const solar: SolarScenarioSet = {
    noSolar: computeSolarScenario("No Solar", 0, 0, annualKWh, noSolarBulk, a),
    fiveMW: computeSolarScenario("5MW Solar (Yr 3+)", 5, 2, annualKWh, noSolarBulk, a),
    tenMW: computeSolarScenario("10MW Solar (Yr 3+)", 10, 2, annualKWh, noSolarBulk, a),
  };

  // Macro
  const capexNADm = totalCapex.map((c) => c / 1_000_000);
  const directJobs = capexNADm.map((c) => c * a.jobsPerNADm);
  const indirectJobs = directJobs.map((j) => j * a.indirectJobMult);
  const totalJobs = directJobs.map((d, i) => d + indirectJobs[i]);
  const cumJobs = zeros();
  let jt = 0;
  for (let y = 0; y < YEARS; y++) {
    jt += totalJobs[y];
    cumJobs[y] = jt;
  }
  const investmentNADm = capexNADm;
  const gdpContribution = totalCapex.map((c) => c * a.gdpMultiplier);
  const hhIncomeGainArr = cumHH.map(
    (h) => (h * a.avgHHIncome * a.hhIncomeGain) / 1, // NAD per year
  );
  const taxRevenue = hhIncomeGainArr.map((i) => i * a.marginalTax);
  const carbonValue = solar.fiveMW.years.map(
    (sy) => sy.co2Avoided * a.carbonPriceUSD * a.fxRate,
  );

  // Summary KPIs
  const totalRevenue10 = sum(revCollected);
  const totalEBITDA10 = sum(ebitda);
  const totalCapex10 = sum(totalCapex);
  const totalGrant10 = sum(grantFunding);
  const grantPerHH = a.totalHH > 0 ? totalGrant10 / a.totalHH : 0;
  const dscrVals = dscr.filter((x): x is number => x != null && isFinite(x));
  const avgDSCR = dscrVals.length ? avg(dscrVals) : 0;
  const totalDebtService10 = sum(debtService);
  const totalFCF10 = sum(fcf);

  // Derived tariff
  const blendedTariff =
    a.socialShare * a.socialTariff +
    a.standardShare * a.standardTariff +
    a.higherShare * a.higherTariff;
  const marginPerKWhBlended = blendedTariff - a.nampowerBulk;
  const crossSubsidyLossPerKWh = Math.max(0, a.nampowerBulk - a.socialTariff);

  // Verdicts
  const ebitdaPositive = totalEBITDA10 > 0;
  const dscrOk = avgDSCR >= a.dscrThreshold;
  const marginPositive = marginPerKWhBlended > 0;
  const noGap = sum(financingGap) === 0;
  const layer1 = a.totalHH >= 10000;
  const avgMarginPerKWh = avg(marginPerKWh);
  const layer2 = avgMarginPerKWh > 0;
  const layer3 = crossSubsidyLossPerKWh === 0;
  const layer4 = a.grantShare <= 0.5;
  const totalGDP = sum(gdpContribution);
  const layer5 = totalGDP > totalCapex10;
  let overall: Verdicts["overall"];
  if (projectIRR != null && projectIRR > a.discountRate) overall = "viable";
  else if (projectIRR != null && projectIRR > 0) overall = "concessional";
  else overall = "subsidy";

  const verdicts: Verdicts = {
    ebitdaPositive,
    dscrOk,
    marginPositive,
    noGap,
    layer1,
    layer2,
    layer3,
    layer4,
    layer5,
    overall,
    layer3Loss: crossSubsidyLossPerKWh,
    layer4GrantPct: a.grantShare,
    layer5GDP: totalGDP,
    layer5Capex: totalCapex10,
  };

  // Grant matrix (Matrix 1)
  const rowDefs: Array<{ label: string; capex: number }> = [
    { label: "Densification", capex: a.capexDense },
    { label: "Extension", capex: a.capexExtension },
    { label: "Ext + Substation", capex: 47000 },
    { label: "Off-Grid SHS", capex: 8500 },
  ];
  const colDefs: Array<{ label: string; mix: [number, number, number] }> = [
    { label: "100% Social", mix: [1, 0, 0] },
    { label: "75/25 S+St", mix: [0.75, 0.25, 0] },
    { label: "50/50", mix: [0.5, 0.5, 0] },
    { label: "25/75 S+St", mix: [0.25, 0.75, 0] },
    { label: "100% Standard", mix: [0, 1, 0] },
    { label: "Model Mix", mix: [a.socialShare, a.standardShare, a.higherShare] },
    { label: "100% Higher", mix: [0, 0, 1] },
  ];
  const kwhPerHHYr = a.avgConsumption * 12 * (1 - a.technicalLosses);
  const npvFactor = (1 - 1 / Math.pow(1 + 0.08, 20)) / 0.08;
  const grantMatrix: GrantMatrixCell[][] = rowDefs.map((r) =>
    colDefs.map((col) => {
      const blended =
        col.mix[0] * a.socialTariff +
        col.mix[1] * a.standardTariff +
        col.mix[2] * a.higherTariff;
      const annualNet =
        kwhPerHHYr * blended * a.collectionRate -
        kwhPerHHYr * a.nampowerBulk -
        a.opexPerHH;
      const grantPct = Math.max(
        0,
        Math.min(1, 1 - (annualNet * npvFactor) / r.capex),
      );
      return { grantPct, capex: r.capex };
    }),
  );

  return {
    years: YEAR_LABELS,
    newHH,
    cumHH,
    denseHH,
    extHH,
    denseCapex,
    extCapex,
    gridReinfCapex,
    connectionFeeRev,
    totalCapex,
    annualKWh,
    socialKWh,
    socialRev,
    stdKWh,
    stdRev,
    higherKWh,
    higherRev,
    grossRev,
    revCollected,
    bulkCost,
    grossMargin,
    marginPerKWh,
    opexPerHHEsc,
    totalOpex,
    cumCapex,
    depreciation,
    ebitda,
    ebit,
    grantFunding,
    concLoanDrawn,
    commLoanDrawn,
    rbfReceived,
    financingGap,
    cumConcBalance,
    concInterest,
    concPrincipal,
    commInterest,
    commPrincipal,
    debtService,
    dscr,
    grantPctCapex,
    grantPerHHConn,
    interestExpense,
    netOperatingSurplus,
    fcf,
    cumFCF,
    solar,
    capexNADm,
    directJobs,
    indirectJobs,
    totalJobs,
    cumJobs,
    investmentNADm,
    gdpContribution,
    hhIncomeGain: hhIncomeGainArr,
    taxRevenue,
    carbonValue,
    totalRevenue10,
    totalEBITDA10,
    totalCapex10,
    totalGrant10,
    grantPerHH,
    avgDSCR,
    irr: projectIRR,
    npv: projectNPV,
    totalDebtService10,
    totalFCF10,
    breakEven,
    blendedTariff,
    marginPerKWhBlended,
    crossSubsidyLossPerKWh,
    verdicts,
    grantMatrix,
    grantMatrixRows: rowDefs.map((r) => r.label),
    grantMatrixCols: colDefs.map((c) => c.label),
    warnings,
  };
}

// Formatters
export const fmt = {
  nad: (v: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v),
  nadm: (v: number) =>
    (v / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 }),
  pct: (v: number, d = 1) => `${(v * 100).toFixed(d)}%`,
  num: (v: number, d = 0) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: d }).format(v),
  dec: (v: number, d = 2) => v.toFixed(d),
};
