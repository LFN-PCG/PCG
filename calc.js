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
  {n: 'Octreotide', c: 2, u: 'mcg', mix: '500 mcg / 250 mL', units: ['mcg/hr'], sec: '12.64', p: 385, warn: 'Concentration corrected to 500 mcg / 250 mL (2 mcg/mL) at the crew’s direction. The guideline prints “500 mg / 250 mL” (p.310 and p.384), which conflicts with its mcg dosing (25–50 mcg/hr).'},
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

const CALCS = [
{
  id: 'o2tank', title: 'O2 tank duration', color: 'prot',
  fields: [
    {id: 'p1', label: 'Tank 1 pressure', type: 'number', unit: 'psi'},
    {id: 'p2', label: 'Tank 2 pressure (optional)', type: 'number', unit: 'psi'},
    {id: 'flow', label: 'Flow rate', type: 'number', unit: 'L/min'},
    {id: 'f', label: 'Tank factor', type: 'number', unit: '', def: '0.16'},
  ],
  compute(v){
    const p1 = num(v.p1), p2 = num(v.p2), fl = num(v.flow), f = num(v.f);
    if (!has(p1) || !has(fl) || !has(f)) return null;
    const t = p => (p - 200) * f / fl;
    const t1 = t(p1), two = has(p2), t2 = two ? t(p2) : 0;
    const work = [`Tank 1: (${p1} − 200) × ${f} ÷ ${fl} = ${r(t1)} min`];
    if (two) work.push(p1 === p2 ? `Same PSI in both tanks: ${r(t1)} × 2 = ${r(t1 * 2)} min` : `Tank 2: (${p2} − 200) × ${f} ÷ ${fl} = ${r(t2)} min`, ...(p1 === p2 ? [] : [`Total: ${r(t1)} + ${r(t2)} = ${r(t1 + t2)} min`]));
    const out = [{k: two ? 'Total time' : 'Time', v: mins(t1 + t2), big: true}];
    if (two && p1 !== p2) out.push({k: 'Tank 1', v: mins(t1)}, {k: 'Tank 2', v: mins(t2)});
    return {out, work, notes: ['Crew notes formula: (Tank psi − 200) × .16 ÷ flow rate = time in minutes. Multiply × 2 if PSI is the same for both tanks, otherwise calculate each tank and add.', '200 psi is held back as the safe residual.']};
  }
},
{
  id: 'vento2', title: 'Vent O2 use', color: 'prot',
  fields: [
    ...W,
    {id: 'rr', label: 'Max respiratory rate', type: 'number', unit: '/min'},
    {id: 'fio2', label: 'FiO2', type: 'number', unit: '% or 0–1', def: '100'},
    {id: 'bt', label: 'Bias flow', type: 'seg', options: ['Adult 10', 'Peds 5', 'Other'], def: 'Adult 10'},
    {id: 'bias', label: 'Bias flow', type: 'number', unit: 'L/min', show: v => v.bt === 'Other'},
    {id: 'p1', label: 'Tank pressure (optional, for duration)', type: 'number', unit: 'psi'},
    {id: 'f', label: 'Tank factor', type: 'number', unit: '', def: '0.16'},
  ],
  compute(v){
    const w = kg(v), rr = num(v.rr);
    const bias = v.bt === 'Adult 10' ? 10 : v.bt === 'Peds 5' ? 5 : num(v.bias);
    let fi = num(v.fio2);
    if (!has(w) || !has(rr) || !isFinite(bias) || !has(fi)) return null;
    const work = [...wWork(v)];
    if (fi > 1){ work.push(`FiO2 ${fi}% = ${r(fi / 100, 2)}`); fi = fi / 100; }
    if (fi < 0.21 || fi > 1) return {out: [{k: 'Check FiO2', v: '21–100%'}], work};
    const vt = 10 * w, rate = rr + 5, mv = vt * rate / 1000, tot = mv + bias, frac = (fi - 0.21) / 0.79, o2 = tot * frac;
    work.push(`1. Tidal volume: ${r(w, 1)} kg × 10 mL/kg = ${r(vt, 0)} mL`, `2. Rate: max RR ${rr} + 5 = ${rate} /min`, `Minute volume: ${r(vt, 0)} mL × ${rate} = ${r(mv, 2)} L/min`, `3. Plus bias flow: ${r(mv, 2)} + ${bias} = ${r(tot, 2)} L/min total gas`, `O2 share of total gas at FiO2 ${r(fi, 2)}: (${r(fi, 2)} − 0.21) ÷ 0.79 = ${r(frac, 3)}`, `O2 from tank: ${r(tot, 2)} × ${r(frac, 3)} = ${r(o2, 2)} L/min`);
    const out = [{k: 'O2 from tank', v: r(o2, 1) + ' L/min', big: true}, {k: 'Total gas (MV + bias)', v: r(tot, 1) + ' L/min'}, {k: 'Tidal volume', v: r(vt, 0) + ' mL'}, {k: 'Minute volume', v: r(mv, 2) + ' L/min'}];
    const p = num(v.p1), f = num(v.f);
    if (has(p) && has(f) && o2 > 0){ const t = (p - 200) * f / o2; out.push({k: 'Tank duration', v: mins(t)}); work.push(`Duration: (${p} − 200) × ${f} ÷ ${r(o2, 2)} = ${r(t)} min`); }
    return {out, work, refs: [{label: '8.23 Mechanical Ventilation: low pressure O2 bias flow, p.229', href: '#8.23@230'}],
      notes: ['From crew notes: 1) tidal volume at 10 mL/kg, 2) use the max RR plus 5 for margin of error, 3) don’t forget bias flow, 4) Intubated it >60% or nopal >20/10 (as written in the notes).', 'Bias flow defaults are from 8.23 (low pressure oxygen): 10 LPM adults, 5 LPM pediatrics. 8.23 sets the actual O2 flow from the chart for that bias flow, minute ventilation and FiO2; use the chart when it applies.', 'FiO2 adjustment assumes the rest of the gas is room air (21% O2). At FiO2 100% all gas comes from the tank.']};
  }
},
{
  id: 'd10', title: 'D10 neonate', color: 'peds',
  fields: [...W],
  compute(v){
    const w = kg(v); if (!has(w)) return null;
    const ml = 2 * w, g = ml * 0.1, syr = Math.ceil(ml / 20);
    return {out: [{k: 'D10 dose', v: r(ml, 1) + ' mL', big: true}, {k: 'Dextrose', v: r(g, 2) + ' g'}, {k: '20 mL syringes to mix', v: String(syr)}],
      work: [...wWork(v), `${r(w, 2)} kg × 2 mL/kg = ${r(ml, 1)} mL D10`, `D10 = 0.1 g/mL, so ${r(ml, 1)} mL = ${r(g, 2)} g dextrose`, `Mix: 4 mL D50 + 16 mL NS = 20 mL D10 (20 mL syringe)`],
      notes: ['From crew notes: mix 4 mL D50 + 16 mL NS in a 20 mL syringe; give 2 mL/kg for a neonate.']};
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
