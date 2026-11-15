// Calculators for the LFN Companion App.
// Each calculator: fields (inputs) + compute(values) -> {out, work, notes, refs}.
// Concentrations and formulas cite the Patient Care Guidelines by PDF page; refs link to "#<section>@<pdf page>".
(function(){
'use strict';

const r = (x, d = 1) => { if (!isFinite(x)) return '—'; const f = Math.pow(10, d); return String(Math.round(x * f) / f); };
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; };
const kg = (v) => v.wunit === 'lb' ? num(v.w) / 2.2046226218 : num(v.w);
const has = x => isFinite(x) && x > 0;
const mins = m => { if (!isFinite(m) || m < 0) return '—'; const h = Math.floor(m / 60), mm = Math.floor(m - h * 60); return h ? `${h} h ${mm} min` : `${mm} min`; };
const W = [{id: 'w', label: 'Weight', type: 'number', unit: ''}, {id: 'wunit', type: 'seg', options: ['kg', 'lb'], def: 'kg'}];
const wWork = v => v.wunit === 'lb' && has(num(v.w)) ? [`${r(num(v.w), 1)} lb ÷ 2.2046 = ${r(kg(v), 2)} kg`] : [];

// 12.01 Recommended Infusion Mixtures, PDF page 311. amount per mL in the given unit.
// Units: the dosing units used in each drug's own monograph (PDF page noted).
const DRUGS = [
  {n: 'Amiodarone', c: 1.8, u: 'mg', mix: '450 mg / 250 mL', units: ['mg/min', 'mcg/kg/min'], sec: '12.07', p: 319},
  {n: 'Amiodarone (400 mg / 250 mL)', c: 1.6, u: 'mg', mix: '400 mg / 250 mL', units: ['mg/min', 'mcg/kg/min'], sec: '12.07', p: 319, warn: 'Amiodarone is listed twice in the mix table on p.310 (450 mg / 250 mL and 400 mg / 250 mL). The second line may be a typo for another drug. Confirm the bag concentration before using this result.'},
  {n: 'Clevidipine', c: 0.5, u: 'mg', mix: '50 mg / 100 mL', units: ['mg/hr'], sec: '12.15', p: 327},
  {n: 'Dexmedetomidine', c: 4, u: 'mcg', mix: '400 mcg / 100 mL', units: ['mcg/kg/hr'], sec: '12.18', p: 331},
  {n: 'Diltiazem', c: 1, u: 'mg', mix: '100 mg / 100 mL', units: ['mg/hr'], sec: '12.21', p: 334},
  {n: 'DoBUTamine', c: 1, u: 'mg', mix: '250 mg / 250 mL', units: ['mcg/kg/min'], sec: '12.23', p: 336},
  {n: 'Epinephrine', c: 16, u: 'mcg', mix: '4 mg / 250 mL', units: ['mcg/min', 'mcg/kg/min'], sec: '12.26', p: 340},
  {n: 'Esmolol', c: 10, u: 'mg', mix: '2,500 mg / 250 mL', units: ['mcg/kg/min'], sec: '12.28', p: 343},
  {n: 'Fentanyl', c: 2, u: 'mcg', mix: '200 mcg / 100 mL', units: ['mcg/hr', 'mcg/kg/hr'], sec: '12.30', p: 346},
  {n: 'Heparin', c: 50, u: 'units', mix: '5,000 units / 100 mL', units: ['units/hr', 'units/kg/hr'], sec: '12.35', p: 351},
  {n: 'Hydralazine', c: 0.2, u: 'mg', mix: '20 mg / 100 mL', units: ['mg/hr'], sec: '12.36', p: 352},
  {n: 'Insulin', c: 1, u: 'units', mix: '100 units / 100 mL', units: ['units/kg/hr'], sec: '12.40', p: 356},
  {n: 'Ketamine', c: 2, u: 'mg', mix: '500 mg / 250 mL', units: ['mg/kg/hr'], sec: '12.42', p: 358},
  {n: 'Labetalol', c: 2, u: 'mg', mix: '200 mg / 100 mL (remove 40 mL first)', units: ['mg/min'], sec: '12.43', p: 360},
  {n: 'Lidocaine', c: 4, u: 'mg', mix: '1 gram / 250 mL', units: ['mg/min'], sec: '12.46', p: 364},
  {n: 'Magnesium Sulfate (OB)', c: 40, u: 'mg', mix: '10 grams / 250 mL', units: ['grams/hr'], sec: '12.49', p: 367},
  {n: 'Magnesium Sulfate (Resp)', c: 20, u: 'mg', mix: '2 grams / 100 mL', units: ['grams/hr'], sec: '12.49', p: 367},
  {n: 'Midazolam', c: 0.1, u: 'mg', mix: '10 mg / 100 mL', units: ['mg/hr', 'mcg/kg/hr'], sec: '12.54', p: 373},
  {n: 'Nicardipine', c: 0.2, u: 'mg', mix: '50 mg / 250 mL (remove 20 mL first)', units: ['mg/hr'], sec: '12.59', p: 379},
  {n: 'Nitroglycerin', c: 0.2, u: 'mg', mix: '50 mg / 250 mL', units: ['mcg/min'], sec: '12.61', p: 381},
  {n: 'Nitroprusside', c: 0.2, u: 'mg', mix: '50 mg / 250 mL', units: ['mcg/kg/min'], sec: '12.62', p: 383},
  {n: 'Norepinephrine', c: 16, u: 'mcg', mix: '4 mg / 250 mL', units: ['mcg/min', 'mcg/kg/min'], sec: '12.63', p: 384},
  {n: 'Octreotide', c: 2, u: 'mcg', mix: '500 mcg / 250 mL', units: ['mcg/hr'], sec: '12.64', p: 385, warn: 'Concentration corrected to 500 mcg / 250 mL (2 mcg/mL) per LFN crew direction. The guideline prints “500 mg / 250 mL” (p.310 and p.384), which conflicts with its mcg dosing (25–50 mcg/hr).'},
  {n: 'Phenylephrine', c: 0.08, u: 'mg', mix: '20 mg / 250 mL', units: ['mcg/min', 'mcg/kg/min'], sec: '12.68', p: 389},
  {n: 'Propofol', c: 10, u: 'mg', mix: '1000 mg / 100 mL', units: ['mcg/kg/min'], sec: '12.72', p: 393},
  {n: 'Vasopressin', c: 0.2, u: 'units', mix: '20 units / 100 mL', units: ['units/min'], sec: '12.83', p: 405},
];
const ALL_UNITS = ['mcg/kg/min', 'mcg/min', 'mcg/kg/hr', 'mcg/hr', 'mg/kg/hr', 'mg/kg/min', 'mg/hr', 'mg/min', 'grams/hr', 'units/kg/hr', 'units/hr', 'units/min'];
const MASS = {mcg: 1, mg: 1000, grams: 1e6, g: 1e6};
// Parse "mcg/kg/min" -> {amt: 'mcg', perKg: true, perMin: true}
const parseU = u => { const p = u.split('/'); return {amt: p[0], perKg: p.includes('kg'), perMin: p[p.length - 1] === 'min'}; };
// amount of dose unit -> amount of concentration unit (both mass, or both units)
const toConc = (amt, from, to) => {
  if (from === 'units' || to === 'units') return from === to ? amt : NaN;
  return amt * MASS[from] / MASS[to];
};

// ---- Oxygen: LFN Policy 201.03 (Appendix A and B, reviewed 07/2026) ----
// Appendix B tank table: max psi and conversion factor (L per psi).
const TANKS = {
  'D cylinder': {max: 2216, f: 0.16},
  'E cylinder': {max: 2216, f: 0.28},
  'M tank': {max: 2216, f: 1.56},
  'PC-12 Spectrum sled': {max: 2216, f: 1.57},
  'EC-135 (2 tanks)': {max: 1850, f: 1.18, two: true},
  'AW119kx gas': {max: 1800, f: 1.22},
  'Bell 407 gas': {max: 2216, f: 1.56},
  'Other': {},
};
const TANK_NAMES = Object.keys(TANKS);
const RESIDUAL = 200; // psi, Appendix B
const REF_B = {label: 'LFN Policy 201.03 Appendix B: Duration of Oxygen Supply (07/2026)'};
const REF_A = {label: 'LFN Policy 201.03 Appendix A: Conversion Table for In-Flight O2 (07/2026)'};
const REF_P = {label: 'LFN Policy 201.03: Cabin Altitude Guidelines and Oxygen Requirements (07/2026)'};
// Appendix B p.2: Ohio flow meter reading -> actual flow at altitude.
const OHIO = {readings: [2, 4, 6, 8, 10, 12], '2,000 ft': [2.1, 4.2, 6.3, 8.4, 10.5, 12.6], '8,000 ft': [2.6, 5.3, 7.9, 10.6, 13.2, 15.8]};
const OHIO_OPTS = ['Ground', '2,000 ft', '8,000 ft'];
// Returns {flow, how} for an Ohio flow meter reading at the chosen altitude.
const ohio = (reading, alt) => {
  if (alt === 'Ground' || !OHIO[alt]) return {flow: reading, how: ''};
  const R = OHIO.readings, A = OHIO[alt];
  const i = R.indexOf(reading);
  if (i >= 0) return {flow: A[i], how: `Ohio flow meter ${reading} L/min at ${alt} = ${A[i]} L/min actual (Appendix B table)`};
  if (reading > R[0] && reading < R[R.length - 1]){
    let j = 0; while (R[j + 1] < reading) j++;
    const fl = A[j] + (A[j + 1] - A[j]) * (reading - R[j]) / (R[j + 1] - R[j]);
    return {flow: fl, how: `Ohio flow meter ${reading} L/min at ${alt} ≈ ${r(fl, 2)} L/min actual (between table rows ${R[j]} and ${R[j + 1]})`, est: true};
  }
  const k = reading < R[0] ? 0 : R.length - 1, fl = reading * A[k] / R[k];
  return {flow: fl, how: `Ohio flow meter ${reading} L/min at ${alt} ≈ ${r(fl, 2)} L/min actual (outside the table; scaled from the ${R[k]} L/min row, ${A[k]}/${R[k]})`, est: true};
};
const ohioField = {id: 'alt', label: 'Ohio flow meter at', type: 'seg', options: OHIO_OPTS, def: 'Ground'};
const ohioNote = 'Altitude correction applies to flow set on an Ohio flow meter (Appendix B). Appendix B gives only the 2,000 ft and 8,000 ft columns.';
// Usable gas in a tank: (psi - 200) x factor; EC-135 sums two tanks.
const tankGas = (v, work) => {
  const t = TANKS[v.tank] || {};
  const f = v.tank === 'Other' ? num(v.cf) : t.f;
  if (!has(f)) return null;
  const ps = t.two ? [num(v.p), num(v.p2)] : [num(v.p)];
  if (ps.some(p => !isFinite(p) || p < 0) || !ps.some(has)) return null;
  let gas = 0; const warn = [];
  ps.forEach((p, i) => {
    const lab = t.two ? `Tank ${i + 1}: ` : '';
    const use = Math.max(0, p - RESIDUAL), g = use * f; gas += g;
    work.push(`${lab}(${p} psi − ${RESIDUAL} psi residual) × ${f} = ${r(g, 0)} L usable`);
    if (t.max && p > t.max * 1.05) warn.push(`${lab}${p} psi is above this tank’s ${t.max.toLocaleString()} psi maximum in Appendix B. Check the gauge reading.`);
  });
  if (t.two) work.push(`Both tanks: ${r(gas, 0)} L usable`);
  return {gas, f, warn};
};

const O2CALCS = [
{
  id: 'o2cyl', title: 'O2 tank duration', color: 'prot',
  fields: [
    {id: 'tank', label: 'Tank', type: 'pick', options: TANK_NAMES, def: 'D cylinder'},
    {id: 'cf', label: 'Conversion factor', type: 'number', unit: 'L/psi', show: v => v.tank === 'Other'},
    {id: 'p', label: 'Gauge pressure', type: 'number', unit: v => TANKS[v.tank] && TANKS[v.tank].two ? 'psi, tank 1' : 'psi'},
    {id: 'p2', label: 'Gauge pressure', type: 'number', unit: 'psi, tank 2', show: v => !!(TANKS[v.tank] && TANKS[v.tank].two)},
    {id: 'flow', label: 'Flow rate (flow meter reading)', type: 'number', unit: 'L/min'},
    ohioField,
  ],
  compute(v){
    const work = [], fl = num(v.flow);
    if (!has(fl)) return null;
    const t = tankGas(v, work); if (!t) return null;
    const o = ohio(fl, v.alt); if (o.how) work.push(o.how);
    const m = t.gas / o.flow; work.push(`${r(t.gas, 0)} L ÷ ${r(o.flow, 2)} L/min = ${r(m)} min`);
    const out = [{k: 'Duration', v: mins(m), big: true}, {k: 'Usable oxygen (above 200 psi)', v: r(t.gas, 0) + ' L'}];
    if (o.how) out.push({k: 'Actual flow at altitude', v: r(o.flow, 1) + ' L/min'});
    const notes = ['LFN formula (Appendix B): (gauge psi − 200 psi residual) × conversion factor ÷ flow = minutes. Example from the policy: D cylinder, 1,500 psi, 10 L/min = 20 minutes.', 'Factors (Appendix B): D 0.16, E 0.28, M 1.56, PC-12 Spectrum sled 1.57, EC-135 1.18 per tank (2 tanks), AW119kx gas 1.22, Bell 407 gas 1.56.', ohioNote, 'Before transport, use the "O2 for transport" calculator to check supply against the trip plus reserve (Policy 201.03 N).'];
    return {out, work, notes, warn: t.warn.join(' ') + (o.est ? (t.warn.length ? ' ' : '') + 'This flow is not a row in the Appendix B flow meter table, so the altitude correction is estimated.' : '') || undefined, refs: [REF_B]};
  }
},
{
  id: 'lox', title: 'LOX duration', color: 'prot',
  fields: [
    {id: 'q', label: 'LOX gauge reading', type: 'number', unit: 'L liquid'},
    {id: 'flow', label: 'Flow rate (flow meter reading)', type: 'number', unit: 'L/min'},
    ohioField,
  ],
  compute(v){
    const q = num(v.q), fl = num(v.flow);
    if (!has(q) || !has(fl)) return null;
    const gas = q * 860, work = [`${q} L liquid × 860 = ${r(gas, 0)} L gas`];
    const o = ohio(fl, v.alt); if (o.how) work.push(o.how);
    const m = gas / o.flow; work.push(`${r(gas, 0)} L ÷ ${r(o.flow, 2)} L/min = ${r(m)} min`);
    const out = [{k: 'Duration', v: mins(m), big: true}, {k: 'Gas available', v: r(gas, 0) + ' L'}];
    if (o.how) out.push({k: 'Actual flow at altitude', v: r(o.flow, 1) + ' L/min'});
    return {out, work, refs: [REF_B], warn: o.est ? 'This flow is not a row in the Appendix B flow meter table, so the altitude correction is estimated.' : undefined,
      notes: ['LFN formula (Appendix B): LOX liters × 860 = liters of gas; liters of gas ÷ flow = minutes. Appendix B uses no residual for LOX.', 'LOX capacity (Appendix B): PC-12 1–5 L (added to its gas supply), AW119kx, Bell 407 and Bell 429 1–10 L.', ohioNote, 'Liquid systems slowly vent oxygen even when not in use, so real time can be shorter than calculated (general LOX property, not from the policy).']};
  }
},
{
  id: 'o2plan', title: 'O2 for transport', color: 'prot',
  fields: [
    {id: 'veh', label: 'Vehicle', type: 'seg', options: ['Rotor', 'Fixed wing', 'Ambulance'], def: 'Rotor'},
    {id: 'flow', label: 'O2 flow set on flow meters, all patients', type: 'number', unit: 'L/min'},
    {id: 'alt', label: 'Ohio flow meter at', type: 'seg', options: OHIO_OPTS, def: 'Ground'},
    {id: 'vflow', label: 'Ventilator O2 flow, all patients', type: 'number', unit: 'L/min'},
    {id: 't', label: 'Transport time (fixed wing: include ground legs)', type: 'number', unit: 'min'},
    {id: 'res', label: 'Reserve', type: 'seg', options: ['By vehicle', '15 min', '30 min', '60 min'], def: 'By vehicle'},
    {id: 'sup', label: 'Onboard supply', type: 'seg', options: ['LOX', 'Gas', 'LOX + gas'], def: 'LOX'},
    {id: 'q', label: 'LOX gauge reading', type: 'number', unit: 'L liquid', show: v => v.sup !== 'Gas'},
    {id: 'tank', label: 'Gas tank', type: 'pick', options: TANK_NAMES.filter(n => n !== 'D cylinder' && n !== 'E cylinder'), def: 'M tank', show: v => v.sup !== 'LOX'},
    {id: 'cf', label: 'Conversion factor', type: 'number', unit: 'L/psi', show: v => v.sup !== 'LOX' && v.tank === 'Other'},
    {id: 'p', label: 'Gauge pressure', type: 'number', unit: v => TANKS[v.tank] && TANKS[v.tank].two ? 'psi, tank 1' : 'psi', show: v => v.sup !== 'LOX'},
    {id: 'p2', label: 'Gauge pressure', type: 'number', unit: 'psi, tank 2', show: v => v.sup !== 'LOX' && !!(TANKS[v.tank] && TANKS[v.tank].two)},
  ],
  compute(v){
    const fl0 = num(v.flow), vf = num(v.vflow), t = num(v.t);
    const fm = isFinite(fl0) && fl0 > 0 ? fl0 : 0, vent = isFinite(vf) && vf > 0 ? vf : 0;
    if (!(fm + vent > 0) || !has(t)) return null;
    const work = [];
    const om = fm ? ohio(fm, v.alt) : {flow: 0, how: ''}; if (om.how) work.push(om.how);
    const o = {flow: om.flow + vent, est: om.est};
    if (vent) work.push(`Total flow: ${r(om.flow, 2)} + ${vent} ventilator = ${r(o.flow, 2)} L/min`);
    const res = v.res === 'By vehicle' ? (v.veh === 'Rotor' ? 15 : 30) : parseInt(v.res, 10);
    const tt = t + res, need = tt * o.flow;
    work.push(`Reserve: ${res} min${v.res === 'By vehicle' ? ` (${v.veh === 'Rotor' ? 'rotor' : v.veh === 'Ambulance' ? 'ambulance' : 'fixed wing'}, Policy 201.03 N.2)` : ''}`);
    work.push(`(${t} + ${res}) min × ${r(o.flow, 2)} L/min = ${r(need, 0)} L gas needed`);
    let have = 0, warn = [];
    if (v.sup !== 'Gas'){
      const q = num(v.q); if (!isFinite(q) || q < 0) return null;
      have += q * 860; work.push(`LOX: ${q} L × 860 = ${r(q * 860, 0)} L gas`);
    }
    if (v.sup !== 'LOX'){
      const g = tankGas(v, work); if (!g) return null;
      have += g.gas; warn = g.warn;
    }
    if (v.sup === 'LOX + gas') work.push(`Total available: ${r(have, 0)} L gas`);
    const ok = have >= need, spare = (have - need) / o.flow;
    const out = [{k: 'Enough oxygen?', v: ok ? 'Yes' : 'No', big: true}, {k: 'Needed (trip + reserve)', v: `${r(need, 0)} L gas (${r(need / 860, 1)} L LOX)`}, {k: 'Available', v: `${r(have, 0)} L gas`}];
    out.push(ok ? {k: 'Extra beyond reserve', v: mins(spare)} : {k: 'Short by', v: `${r(need - have, 0)} L gas (${r((need - have) / 860, 1)} L LOX)`});
    out.push({k: 'Supply lasts', v: mins(have / o.flow)});
    if (!ok) warn.push('Not enough oxygen for this transport plus reserve. Policy 201.03 N.4: plan resupply before departing with the patient.');
    if (o.est) warn.push('This flow is not a row in the Appendix B flow meter table, so the altitude correction is estimated.');
    return {out, work, warn: warn.join(' ') || undefined, refs: [REF_P, REF_B],
      notes: ['Method (Appendix B): add every patient’s O2 flow, including ventilators; add the reserve to the flight time; multiply by total flow; divide by 860 for liters of LOX.', 'Reserve (Policy 201.03 N.2–3): rotor 15 min; fixed wing and ambulance 30 min; consider 60 min for ground transports over 3 hours in bad weather. The Appendix B worked example adds 30 min.', 'Only aircraft or ambulance oxygen counts. Do not include the portable D cylinder (N.2). Plan for the worst case, e.g. a nasal cannula patient who needs intubation (N.6).', 'Minimum onboard before any patient transport (L–M): rotor with LOX 2.0 L; rotor with gas 1,500 psi; fixed wing with gas 1,800 psi; fixed wing with LOX 3.0 L; ambulance M or H tank 1,000 psi. Each also carries a portable D cylinder of at least 1,000 psi.', 'HFNC (O): D cylinders must be full at the start; they give about 9–19 min for transfers depending on flow.', ohioNote + ' Ventilator flow is added without correction.']};
  }
},
{
  id: 'vento2', title: 'Vent O2 flow (LTV)', color: 'prot',
  fields: [
    {id: 'bias', label: 'Bias flow', type: 'seg', options: ['Adult 10 LPM', 'Peds 5 LPM'], def: 'Adult 10 LPM'},
    {id: 'vm', label: 'Minute ventilation', type: 'seg', options: ['Vt × RR', 'Enter VE'], def: 'Vt × RR'},
    {id: 'vt', label: 'Tidal volume', type: 'number', unit: 'mL', show: v => v.vm !== 'Enter VE'},
    {id: 'rr', label: 'Respiratory rate', type: 'number', unit: '/min', show: v => v.vm !== 'Enter VE'},
    {id: 've', label: 'Minute ventilation (VE)', type: 'number', unit: 'L/min', show: v => v.vm === 'Enter VE'},
    {id: 'fi', label: 'Desired FiO2', type: 'number', unit: '% or 0–1'},
  ],
  compute(v){
    // 8.23 LTV low-pressure O2 charts, PDF p.230 (printed 229). Each VE line runs straight from FiO2 .21 (0 LPM)
    // to the value below at FiO2 1.0. Values read from the chart image (±0.2 LPM).
    const VE = [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    const END = {
      'Adult 10 LPM': [7.7, 8.7, 9.6, 10.6, 12.6, 14.6, 16.6, 18.7, 20.7, 22.6, 24.7, 26.6],
      'Peds 5 LPM': [4.3, 5.4, 6.3, 7.3, 9.4, 11.4, 13.4, 15.4, 17.4, 19.3, 21.5, 23.3],
    };
    const E = END[v.bias]; if (!E) return null;
    const work = [];
    let ve;
    if (v.vm === 'Enter VE') ve = num(v.ve);
    else { const vt = num(v.vt), rr = num(v.rr); if (!has(vt) || !has(rr)) return null; ve = vt * rr / 1000; work.push(`VE = ${vt} mL × ${rr} = ${r(ve, 2)} L/min`); }
    let fi = num(v.fi);
    if (!has(ve) || !has(fi)) return null;
    if (fi > 1) fi = fi / 100;
    if (fi < 0.21 || fi > 1) return {out: [{k: 'Check FiO2', v: '21–100%'}], work};
    if (ve < 1 || ve > 20) return {out: [{k: 'VE outside chart', v: '1–20 L/min'}], work, refs: [{label: '8.23 Mechanical Ventilation: LTV low-pressure O2 charts, p.229', href: '#8.23@230'}]};
    // Chart x-axis: .21 at the left edge, then .30, .40 … 1.0 at equal spacing (8 squares).
    const xf = fi >= 0.3 ? (fi - 0.2) / 0.8 : (fi - 0.21) / 0.09 * 0.125;
    let i = VE.indexOf(ve), e, est = false, hi = null;
    if (i >= 0) e = E[i];
    else { let j = 0; while (VE[j + 1] < ve) j++; e = E[j] + (E[j + 1] - E[j]) * (ve - VE[j]) / (VE[j + 1] - VE[j]); est = true; hi = j + 1; }
    const flow = e * xf;
    work.push(`Chart: ${v.bias.replace(/^\w+ /, 'bias ')}, FiO2 ${r(fi, 2)}`);
    if (est) work.push(`VE ${r(ve, 2)} is between the VE ${VE[hi - 1]} and VE ${VE[hi]} lines: ${r(e, 2)} L/min at FiO2 1.0 (interpolated)`);
    else work.push(`VE ${ve} line reaches ${e} L/min at FiO2 1.0`);
    work.push(`${est ? r(e, 2) : e} × ${r(xf, 3)} (FiO2 ${r(fi, 2)} position on the chart) = ${r(flow, 2)} L/min`);
    const out = [{k: 'Set O2 flow', v: r(flow, 1) + ' L/min', big: true}];
    if (est) out.push({k: `Next higher line (VE ${VE[hi]})`, v: r(E[hi] * xf, 1) + ' L/min'});
    out.push({k: 'Minute ventilation', v: r(ve, 1) + ' L/min'});
    return {out, work, refs: [{label: '8.23 Mechanical Ventilation: LTV low-pressure O2 charts, p.229', href: '#8.23@230'}],
      warn: est ? `VE ${r(ve, 1)} L/min falls between chart lines, so this flow is interpolated. Setting the next higher line’s flow is the safer choice.` : undefined,
      notes: ['From the 8.23 LTV charts (p.229): set bias flow to 10 LPM for adults or 5 LPM for peds, then find where minute ventilation and FiO2 meet. The chart has lines for VE 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18 and 20 L/min.', 'Chart values were read from the printed chart image, so allow about ±0.2 L/min. Check against the chart on p.229 and titrate to SpO2.', 'Use pediatric tubing for patients under 20 kg (8.23).', 'Enter this flow as "Ventilator O2 flow" in the O2 for transport calculator.']};
  }
},
{
  id: 'altfio2', title: 'Altitude O2 conversion', color: 'prot',
  fields: [
    {id: 'alt', label: 'Cabin altitude', type: 'select', options: ['1,000 ft', '2,000 ft', '3,000 ft', '4,000 ft', '5,000 ft', '6,000 ft', '7,000 ft', '8,000 ft', '9,000 ft', '10,000 ft'], def: '8,000 ft'},
    {id: 'want', label: 'Desired O2 % (sea level equivalent)', type: 'select', options: ['21', '25', '30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85', '90', '95', '100'], def: '40'},
  ],
  compute(v){
    // Appendix A, rows = cabin altitude (1,000..10,000 ft), columns = desired SLE 21,25,30..100. null = dark shaded (cannot be obtained).
    const COLS = [21, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    const T = {
      1000: [22, 26, 31, 38, 41, 47, 52, 57, 62, 67, 73, 78, 83, 88, 93, 98, 100],
      2000: [23, 27, 32, 38, 43, 48, 54, 59, 64, 70, 75, 81, 86, 91, 97, 100, null],
      3000: [23, 28, 33, 39, 45, 50, 56, 61, 67, 73, 78, 84, 89, 95, 100, null, null],
      4000: [24, 29, 35, 41, 46, 52, 57, 64, 70, 75, 81, 87, 93, 97, 100, null, null],
      5000: [25, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 100, null, null, null],
      6000: [26, 31, 37, 44, 50, 56, 62, 69, 75, 81, 87, 94, 100, null, null, null, null],
      7000: [27, 32, 39, 45, 52, 58, 65, 71, 78, 84, 91, 97, 100, null, null, null, null],
      8000: [28, 34, 40, 46, 54, 61, 67, 74, 81, 87, 93, 100, null, null, null, null, null],
      9000: [29, 35, 42, 49, 56, 63, 70, 77, 84, 91, 98, 100, null, null, null, null, null],
      10000: [30, 36, 44, 51, 58, 65, 73, 80, 87, 94, 100, null, null, null, null, null, null],
    };
    const alt = parseInt(String(v.alt).replace(/\D/g, ''), 10), want = parseInt(v.want, 10);
    const row = T[alt], ci = COLS.indexOf(want); if (!row || ci < 0) return null;
    const d = row[ci];
    const maxSle = COLS[row.indexOf(100)]; // policy: 100% O2 at 8,000 ft only provides 75% SLE
    const work = [`Appendix A: ${v.alt} row × ${want}% column`];
    if (d === null){
      work.push('Dark shaded box: cannot be obtained at this altitude.');
      return {out: [{k: 'Deliver', v: 'Not obtainable', big: true}, {k: 'Best available', v: `100% O2 ≈ ${maxSle}% SLE at most`}], work, refs: [REF_A],
        warn: `${want}% sea level equivalent cannot be obtained at ${v.alt} cabin altitude (dark shaded in Appendix A). Consider a lower cabin altitude; Policy 201.03 E: tell the pilot of any altitude restriction before departure.`,
        notes: notesA()};
    }
    const light = d === 100 && !(alt === 1000 && want === 100);
    work.push(`Deliver ${d}% O2`);
    const out = [{k: 'Deliver', v: d + '% O2', big: true}];
    const dev = devices(d); out.push(...dev.map(x => ({k: x[0], v: x[1]})));
    return {out, work, refs: [REF_A], notes: notesA(alt === 1000 && want === 35),
      warn: light ? `Light shaded box: this takes 100% O2, the maximum. Anything higher than ${want}% sea level equivalent can’t be obtained at ${v.alt} (Appendix A).` : undefined};
  }
},
];
// Appendix A p.2: oxygen delivery methods (LPM -> O2 % range).
const METHODS = [
  ['Nasal cannula', [[2, 23, 28], [3, 28, 30], [4, 32, 36], [5, 40, 40], [6, 44, 44]]],
  ['Simple mask', [[5, 40, 40], [6, 45, 50], [8, 55, 60]]],
  ['Partial rebreather', [[6, 35, 35], [8, 40, 45], [10, 60, 60], [12, 60, 60], [15, 60, 60]]],
  ['Non-rebreather', [[6, 55, 60], [8, 60, 80], [10, 80, 90], [12, 90, 90], [15, 90, 90]]],
];
const rng = x => x[1] === x[2] ? `${x[1]}%` : `${x[1]}–${x[2]}%`;
function devices(pct){
  return METHODS.map(([name, rows]) => {
    const i = rows.findIndex(x => x[2] >= pct);
    if (i < 0) return [name, `Not enough (max ${rows[rows.length - 1][2]}%)`];
    const x = rows[i];
    if (x[1] > pct && i > 0) return [name, `${rows[i - 1][0]}–${x[0]} L/min (${rng(rows[i - 1])} to ${rng(x)})`];
    return [name, `${x[0]} L/min (${rng(x)})`];
  });
}
function notesA(typo){
  const n = ['LFN method (Appendix A): find the desired sea level equivalent (SLE) % and the cabin altitude; the table gives the % to deliver. Then pick a device and flow from the delivery methods chart (shown above). Policy example: 35% at 7,000 ft → deliver 45%.', 'If the cabin altitude falls between rows, using the higher row is the conservative choice (suggestion, not stated in the policy).', 'Nasal cannula % depends on minute ventilation; simple mask needs more than 5 L/min to clear CO2 (Appendix A).', 'Titrate to SpO2. Policy 201.03 J stresses liberal O2 and in-flight pulse oximetry.'];
  if (typo) n.unshift('The 1,000 ft / 35% box reads 38% in the policy, the same as 2,000 ft. Neighboring values suggest about 36%. Shown as printed.');
  return n;
}

const CALCS = [
...O2CALCS,
{
  id: 'd10', title: 'D10 hypoglycemia', color: 'peds',
  fields: [
    {id: 'who', type: 'seg', options: ['Neonate', 'Pediatric', 'Adult'], def: 'Neonate'},
    {id: 'w', label: 'Weight', type: 'number', unit: '', show: v => v.who !== 'Adult'},
    {id: 'wunit', type: 'seg', options: ['kg', 'lb'], def: 'kg', show: v => v.who !== 'Adult'},
  ],
  compute(v){
    const work = [];
    let ml, crit;
    if (v.who === 'Adult'){ ml = 250; crit = 'BGL < 60 mg/dL'; work.push('Adult: 250 mL D10'); }
    else {
      const w = kg(v); if (!has(w)) return null;
      const per = v.who === 'Neonate' ? 2 : 5; crit = v.who === 'Neonate' ? 'BGL < 40 mg/dL' : 'BGL < 60 mg/dL';
      ml = per * w; work.push(...wWork(v), `${v.who}: ${r(w, 2)} kg × ${per} mL/kg = ${r(ml, 1)} mL D10`);
    }
    const g = ml * 0.1, d50 = ml / 5, ns = ml * 4 / 5;
    work.push(`D10 = 0.1 g/mL, so ${r(ml, 1)} mL = ${r(g, 2)} g dextrose`, `D10 is D50 diluted 1:4 (1 part D50 + 4 parts NS): ${r(ml, 1)} mL = ${r(d50, 1)} mL D50 + ${r(ns, 1)} mL NS`);
    return {out: [{k: 'D10 dose', v: r(ml, 1) + ' mL', big: true}, {k: 'Give if', v: crit}, {k: 'Dextrose', v: r(g, 2) + ' g'}, {k: 'Mix (1:4)', v: `${r(d50, 1)} mL D50 + ${r(ns, 1)} mL NS`}],
      work, refs: [{label: '12.19 Dextrose: dosing and D10 mixing, p.331', href: '#12.19@332'}, {label: '5.01 Altered Mental Status: hypoglycemia, p.90', href: '#5.01@91'}, {label: '5.07 Electrolyte Disturbances: hypoglycemia, p.108', href: '#5.07@109'}],
      notes: ['Repeat BGL q 15 min and repeat dose PRN (5.01).', 'Bag mix per 12.19: waste 50 mL from a 250 mL bag of NS, then add 50 mL of D50.']};
  }
},
{
  id: 'drip', title: 'Drip rate', color: 'meds',
  fields: [
    {id: 'drug', label: 'Drug (LFN standard mix)', type: 'select', options: [...DRUGS.map(d => d.n), 'Other (enter concentration)'], def: 'Norepinephrine'},
    {id: 'camt', label: 'Concentration', type: 'number', unit: 'per mL', show: v => v.drug.startsWith('Other')},
    {id: 'cu', type: 'seg', options: ['mcg', 'mg', 'units'], def: 'mg', show: v => v.drug.startsWith('Other')},
    {id: 'mode', type: 'seg', options: ['Dose → mL/hr', 'mL/hr → dose'], def: 'Dose → mL/hr'},
    {id: 'du', label: 'Dose unit', type: 'select', options: v => { const d = DRUGS.find(x => x.n === v.drug); return d ? d.units : ALL_UNITS; }},
    {id: 'dose', label: 'Dose', type: 'number', unit: v => v.du, show: v => v.mode !== 'mL/hr → dose'},
    {id: 'rate', label: 'Pump rate', type: 'number', unit: 'mL/hr', show: v => v.mode === 'mL/hr → dose'},
    {id: 'w', label: 'Weight', type: 'number', unit: '', show: v => parseU(v.du || '').perKg},
    {id: 'wunit', type: 'seg', options: ['kg', 'lb'], def: 'kg', show: v => parseU(v.du || '').perKg},
  ],
  compute(v){
    const d = DRUGS.find(x => x.n === v.drug);
    const c = d ? d.c : num(v.camt), cu = d ? d.u : v.cu;
    if (!has(c) || !v.du) return null;
    const U = parseU(v.du), w = U.perKg ? kg(v) : 1;
    if (U.perKg && !has(w)) return null;
    const perUnit = toConc(1, U.amt, cu); // 1 dose-unit amount in concentration units
    if (!isFinite(perUnit)) return {out: [{k: 'Error', v: 'Dose unit doesn’t match concentration'}], work: []};
    const t = U.perMin ? 60 : 1;
    const work = [...(U.perKg ? wWork(v) : [])];
    work.push(`Concentration: ${d ? d.mix + ' = ' : ''}${c} ${cu}/mL`);
    let out;
    const factorTxt = `${U.perKg ? ` × ${r(w, 2)} kg` : ''}${U.perMin ? ' × 60 min/hr' : ''}${U.amt !== cu ? ` × ${perUnit} ${cu}/${U.amt}` : ''}`;
    if (v.mode === 'mL/hr → dose'){
      const rate = num(v.rate); if (!(rate >= 0) || v.rate === '') return null;
      const dose = rate * c / (perUnit * w * t);
      work.push(`Dose = rate × concentration ÷ (${[U.perKg && 'weight', U.perMin && '60', U.amt !== cu && 'unit conversion'].filter(Boolean).join(' × ') || '1'})`, `${rate} mL/hr × ${c} ${cu}/mL = ${r(rate * c, 4)} ${cu}/hr`, `= ${r(dose, 3)} ${v.du}`);
      out = [{k: 'Dose', v: `${r(dose, 3)} ${v.du}`, big: true}];
    } else {
      const dose = num(v.dose); if (!(dose >= 0) || v.dose === '') return null;
      const rate = dose * perUnit * w * t / c;
      work.push(`Rate = dose${factorTxt} ÷ concentration`, `${dose} ${v.du}${factorTxt} = ${r(dose * perUnit * w * t, 4)} ${cu}/hr`, `${r(dose * perUnit * w * t, 4)} ÷ ${c} ${cu}/mL = ${r(rate, rate < 1 ? 3 : 2)} mL/hr`);
      out = [{k: 'Pump rate', v: `${r(rate, rate < 1 ? 3 : 1)} mL/hr`, big: true}];
    }
    const refs = [{label: '12.01 Recommended Infusion Mixtures, p.310', href: '#12.01@311'}];
    if (d) refs.push({label: `${d.sec} ${d.n.replace(/ \(.*/, '')} monograph, p.${d.p - 1}`, href: `#${d.sec}@${d.p}`});
    return {out, work, refs, warn: d && d.warn, notes: d ? [`Dose units offered are the ones used in the ${d.n.replace(/ \(.*/, '')} monograph.`] : ['Custom concentration: check it against the bag label.']};
  }
},
{
  id: 'wdose', title: 'Weight-based dose', color: 'meds',
  fields: [
    ...W,
    {id: 'dpk', label: 'Dose per kg', type: 'number', unit: v => (v.du || 'mg') + '/kg'},
    {id: 'du', type: 'seg', options: ['mcg', 'mg', 'g', 'units', 'mEq', 'mL'], def: 'mg'},
    {id: 'max', label: 'Max dose (optional)', type: 'number', unit: v => v.du || 'mg'},
    {id: 'conc', label: 'Concentration (optional)', type: 'number', unit: v => (v.du || 'mg') + '/mL', show: v => v.du !== 'mL'},
  ],
  compute(v){
    const w = kg(v), dpk = num(v.dpk); if (!has(w) || !has(dpk)) return null;
    let dose = dpk * w; const work = [...wWork(v), `${dpk} ${v.du}/kg × ${r(w, 2)} kg = ${r(dose, 3)} ${v.du}`];
    const mx = num(v.max), capped = has(mx) && dose > mx;
    if (capped){ work.push(`Above max ${mx} ${v.du}: use ${mx} ${v.du}`); dose = mx; }
    const out = [{k: 'Dose', v: `${r(dose, 3)} ${v.du}${capped ? ' (max)' : ''}`, big: true}];
    const c = num(v.conc);
    if (has(c) && v.du !== 'mL'){ out.push({k: 'Volume', v: r(dose / c, 2) + ' mL', big: true}); work.push(`${r(dose, 3)} ${v.du} ÷ ${c} ${v.du}/mL = ${r(dose / c, 2)} mL`); }
    return {out, work, notes: ['Enter the dose per kg from the guideline you are following.']};
  }
},
{
  id: 'ibw', title: 'IBW & tidal volume', color: 'prot',
  fields: [
    {id: 'who', type: 'seg', options: ['Male', 'Female', 'Child 1–12 y'], def: 'Male'},
    {id: 'h', label: 'Height', type: 'number', unit: '', show: v => !v.who.startsWith('Child')},
    {id: 'hu', type: 'seg', options: ['in', 'cm'], def: 'in', show: v => !v.who.startsWith('Child')},
    {id: 'age', label: 'Age', type: 'number', unit: 'years', show: v => v.who.startsWith('Child')},
    {id: 'w', label: 'Actual weight (optional)', type: 'number', unit: ''},
    {id: 'wunit', type: 'seg', options: ['kg', 'lb'], def: 'kg'},
  ],
  compute(v){
    const work = [];
    let ibw;
    if (v.who.startsWith('Child')){
      const a = num(v.age); if (!has(a)) return null;
      if (a < 1 || a > 12) return {out: [{k: 'Note', v: 'Formula is for ages 1–12'}], work: []};
      ibw = a <= 5 ? a * 2 + 8 : a * 3 + 7;
      work.push(a <= 5 ? `Age 1–5: (${a} × 2) + 8 = ${r(ibw, 1)} kg` : `Age 6–12: (${a} × 3) + 7 = ${r(ibw, 1)} kg`);
    } else {
      let h = num(v.h); if (!has(h)) return null;
      if (v.hu === 'cm'){ work.push(`${h} cm ÷ 2.54 = ${r(h / 2.54, 1)} in`); h = h / 2.54; }
      const base = v.who === 'Male' ? 50 : 45.5;
      ibw = base + 2.3 * (h - 60);
      work.push(`${v.who}: ${base} + 2.3 × (${r(h, 1)} − 60) = ${r(ibw, 1)} kg`);
    }
    const aw = kg(v);
    let dw = ibw;
    if (has(aw)){ work.push(...wWork(v)); if (aw < ibw){ dw = aw; work.push(`Actual weight ${r(aw, 1)} kg is less than IBW, so use actual weight`); } }
    const out = [{k: 'IBW', v: r(ibw, 1) + ' kg', big: true}];
    if (dw !== ibw) out.push({k: 'Use for Vt', v: r(dw, 1) + ' kg (actual)', big: true});
    for (const m of [4, 6, 8, 10]) out.push({k: `Vt at ${m} mL/kg`, v: r(dw * m, 0) + ' mL'});
    return {out, work, refs: [{label: '8.23 Mechanical Ventilation: IBW formulas, p.227', href: '#8.23@228'}, {label: '8.23 Tidal volume ranges, p.222', href: '#8.23@223'}],
      notes: ['Guideline Vt: 6–8 mL/kg routine adult; 4–8 mL/kg severe hypoxia/ARDS; obstructive start 8 mL/kg (range 4–10).', 'Use actual body weight if it is less than IBW.', 'Pediatric IBW is an estimate.']};
  }
},
{
  id: 'burn', title: 'Burn fluids', color: 'calc',
  fields: [
    ...W,
    {id: 'tbsa', label: 'TBSA (2nd and 3rd degree only)', type: 'number', unit: '%'},
    {id: 'type', type: 'seg', options: ['Age ≥ 14', 'Age < 14', 'Electrical'], def: 'Age ≥ 14'},
    {id: 'hrs', label: 'Hours since burn (optional)', type: 'number', unit: 'hr'},
    {id: 'given', label: 'Fluid already given (optional)', type: 'number', unit: 'mL'},
  ],
  compute(v){
    const w = kg(v), b = num(v.tbsa); if (!has(w) || !has(b)) return null;
    const m = v.type === 'Electrical' ? 4 : v.type === 'Age < 14' ? 3 : 2;
    const tot = m * w * b, half = tot / 2;
    const work = [...wWork(v), `Consensus: ${m} mL × ${r(w, 2)} kg × ${b}% = ${r(tot, 0)} mL over 24 h`, `First half: ${r(half, 0)} mL over the first 8 h post burn`, `Second half: ${r(half, 0)} mL over the next 16 h = ${r(half / 16, 0)} mL/hr`];
    const out = [{k: '24 h total', v: r(tot, 0) + ' mL', big: true}, {k: 'First 8 h', v: `${r(half, 0)} mL (${r(half / 8, 0)} mL/hr from time of burn)`}, {k: 'Hours 8–24', v: `${r(half, 0)} mL at ${r(half / 16, 0)} mL/hr`}];
    const h = num(v.hrs), g = has(num(v.given)) ? num(v.given) : 0;
    if (isFinite(h) && h >= 0 && h < 8){
      const left = Math.max(half - g, 0), rate = left / (8 - h);
      work.push(`Remaining for first 8 h: ${r(half, 0)} − ${r(g, 0)} given = ${r(left, 0)} mL over ${r(8 - h, 1)} h = ${r(rate, 0)} mL/hr`);
      out.splice(1, 0, {k: 'Rate now', v: r(rate, 0) + ' mL/hr', big: true});
    }
    return {out, work, refs: [{label: '7.01 Burns: burn formulas (pearl 9), p.157', href: '#7.01@158'}],
      notes: ['Pre-hospital fluid per 7.01: adult LR at 500 mL/hr; age 6–12: 250 mL/hr; age ≤ 5: 125 mL/hr. For IFTs you may continue the sending facility’s rate.', 'Do not include superficial (first degree) burns in TBSA.', 'Urine output target: adult 0.5 mL/kg/hr; electrical ≥ 100 mL/hr.']};
  }
},
{
  id: 'gcs', title: 'GCS', color: 'calc',
  fields: [
    {id: 'e', label: 'Eyes', type: 'pick', options: ['4 Spontaneous', '3 To voice', '2 To pain', '1 None']},
    {id: 'vb', label: 'Verbal', type: 'pick', options: ['5 Oriented', '4 Confused', '3 Inappropriate words', '2 Sounds', '1 None']},
    {id: 'mo', label: 'Motor', type: 'pick', options: ['6 Obeys', '5 Localizes', '4 Withdraws', '3 Flexion', '2 Extension', '1 None']},
  ],
  compute(v){
    if (!v.e || !v.vb || !v.mo) return null;
    const e = +v.e[0], vb = +v.vb[0], m = +v.mo[0];
    return {out: [{k: 'GCS', v: String(e + vb + m), big: true}], work: [`E${e} + V${vb} + M${m} = ${e + vb + m}`], notes: ['Adult scale.']};
  }
},
{
  id: 'map', title: 'MAP', color: 'calc',
  fields: [{id: 's', label: 'Systolic', type: 'number', unit: 'mmHg'}, {id: 'd', label: 'Diastolic', type: 'number', unit: 'mmHg'}],
  compute(v){
    const s = num(v.s), d = num(v.d); if (!has(s) || !has(d)) return null;
    const m = (s + 2 * d) / 3;
    return {out: [{k: 'MAP', v: r(m, 0) + ' mmHg', big: true}], work: [`(${s} + 2 × ${d}) ÷ 3 = ${r(m, 1)}`]};
  }
},
{
  id: 'si', title: 'Shock index', color: 'calc',
  fields: [{id: 'hr', label: 'Heart rate', type: 'number', unit: '/min'}, {id: 's', label: 'Systolic', type: 'number', unit: 'mmHg'}, {id: 'age', type: 'seg', options: ['Age ≥ 13', 'Age 7–12', 'Age 4–6'], def: 'Age ≥ 13'}],
  compute(v){
    const hr = num(v.hr), s = num(v.s); if (!has(hr) || !has(s)) return null;
    const si = hr / s, cut = v.age === 'Age 4–6' ? 1.22 : v.age === 'Age 7–12' ? 1.0 : 0.9;
    const pos = si > cut;
    return {out: [{k: 'Shock index', v: r(si, 2), big: true}, {k: `Positive (> ${cut})`, v: pos ? 'Yes' : 'No'}], work: [`${hr} ÷ ${s} = ${r(si, 3)}`],
      refs: [{label: '8.30 RSI: positive shock index by age, p.243', href: '#8.30@244'}, {label: '8.29 Push Dose Vasopressors: SI ≥ 0.8, p.241', href: '#8.29@242'}],
      notes: ['SI ≥ 0.8 is highly sensitive for occult shock (8.29).']};
  }
},
{
  id: 'pf', title: 'P/F ratio', color: 'calc',
  fields: [{id: 'pa', label: 'PaO2', type: 'number', unit: 'mmHg'}, {id: 'fi', label: 'FiO2', type: 'number', unit: '% or 0–1'}],
  compute(v){
    const pa = num(v.pa); let fi = num(v.fi); if (!has(pa) || !has(fi)) return null;
    const work = [];
    if (fi > 1){ work.push(`FiO2 ${fi}% = ${fi / 100}`); fi = fi / 100; }
    if (fi < 0.21 || fi > 1) return {out: [{k: 'Check FiO2', v: '0.21–1.0'}], work};
    const pf = pa / fi; work.push(`${pa} ÷ ${fi} = ${r(pf, 0)}`);
    const cat = pf <= 100 ? 'Severe (≤ 100)' : pf <= 200 ? 'Moderate (≤ 200)' : pf <= 300 ? 'Mild (≤ 300)' : 'Not in ARDS range';
    return {out: [{k: 'P/F ratio', v: r(pf, 0), big: true}, {k: 'Berlin ARDS category', v: cat}], work, notes: ['Berlin categories assume PEEP ≥ 5; they are not from the guidelines.']};
  }
},
];

window.LFN_CALCS = {CALCS, DRUGS, num, r, parseU, toConc, kg};
})();
