/* Patient Tracker: one-tap timeline of events, meds, procedures, vitals and brief history.
   Self-contained module. Stores data only in this browser's localStorage. No network calls
   except reading the app's own data.json for the formulary list. No free-text fields. */
(() => {
'use strict';
const KEY = 'tk_patient', PREF = 'tk_prefs';
const ls = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad = n => String(n).padStart(2, '0');
const hm = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const dur = ms => { const m = Math.max(0, Math.floor(ms / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + pad(m % 60); };
const ago = t => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm ago'; };
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
const fmtN = n => String(Math.round(n * 1000) / 1000);

// ---------- config ----------
const EVENTS = [
  {g: 'Transport', items: ['Dispatched', 'En route', 'Pt contact', 'Depart', 'Lift off', 'Landed', 'Arrive destination', 'Handoff complete']},
  {g: 'Resuscitation', items: ['Arrest / CPR start', 'Pulse check', 'Shock delivered', 'ROSC', 'Re-arrest', 'CPR stopped']},
  {g: 'Notifications', items: ['Report called', 'Med control contacted', 'STEMI alert', 'Stroke alert', 'Trauma alert']},
];
const SIDE = {k: 'Side', pick: ['L', 'R', 'Bilat']};
const TX = [
  {g: 'Airway', items: [
    {n: 'Intubation (ETT)', f: [{k: 'Size', u: 'mm'}, {k: 'Depth', u: 'cm'}, {k: 'Attempts'}]},
    {n: 'Supraglottic airway', f: [{k: 'Size'}]},
    {n: 'Cricothyrotomy'}, {n: 'BVM'},
    {n: 'NIPPV / BiPAP', f: [{k: 'IPAP'}, {k: 'EPAP'}, {k: 'FiO2', u: '%'}]},
    {n: 'High-flow nasal cannula', f: [{k: 'Flow', u: 'L/min'}, {k: 'FiO2', u: '%'}]},
    {n: 'Oxygen', f: [{k: 'Flow', u: 'L/min'}, {k: 'Device', pick: ['NC', 'NRB', 'Mask', 'Blow-by']}]},
    {n: 'OG / NG tube'}, {n: 'Suction'},
  ]},
  {g: 'Chest', items: [
    {n: 'Needle decompression', f: [SIDE]}, {n: 'Finger thoracostomy', f: [SIDE]}, {n: 'Chest tube', f: [SIDE]},
  ]},
  {g: 'Access & monitoring', items: [
    {n: 'IV access', f: [{k: 'Gauge', u: 'g'}]}, {n: 'IO access'}, {n: 'Arterial line'}, {n: 'Central line'},
    {n: '12-lead ECG'}, {n: 'Foley'},
  ]},
  {g: 'Circulation', items: [
    {n: 'Defibrillation', f: [{k: 'Energy', u: 'J'}]}, {n: 'Synchronized cardioversion', f: [{k: 'Energy', u: 'J'}]},
    {n: 'Transcutaneous pacing', f: [{k: 'Rate', u: 'bpm'}, {k: 'Output', u: 'mA'}]}, {n: 'Mechanical CPR'},
    {n: 'Fluid bolus', f: [{k: 'Fluid', pick: ['NS', 'LR']}, {k: 'Volume', u: 'mL'}]},
    {n: 'PRBC', f: [{k: 'Units'}]}, {n: 'Plasma', f: [{k: 'Units'}]}, {n: 'Whole blood', f: [{k: 'Units'}]},
    {n: 'Platelets', f: [{k: 'Units'}]}, {n: 'IABP / Impella'},
  ]},
  {g: 'Trauma & other', items: [
    {n: 'Tourniquet', f: [{k: 'Limb', pick: ['RUE', 'LUE', 'RLE', 'LLE']}]}, {n: 'Pelvic binder'}, {n: 'Hemostatic packing'},
    {n: 'Spinal motion restriction'}, {n: 'Splint'}, {n: 'Active warming'}, {n: 'Active cooling'}, {n: 'Restraints'},
  ]},
];
// Monitoring forms (besides Vitals). Number fields: {k, l, u}; pick fields: {k, l, pick}.
const MON = [
  {g: 'vent', t: 'Ventilator', f: [
    {k: 'mode', l: 'Mode', pick: ['AC/VC', 'AC/PC', 'PRVC', 'SIMV', 'CPAP/PS', 'BiPAP']},
    {k: 'vt', l: 'Vt', u: 'mL'}, {k: 'rr', l: 'Set RR'}, {k: 'rrt', l: 'Total RR'}, {k: 'peep', l: 'PEEP'},
    {k: 'fio2', l: 'FiO2', u: '%'}, {k: 'pip', l: 'PIP'}, {k: 'pplat', l: 'Pplat'}, {k: 'ps', l: 'PS'},
    {k: 'pinsp', l: 'Pinsp'}, {k: 'ti', l: 'Ti', u: 's'}, {k: 'ie', l: 'I:E', pick: ['1:2', '1:3', '1:4', '1:5']},
  ]},
  {g: 'neuro', t: 'Neuro check', f: [
    {k: 'e', l: 'GCS eye', pick: ['1', '2', '3', '4']}, {k: 'v', l: 'GCS verbal', pick: ['1', '2', '3', '4', '5', 'T']},
    {k: 'm', l: 'GCS motor', pick: ['1', '2', '3', '4', '5', '6']},
    {k: 'avpu', l: 'AVPU', pick: ['A', 'V', 'P', 'U']}, {k: 'rass', l: 'RASS', pick: ['+4', '+3', '+2', '+1', '0', '−1', '−2', '−3', '−4', '−5']},
    {k: 'pl', l: 'L pupil', u: 'mm'}, {k: 'pr', l: 'R pupil', u: 'mm'},
    {k: 'plr', l: 'L reacts', pick: ['Brisk', 'Sluggish', 'Fixed']}, {k: 'prr', l: 'R reacts', pick: ['Brisk', 'Sluggish', 'Fixed']},
    {k: 'motor', l: 'Motor', pick: ['MAE equal', 'L weakness', 'R weakness', 'Lower ext weakness', 'No movement']},
    {k: 'sens', l: 'Sensation', pick: ['Intact', 'Decreased', 'Absent']},
  ]},
  {g: 'fhr', t: 'Fetal heart rate', f: [
    {k: 'fhr', l: 'FHR', u: 'bpm'}, {k: 'meth', l: 'Method', pick: ['Doppler', 'EFM']},
    {k: 'var', l: 'Variability', pick: ['Absent', 'Minimal', 'Moderate', 'Marked']},
    {k: 'acc', l: 'Accels', pick: ['Present', 'Absent']}, {k: 'dec', l: 'Decels', pick: ['None', 'Early', 'Variable', 'Late', 'Prolonged']},
    {k: 'cfq', l: 'Contractions every', u: 'min'}, {k: 'cdur', l: 'Contraction length', u: 's'},
  ]},
];
const RHYTHMS = ['Sinus', 'Sinus tach', 'Sinus brady', 'AFib', 'Aflutter', 'SVT', 'VT', 'VF', 'PEA', 'Asystole', 'Paced', 'Junctional', 'Heart block'];
const VITALS = [
  {k: 'hr', l: 'HR'}, {k: 'sbp', l: 'SBP'}, {k: 'dbp', l: 'DBP'}, {k: 'rr', l: 'RR'},
  {k: 'spo2', l: 'SpO2 %'}, {k: 'etco2', l: 'EtCO2'}, {k: 'temp', l: 'Temp °C'}, {k: 'gcs', l: 'GCS'},
  {k: 'bgl', l: 'BGL'}, {k: 'pain', l: 'Pain 0–10'},
];
const HX = {
  imp: {l: 'Impression', multi: true, o: ['Trauma', 'Cardiac arrest', 'STEMI / ACS', 'Stroke', 'ICH', 'Sepsis / shock', 'Resp failure', 'GI bleed', 'OB', 'Overdose / tox', 'Seizure', 'DKA', 'Burns', 'Neonatal', 'Agitation / psych', 'Other']},
  mech: {l: 'Mechanism (trauma)', multi: true, o: ['MVC', 'Motorcycle', 'Pedestrian', 'Fall', 'GSW', 'Stab', 'Assault', 'Crush', 'Burn', 'Other']},
  pmh: {l: 'PMH', multi: true, o: ['None', 'HTN', 'DM', 'CAD / MI', 'CHF', 'AFib', 'CVA', 'COPD', 'Asthma', 'CKD', 'Dialysis', 'Liver disease', 'Cancer', 'Seizures', 'Psych', 'ETOH / substance', 'Pregnant', 'Anticoagulated', 'Immunocompromised']},
  alg: {l: 'Allergies', multi: true, o: ['NKDA', 'Penicillin', 'Cephalosporins', 'Sulfa', 'Opioids', 'NSAIDs', 'Latex', 'Contrast', 'Egg / soy']},
  code: {l: 'Code status', multi: false, o: ['Full code', 'DNR', 'DNI', 'POLST limited']},
  sex: {l: 'Sex', multi: false, o: ['M', 'F', 'X']},
};
const PUSH_U = ['mg', 'mcg', 'g', 'units', 'mEq', 'mL'];
const RATE_U = ['mcg/min', 'mcg/kg/min', 'mg/min', 'mg/hr', 'mcg/kg/hr', 'mg/kg/hr', 'units/hr', 'units/min', 'mL/hr'];
const ROUTES = ['IV', 'IO', 'IM', 'IN', 'PO', 'SL', 'Neb', 'SQ', 'ETT', 'PR'];
const ACTS = {push: 'Push / bolus', start: 'Start drip', rate: 'Rate change', stop: 'Stop drip'};
// default [push unit, route, drip unit]
const DEF = {
  Fentanyl: ['mcg'], Ketamine: ['mg', 'IV', 'mg/kg/hr'], Midazolam: ['mg', 'IV', 'mg/hr'], Rocuronium: ['mg'], Succinylcholine: ['mg'],
  Etomidate: ['mg'], Propofol: ['mg', 'IV', 'mcg/kg/min'], Epinephrine: ['mg', 'IV', 'mcg/min'], Norepinephrine: ['mcg', 'IV', 'mcg/min'],
  Phenylephrine: ['mcg', 'IV', 'mcg/min'], Vasopressin: ['units', 'IV', 'units/min'], Dexmedetomidine: ['mcg', 'IV', 'mcg/kg/hr'],
  Insulin: ['units', 'IV', 'units/hr'], Heparin: ['units', 'IV', 'units/hr'], Nicardipine: ['mg', 'IV', 'mg/hr'], Clevidipine: ['mg', 'IV', 'mg/hr'],
  Esmolol: ['mg', 'IV', 'mcg/kg/min'], Dobutamine: ['mcg', 'IV', 'mcg/kg/min'], Dopamine: ['mcg', 'IV', 'mcg/kg/min'], Milrinone: ['mcg', 'IV', 'mcg/kg/min'],
  Nitroglycerin: ['mg', 'SL', 'mcg/min'], Nitroprusside: ['mcg', 'IV', 'mcg/kg/min'], Amiodarone: ['mg', 'IV', 'mg/min'], Diltiazem: ['mg', 'IV', 'mg/hr'],
  Labetalol: ['mg', 'IV', 'mg/min'], Octreotide: ['mcg', 'IV', 'mcg/hr'], Cisatracurium: ['mg', 'IV', 'mcg/kg/min'], Vecuronium: ['mg', 'IV', 'mcg/kg/min'],
  'Magnesium Sulfate': ['g'], 'Calcium Chloride': ['g'], 'Calcium Gluconate': ['g'], 'Tranexamic Acid (TXA)': ['g'], Cefazolin: ['g'],
  Hydroxocobalamin: ['g'], Mannitol: ['g'], Dextrose: ['g'], 'Sodium Bicarbonate': ['mEq'], 'Potassium Chloride': ['mEq', 'IV', 'mL/hr'],
  'Lactated Ringers': ['mL', 'IV', 'mL/hr'], 'Sodium Chloride': ['mL', 'IV', 'mL/hr'], 'Hypertonic Saline 3%': ['mL', 'IV', 'mL/hr'], 'Lipid Emulsion 2%': ['mL'],
  Albuterol: ['mg', 'Neb'], 'Ipratropium Bromide': ['mg', 'Neb'], 'Racemic Epinephrine': ['mL', 'Neb'], Naloxone: ['mg', 'IN'], Aspirin: ['mg', 'PO'],
  Ticagrelor: ['mg', 'PO'], Oxytocin: ['units', 'IV', 'units/hr'], Terbutaline: ['mg', 'SQ'], Methylergonovine: ['mg', 'IM'], Glucagon: ['mg'],
  'Activated Charcoal': ['g', 'PO'], 'Epoprostenol (inhaled)': ['mcg', 'Neb', 'mL/hr'],
};
const FREQ = ['Fentanyl', 'Ketamine', 'Midazolam', 'Rocuronium', 'Succinylcholine', 'Etomidate', 'Propofol', 'Epinephrine', 'Norepinephrine', 'Phenylephrine', 'Amiodarone', 'Ondansetron', 'Tranexamic Acid (TXA)', 'Calcium Chloride', 'Sodium Bicarbonate', 'Dextrose', 'Naloxone', 'Hydromorphone'];
let MEDS = ['Acetaminophen', 'Activated Charcoal', 'Adenosine', 'Albuterol', 'Alteplase (tPA)', 'Amiodarone', 'Aspirin', 'Atropine', 'Betamethasone', 'Calcium Chloride', 'Calcium Gluconate', 'Cefazolin', 'Cisatracurium', 'Clevidipine', 'CroFab', 'Dexamethasone', 'Dexmedetomidine', 'Dextrose', 'Diazepam', 'Diltiazem', 'Diphenhydramine', 'Dobutamine', 'Dopamine', 'Droperidol', 'Epinephrine', 'Epoprostenol (inhaled)', 'Esmolol', 'Etomidate', 'Fentanyl', 'Flumazenil', 'Fosphenytoin', 'Furosemide', 'Glucagon', 'Heparin', 'Hydralazine', 'Hydromorphone', 'Hydroxocobalamin', 'Hypertonic Saline 3%', 'Insulin', 'Ipratropium Bromide', 'Ketamine', 'Labetalol', 'Lactated Ringers', 'Levetiracetam', 'Lidocaine', 'Lipid Emulsion 2%', 'Lorazepam', 'Magnesium Sulfate', 'Mannitol', 'Methylergonovine', 'Methylprednisolone', 'Metoprolol', 'Midazolam', 'Milrinone', 'Morphine Sulfate', 'N-acetylcysteine', 'Naloxone', 'Nicardipine', 'Nifedipine', 'Nitroglycerin', 'Nitroprusside', 'Norepinephrine', 'Octreotide', 'Ondansetron', 'Oxytocin', 'Phenobarbital', 'Phenylephrine', 'Potassium Chloride', 'Pralidoxime', 'Promethazine', 'Propofol', 'Racemic Epinephrine', 'Rocuronium', 'Sodium Bicarbonate', 'Sodium Chloride', 'Sodium Polystyrene Sulfonate', 'Succinylcholine', 'Tenecteplase', 'Terbutaline', 'Ticagrelor', 'Tranexamic Acid (TXA)', 'Vasopressin', 'Vecuronium'];
// Keep the pick list in step with the loaded guidelines' formulary chapter.
fetch('data.json').then(r => r.ok ? r.json() : null).then(d => {
  if (!d || !d.sections) return;
  const list = d.sections.filter(s => (s.chapter || '').startsWith('Formulary') && !/infusion mixtures/i.test(s.title)).map(s => s.title);
  if (list.length > 20) MEDS = [...new Set(list)];
}).catch(() => {});

// ---------- state ----------
const blank = () => ({v: 1, entries: [], hx: {}, last: 0});
let P = (() => { const p = ls.get(KEY, null); return p && Array.isArray(p.entries) ? p : blank(); })();
let prefs = Object.assign({ttl: 12, med: {}, fold: {}}, ls.get(PREF, {}));
if (!prefs.fold) prefs.fold = {};
// Which dropdowns start open (until the user changes them).
const FOLD_DEF = {'mon:vitals': true, ev: true, 'ev:Transport': true, 'ev:Resuscitation': true, 'med:drips': true, 'med:given': true};
const isOpen = k => k in prefs.fold ? prefs.fold[k] : !!FOLD_DEF[k];
let tab = 'log', lastRemoved = null, medQ = '', sheet = null, open = false, snackT = 0, clockT = 0;
const hasData = () => P.entries.length > 0 || Object.keys(P.hx).some(k => { const v = P.hx[k]; return Array.isArray(v) ? v.length : v !== '' && v != null; });
function save(){ P.last = Date.now(); ls.set(KEY, P); updateTile(); }
function savePrefs(){ ls.set(PREF, prefs); }
function clearPatient(){ P = blank(); ls.del(KEY); updateTile(); }
function expire(){
  if (!prefs.ttl || !P.last || !hasData()) return false;
  if (Date.now() - P.last > prefs.ttl * 3600e3){ clearPatient(); return true; }
  return false;
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function addEntry(e){
  e.id = uid(); e.c = Date.now(); if (!e.t) e.t = e.c;
  P.entries.push(e); P.entries.sort((a, b) => a.t - b.t); save();
  snack(`${label(e)} · ${hm(e.t)}`, e.id);
  render();
}
// "HH:MM" -> timestamp on the day nearest to ref (handles midnight crossings).
function fromHM(v, ref){
  const m = /^(\d{1,2}):(\d{2})/.exec(v || ''); if (!m) return ref;
  const d = new Date(ref); d.setHours(+m[1], +m[2], 0, 0);
  let t = d.getTime();
  if (t - ref > 12 * 3600e3) t -= 864e5; else if (ref - t > 12 * 3600e3) t += 864e5;
  return t;
}

// ---------- labels ----------
function medLabel(e){
  const d = e.dose != null ? `${fmtN(e.dose)} ${e.unit}` : '';
  if (e.act === 'start') return `${e.n} drip started${d ? ' ' + d : ''}${e.route && e.route !== 'IV' ? ' ' + e.route : ''}`;
  if (e.act === 'rate') return `${e.n} rate → ${d}`;
  if (e.act === 'stop') return `${e.n} drip stopped`;
  return `${e.n}${d ? ' ' + d : ''}${e.route ? ' ' + e.route : ''}${e.pk ? ` (${e.pk}, ${e.ind})` : ''}`;
}
function vitalsLabel(e){
  const v = e.v, p = [];
  if (v.hr != null) p.push('HR ' + v.hr);
  if (v.sbp != null) p.push('BP ' + v.sbp + (v.dbp != null ? '/' + v.dbp + ` (MAP ${Math.round((v.sbp + 2 * v.dbp) / 3)})` : ''));
  if (v.rr != null) p.push('RR ' + v.rr);
  if (v.spo2 != null) p.push('SpO2 ' + v.spo2 + '%');
  if (v.etco2 != null) p.push('EtCO2 ' + v.etco2);
  if (v.temp != null) p.push('T ' + v.temp + '°C');
  if (v.gcs != null) p.push('GCS ' + v.gcs);
  if (v.bgl != null) p.push('BGL ' + v.bgl);
  if (v.pain != null) p.push('Pain ' + v.pain + '/10');
  if (v.rhythm) p.push(v.rhythm);
  return 'Vitals: ' + (p.join(' · ') || '—');
}
function monLabel(e){
  const c = MON.find(x => x.g === e.g); if (!c) return '';
  const v = e.v, p = [];
  if (e.g === 'neuro' && v.e && v.v && v.m){
    const tot = +v.e + (v.v === 'T' ? 0 : +v.v) + +v.m;
    p.push(`GCS ${tot}${v.v === 'T' ? 'T' : ''} (E${v.e} V${v.v} M${v.m})`);
  }
  for (const f of c.f){
    if (v[f.k] == null || v[f.k] === '') continue;
    if (e.g === 'neuro' && ['e', 'v', 'm'].includes(f.k) && v.e && v.v && v.m) continue;
    p.push(f.pick && ['mode', 'motor', 'meth'].includes(f.k) ? v[f.k] : `${f.l} ${v[f.k]}${f.u ? (f.u === '%' ? '%' : ' ' + f.u) : ''}`);
  }
  return c.t + ': ' + (p.join(' · ') || '—');
}
function label(e){
  if (e.k === 'mon') return monLabel(e);
  if (e.k === 'med') return medLabel(e);
  if (e.k === 'vitals') return vitalsLabel(e);
  if (e.k === 'tx') return e.n + (e.d && e.d.length ? ' — ' + e.d.join(', ') : '');
  return e.n;
}
function hxLine(){
  const h = P.hx, parts = [];
  if (h.age != null && h.age !== '') parts.push(h.age === '90+' ? '90+ y' : h.age + ' ' + (h.ageU || 'y'));
  if (h.sex) parts.push(h.sex);
  if (h.wt) parts.push(h.wt + ' kg');
  const lines = [];
  if (parts.length) lines.push(['Pt', parts.join(' · ')]);
  for (const k of ['imp', 'mech', 'pmh', 'alg']) if (h[k] && h[k].length) lines.push([HX[k].l, h[k].join(', ')]);
  if (h.code) lines.push([HX.code.l, h.code]);
  return lines;
}
function drips(){
  const m = new Map();
  for (const e of P.entries) if (e.k === 'med' && e.act && e.act !== 'push'){
    if (e.act === 'stop') m.delete(e.n); else m.set(e.n, e);
  }
  return [...m.values()];
}
function totals(){
  const m = new Map();
  for (const e of P.entries) if (e.k === 'med' && (!e.act || e.act === 'push') && e.dose != null){
    const key = e.n + '|' + e.unit;
    const o = m.get(key) || {n: e.n, unit: e.unit, sum: 0, c: 0, last: 0};
    o.sum += e.dose; o.c++; o.last = e.t; m.set(key, o);
  }
  return [...m.values()];
}

// ---------- DOM ----------
const css = `
:root{--c-trk:#69db7c} :root[data-theme="light"]{--c-trk:#2f9e44}
.tile[data-tk] .ic{background:var(--c-trk)}
.tile[data-tk] .tk-tl{display:flex;flex-direction:column}
.tk-tsub{display:block;font-size:13px;font-weight:600;color:var(--c-trk);margin-top:2px}
#tk{z-index:30}
#tk .tk-clock{font-weight:700;font-size:18px;font-variant-numeric:tabular-nums;padding:0 6px}
.tk-tabs{flex:none;display:flex;gap:6px;overflow-x:auto;padding:8px 10px;background:var(--bg);border-bottom:1px solid var(--line);scrollbar-width:none}
.tk-tabs::-webkit-scrollbar{display:none}
.tk-tabs button{flex:none;min-height:42px;padding:0 14px;border-radius:999px;background:var(--surface);font-weight:700;font-size:15px;white-space:nowrap}
.tk-tabs button.on{background:var(--c-trk);color:var(--c-ink)}
.tk-tabs .n{font-size:12px;opacity:.8;margin-left:4px}
.tk-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tk-ev{background:var(--surface);border-radius:14px;padding:12px;min-height:58px;text-align:left;font-weight:700;font-size:16px;line-height:1.2;display:flex;flex-direction:column;justify-content:space-between;gap:4px}
.tk-ev:active{background:var(--chip)}
.tk-ev small{font-size:13px;font-weight:600;color:var(--c-trk);font-variant-numeric:tabular-nums}
.tk-ev small:empty{display:none}
.tk-fold{border-top:1px solid var(--line)}
.tk-fold:first-child{border-top:0}
.tk-fold-h{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:14px 2px;min-height:58px;font-weight:700;font-size:19px}
.tk-fold-h .tt{flex:1;min-width:0}
.tk-fold-h .in{font-size:13px;font-weight:700;color:var(--c-trk);font-variant-numeric:tabular-nums}
.tk-chev{flex:none;color:var(--muted);transition:transform .15s}
.tk-fold.open > .tk-fold-h .tk-chev{transform:rotate(90deg)}
.tk-fold-b{padding:0 0 14px}
.tk-fold.sub{border-top:0;margin-left:6px}
.tk-fold.sub .tk-fold-h{min-height:48px;padding:8px 2px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.tk-fold.sub .tk-fold-b{padding:2px 0 10px}
#tkUndo:disabled{opacity:.3}
.tk-dose{background:var(--surface);border-radius:14px;padding:12px;margin:12px 0 4px}
.tk-dose .tk-chip{background:var(--chip)}
.tk-dose .tk-chip.on{background:var(--c-trk)}
.tk-calc{margin-top:10px;border-top:1px dashed var(--line);padding-top:10px}
.tk-calc .big{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums}
.tk-calc .big small{font-size:14px;color:var(--muted);font-weight:600}
.tk-calc .how{font-size:14px;color:var(--muted);margin-top:2px}
.tk-calc .work{font-size:13.5px;color:var(--muted);margin-top:6px;font-variant-numeric:tabular-nums;line-height:1.5}
.tk-src{display:inline-block;margin-top:8px;font-size:14px;font-weight:700;color:var(--accent);padding:6px 0;text-decoration:none}
.tk-start{background:var(--accent-soft);border:1px solid var(--accent);border-radius:14px;padding:12px 14px;margin:4px 0 12px}
.tk-start b{display:block;font-size:17px;margin-bottom:4px}
.tk-ev.hot{outline:2px solid var(--c-trk);outline-offset:-2px}
.tk-chips{display:flex;flex-wrap:wrap;gap:8px}
.tk-chip{background:var(--surface);border-radius:999px;padding:8px 14px;min-height:44px;font-weight:700;font-size:15px;text-align:left}
.tk-chip:active{background:var(--chip)}
.tk-chip.on{background:var(--c-trk);color:var(--c-ink)}
.tk-chip small{display:block;font-size:12px;font-weight:600;color:var(--muted)}
.tk-chip.on small{color:inherit;opacity:.8}
.tk-recent{display:flex;align-items:center;gap:10px;padding:9px 2px;border-top:1px solid var(--line);font-size:15px}
.tk-recent:first-child{border-top:0}
.tk-recent .t{font-weight:700;font-variant-numeric:tabular-nums;min-width:48px}
.tk-recent .l{flex:1;min-width:0}
.tk-row{display:flex;align-items:flex-start;gap:12px;width:100%;text-align:left;padding:12px 2px;border-top:1px solid var(--line);font-size:16px;line-height:1.35}
.tk-row:first-child{border-top:0}
.tk-row:active{background:var(--chip)}
.tk-row .t{flex:none;font-weight:700;font-variant-numeric:tabular-nums;min-width:50px}
.tk-row .l{flex:1;min-width:0}
.tk-row .k{flex:none;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding-top:3px}
.tk-vgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.tk-vgrid .field input{font-size:24px}
.tk-sum{font-size:15px;line-height:1.5}
.tk-sum b{color:var(--muted);font-weight:700}
.tk-drip{display:flex;align-items:center;gap:8px;background:var(--surface);border-radius:12px;padding:8px 8px 8px 12px;margin-bottom:6px}
.tk-drip .l{flex:1;min-width:0;font-weight:700}
.tk-drip .l small{display:block;font-weight:400;color:var(--muted);font-size:13px}
.tk-sbtn{min-height:42px;padding:0 12px;border-radius:10px;background:var(--chip);font-weight:700;font-size:14px}
.tk-bar{display:flex;gap:8px;margin:12px 0}
.tk-bar .btn{margin:0}
.tk-sheet{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;z-index:5}
.tk-sheet-in{width:100%;max-width:720px;margin:0 auto;max-height:88%;overflow:auto;background:var(--bg);border-radius:18px 18px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom))}
.tk-sheet h2{margin:0 0 10px;font-size:20px}
.tk-lbl{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin:12px 0 6px}
.tk-time{display:flex;gap:8px;align-items:center}
.tk-time input{flex:1;min-height:48px;font-size:22px;font-weight:700;background:var(--surface);border:2px solid var(--line);border-radius:12px;padding:0 10px;color:var(--text)}
.tk-snack{position:absolute;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:696px;margin:0 auto;display:flex;align-items:center;gap:6px;background:var(--text);color:var(--bg);padding:6px 6px 6px 14px;border-radius:14px;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:4}
.tk-snack span{flex:1;min-width:0;font-size:15px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tk-snack button{min-height:42px;padding:0 10px;border-radius:10px;color:var(--bg);text-decoration:underline;font-weight:700}
.tk-note{font-size:13px;color:var(--muted);line-height:1.5;margin:14px 2px}
.tk-danger{background:#c92a2a!important;color:#fff!important}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const root = document.createElement('section');
root.id = 'tk'; root.className = 'overlay hidden';
root.innerHTML = `
  <div class="vbar">
    <button class="ibtn" data-act="back" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
    <div class="vtitle"><small id="tkSub"></small><span>Patient Tracker</span></div>
    <div class="tk-clock" id="tkClock"></div>
    <button class="ibtn" data-act="undolast" id="tkUndo" aria-label="Undo last entry"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg></button>
    <button class="ibtn" data-act="askclear" aria-label="Clear patient"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
  </div>
  <nav class="tk-tabs" id="tkTabs"></nav>
  <div class="pbody" id="tkBody"></div>
  <div class="tk-sheet hidden" id="tkSheet"><div class="tk-sheet-in" id="tkSheetIn"></div></div>
  <div class="tk-snack hidden" id="tkSnack"></div>`;
document.body.appendChild(root);
const q = s => root.querySelector(s);

// ---------- render ----------
const TABS = [['hx', 'History'], ['timeline', 'Timeline'], ['log', 'Log'], ['mon', 'Monitoring']];
function render(){
  if (!open) return;
  q('#tkTabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}${k === 'timeline' && P.entries.length ? `<span class="n">${P.entries.length}</span>` : ''}</button>`).join('');
  const tb = q('#tkTabs'), on = q('#tkTabs .on');
  if (on && (on.offsetLeft < tb.scrollLeft || on.offsetLeft + on.offsetWidth > tb.scrollLeft + tb.clientWidth)) tb.scrollLeft = on.offsetLeft - 10;
  tick();
  q('#tkUndo').disabled = !P.entries.length;
  const y = q('#tkBody').scrollTop;
  const f = {log: rLog, mon: rMon, hx: rHx, timeline: rTimeline}[tab];
  q('#tkBody').innerHTML = f();
  q('#tkBody').scrollTop = y;
}
function tick(){
  q('#tkClock').textContent = hm(Date.now());
  const first = P.entries[0];
  q('#tkSub').textContent = first ? `Started ${hm(first.t)} · ${dur(Date.now() - first.t)}` : 'No active patient';
}
const lbl = (t, extra = '') => `<div class="sec-label"${extra}>${t}</div>`;
function recentHTML(n){
  const r = P.entries.slice(-n).reverse();
  if (!r.length) return '';
  return lbl('Last logged') + '<div>' + r.map(e => `<div class="tk-recent"><span class="t">${hm(e.t)}</span><span class="l">${esc(label(e))}</span><button class="tk-sbtn" data-act="edit" data-id="${e.id}">Edit</button></div>`).join('') + '</div>';
}
const CHEV = '<svg class="tk-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>';
function fold(k, title, info, body, sub){
  const o = isOpen(k);
  return `<div class="tk-fold${sub ? ' sub' : ''}${o ? ' open' : ''}"><button class="tk-fold-h" data-fold="${esc(k)}" aria-expanded="${o}">${CHEV}<span class="tt">${title}</span><span class="in">${info || ''}</span></button>${o ? `<div class="tk-fold-b">${body}</div>` : ''}</div>`;
}
function rLog(){
  const lastOf = k => { for (let i = P.entries.length - 1; i >= 0; i--) if (P.entries[i].k === k) return P.entries[i]; return null; };
  const le = lastOf('event'), lm = lastOf('med'), lt = lastOf('tx');
  const info = e => e ? esc(hm(e.t)) : '';
  return fold('ev', 'Events', info(le), rEvents()) + fold('med', 'Meds', drips().length ? drips().length + ' drip' + (drips().length > 1 ? 's' : '') + ' running' : info(lm), rMeds()) + fold('tx', 'Procedures', info(lt), rTx()) +
    recentHTML(3) + '<div class="tk-note">Events log the current time on tap. Use Undo at the top or Edit to fix an entry.</div>';
}
function rEvents(){
  const last = {}, cnt = {};
  for (const e of P.entries) if (e.k === 'event'){ last[e.n] = e.t; cnt[e.n] = (cnt[e.n] || 0) + 1; }
  return EVENTS.map(g => {
    const n0 = g.items.filter(n => last[n]).length;
    return fold('ev:' + g.g, g.g, n0 ? n0 + ' logged' : '', '<div class="tk-grid">' + g.items.map(n =>
      `<button class="tk-ev${last[n] ? ' hot' : ''}" data-act="ev" data-n="${esc(n)}">${esc(n)}<small>${last[n] ? hm(last[n]) + (cnt[n] > 1 ? ' · ×' + cnt[n] : '') : ''}</small></button>`).join('') + '</div>', true);
  }).join('');
}
function medDefaults(n){
  const d = DEF[n] || [], p = prefs.med[n] || {};
  return {unit: p.unit || d[0] || 'mg', route: p.route || d[1] || 'IV', rate: p.rate || d[2] || 'mcg/min'};
}
// ---------- PCG weight-based dose calculation (data in doses.js) ----------
const DOSES = () => (window.LFN_DOSES && window.LFN_DOSES.drugs) || {};
const CALC = () => window.LFN_CALCS || null;
// Pediatric = under 18 years (CAMTS definition, PCG p.19). Neonatal rows show for age 0 months.
function patientPop(){
  const h = P.hx;
  if (h.age === '90+') return 'A';
  if (h.age === '' || h.age == null) return null;
  if (h.ageU === 'mo') return +h.age < 1 ? 'N' : 'P';
  return +h.age >= 18 ? 'A' : 'P';
}
const POPL = {A: 'Adult', P: 'Pediatric', N: 'Neonatal'};
const rnd = x => { const a = Math.abs(x); const d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3; const f = 10 ** d; return Math.round(x * f) / f; };
const pcgLink = (d, label) => `<a class="tk-src" href="#${encodeURIComponent(d.sec)}@${d.p}">${esc(label || `Open PCG ${d.sec}, p.${d.p - 1}`)} ›</a>`;
function doseRows(n){
  const d = DOSES()[n]; if (!d) return null;
  const pop = patientPop();
  const rows = d.rows.map((r, i) => ({...r, i})).filter(r => !pop || r.pop === pop || (pop === 'N' && r.pop === 'P'));
  return {d, rows, pop};
}
// Returns {dose, unit, work[], range, capped, vol}
function computeDose(r, w){
  const work = [];
  const u = r.u === 'mg PE' ? 'mg' : r.u;
  if (r.bands){
    const b = r.bands.find(x => x[0] == null || w < x[0]);
    work.push(`Weight ${fmtN(w)} kg falls in the ${r.note.split('; ')[r.bands.indexOf(b)]} band`);
    return {dose: b[1], unit: u, work};
  }
  const capOf = x => (r.max != null && x > r.max) ? r.max : x;
  const lo = r.lo * w, hi = r.hi * w;
  if (r.lo === r.hi) work.push(`${fmtN(r.lo)} ${r.u}/kg × ${fmtN(w)} kg = ${rnd(lo)} ${r.u}`);
  else work.push(`${fmtN(r.lo)}–${fmtN(r.hi)} ${r.u}/kg × ${fmtN(w)} kg = ${rnd(lo)}–${rnd(hi)} ${r.u}`);
  let capped = false;
  if (r.max != null){
    if (hi > r.max){ capped = true; work.push(`Max single dose ${fmtN(r.max)} ${r.u}: ${lo > r.max ? 'use ' + fmtN(r.max) + ' ' + r.u : 'upper end capped at ' + fmtN(r.max) + ' ' + r.u}`); }
    else work.push(`Under the max single dose of ${fmtN(r.max)} ${r.u}`);
  }
  const dose = rnd(capOf(lo)), top = rnd(capOf(hi));
  const out = {dose, unit: u, work, capped, range: r.lo !== r.hi ? [dose, top] : null};
  if (r.c){ out.vol = rnd(dose / r.c); work.push(`${dose} ${r.u} ÷ ${fmtN(r.c)} ${r.u}/mL = ${out.vol} mL`); }
  return out;
}
function routeFrom(how){
  const m = /^(?:deep\s+|slow\s+|rapid\s+)?(IV|IO|IM|IN|PO|SQ|SIVP|IVP|neb)/i.exec(how || '');
  if (!m) return null;
  const t = m[1].toUpperCase();
  return t === 'SIVP' || t === 'IVP' ? 'IV' : t === 'NEB' ? 'Neb' : t;
}
function doseBlock(){
  if (ms.act !== 'push') return dripBlock();
  const info = doseRows(ms.n);
  if (!info) return `<div class="tk-dose"><div class="dim">No weight-based dose for ${esc(ms.n)} in the PCG formulary. Enter the dose yourself.</div></div>`;
  const {d, rows, pop} = info, w = num(P.hx.wt);
  let h = `<div class="tk-dose"><div class="tk-lbl" style="margin-top:0">PCG weight-based dose${pop ? ' · ' + POPL[pop] : ''}</div>`;
  if (!rows.length){
    return h + `<div class="dim">The PCG has no ${POPL[pop].toLowerCase()} weight-based dose for ${esc(ms.n)} (it may have a fixed dose instead). Enter the dose yourself.</div>${pcgLink(d)}</div>`;
  }
  if (!w) h += `<div class="dim" style="margin-bottom:8px">Enter weight in History to calculate. <button class="tk-sbtn" data-act="gohx">Go to History</button></div>`;
  if (!pop) h += `<div class="dim" style="margin-bottom:8px">Age not entered, so adult and pediatric doses are both listed.</div>`;
  h += '<div class="tk-chips">' + rows.map(r => `<button class="tk-chip${ms.ri === r.i ? ' on' : ''}" data-act="msind" data-v="${r.i}">${esc(r.ind)}<small>${pop ? '' : POPL[r.pop] + ' · '}${r.bands ? 'weight bands' : fmtN(r.lo) + (r.hi !== r.lo ? '–' + fmtN(r.hi) : '') + ' ' + esc(r.u) + '/kg'}${r.max != null ? ' · max ' + fmtN(r.max) + ' ' + esc(r.u) : ''}</small></button>`).join('') + '</div>';
  const r = ms.ri != null ? d.rows[ms.ri] : null;
  if (r && w){
    const c = computeDose(r, w);
    h += `<div class="tk-calc"><div class="big">${c.range ? `${c.range[0]}–${c.range[1]}` : c.dose} ${esc(c.unit)}${c.vol != null ? ` <small>(${c.vol} mL)</small>` : ''}${c.capped ? ' <small>max dose applied</small>' : ''}</div>
      <div class="how">${esc(r.how)}${r.note ? ' · ' + esc(r.note) : ''}</div>
      <div class="work">${c.work.map(x => `<div>${esc(x)}</div>`).join('')}</div>${c.range ? `<div class="work">Dose field filled with the low end of the range.</div>` : ''}</div>`;
  }
  if (r && pop === 'P') h += `<div class="tk-note" style="margin:6px 2px 0">Pediatric doses should not exceed the maximum adult single or total dose (PCG p.18).</div>`;
  h += `<div class="warn" style="margin:10px 0 0"><b>Confirm the dose with the PCG before giving.</b> This is a calculation aid. Check the indication, weight and max dose against the source page.</div>${pcgLink(d)}</div>`;
  return h;
}
// Drips in /kg units: show the total and the pump rate for the LFN standard mix (concentrations from the calculators).
function dripBlock(){
  if (ms.act !== 'start' && ms.act !== 'rate') return '';
  const C = CALC(); const U = /\/kg\//.test(ms.unit), w = num(P.hx.wt), rate = num(ms.dose);
  const mix = C && C.DRUGS.filter(x => x.n === ms.n || x.n.startsWith(ms.n + ' ('));
  const parts = [];
  if (U && !w) parts.push(`<div class="dim">Enter weight in History to convert ${esc(ms.unit)} to a total dose and pump rate. <button class="tk-sbtn" data-act="gohx">Go to History</button></div>`);
  if (rate != null && (!U || w)){
    const [amt, , per] = ms.unit.split('/').length === 3 ? ms.unit.split('/') : [ms.unit.split('/')[0], null, ms.unit.split('/')[1]];
    const tot = U ? rate * w : rate;
    const work = U ? [`${fmtN(rate)} ${ms.unit} × ${fmtN(w)} kg = ${rnd(tot)} ${amt}/${per}`] : [];
    if (mix && mix.length === 1 && amt !== 'mL'){
      const m = mix[0], perHr = per === 'min' ? tot * 60 : tot;
      const inConc = C.toConc(perHr, amt === 'grams' ? 'g' : amt, m.u);
      if (isFinite(inConc)){
        const mlhr = inConc / m.c;
        work.push(`${per === 'min' ? `${rnd(tot)} ${amt}/min × 60 = ${rnd(perHr)} ${amt}/hr; ` : ''}÷ ${m.c} ${m.u}/mL (${m.mix}) = ${rnd(mlhr)} mL/hr`);
        parts.push(`<div class="tk-calc"><div class="big">${rnd(mlhr)} mL/hr <small>${U ? rnd(tot) + ' ' + amt + '/' + per : ''}</small></div><div class="how">LFN standard mix ${esc(m.mix)}</div><div class="work">${work.map(x => `<div>${esc(x)}</div>`).join('')}</div></div>`);
      }
    } else if (work.length) parts.push(`<div class="tk-calc"><div class="big">${rnd(tot)} ${esc(amt)}/${esc(per)}</div><div class="work">${work.map(x => `<div>${esc(x)}</div>`).join('')}</div></div>`);
  }
  if (!parts.length) return '';
  return `<div class="tk-dose">${parts.join('')}<div class="warn" style="margin:10px 0 0"><b>Confirm with the PCG and the actual bag concentration before running.</b></div></div>`;
}
function rMeds(){
  let h = '';
  const dr = drips();
  if (dr.length) h += fold('med:drips', 'Running drips', dr.length, dr.map(e =>
    `<div class="tk-drip"><span class="l">${esc(e.n)} ${e.dose != null ? fmtN(e.dose) + ' ' + esc(e.unit) : ''}<small>since ${hm(e.t)}</small></span><button class="tk-sbtn" data-act="medsheet" data-n="${esc(e.n)}" data-a="rate">Rate</button><button class="tk-sbtn" data-act="stopdrip" data-n="${esc(e.n)}">Stop</button></div>`).join(''), true);
  const seen = new Set(), rec = [];
  for (let i = P.entries.length - 1; i >= 0 && rec.length < 6; i--){
    const e = P.entries[i];
    if (e.k === 'med' && (!e.act || e.act === 'push') && !seen.has(e.n)){ seen.add(e.n); rec.push(e); }
  }
  if (rec.length) h += fold('med:given', 'Given · tap to redose', rec.length, '<div class="tk-chips">' + rec.map(e =>
    `<button class="tk-chip" data-act="medsheet" data-n="${esc(e.n)}" data-id="${e.id}">${esc(medLabel(e))}<small>${ago(e.t)}</small></button>`).join('') + '</div>', true);
  let f = `<div class="searchbox" style="margin:4px 0 4px;height:52px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
    <input id="tkMq" type="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Find a formulary drug" value="${esc(medQ)}"></div>`;
  f += '<div id="tkMlist">' + medList() + '</div>';
  return h + '<div style="margin-top:8px">' + f + '</div>';
}
function medList(){
  const s = medQ.trim().toLowerCase();
  const list = s ? MEDS.filter(n => n.toLowerCase().includes(s)) : FREQ.filter(n => MEDS.includes(n));
  return lbl(s ? 'Formulary' : 'Common') + (list.length ? '<div class="tk-chips">' + list.map(n => `<button class="tk-chip" data-act="medsheet" data-n="${esc(n)}">${esc(n)}</button>`).join('') + '</div>' : '<div class="empty">Not in the formulary list.</div>') +
    (s ? '' : '<div class="tk-note">Search to see all formulary drugs. Blood products and fluids are under Procedures.</div>');
}
function rTx(){
  const last = {};
  for (const e of P.entries) if (e.k === 'tx') last[e.n] = e.t;
  return TX.map(g => {
    const n0 = g.items.filter(it => last[it.n]).length;
    return fold('tx:' + g.g, g.g, n0 ? n0 + ' logged' : '', '<div class="tk-chips">' + g.items.map(it =>
      `<button class="tk-chip${last[it.n] ? ' on' : ''}" data-act="tx" data-n="${esc(it.n)}">${esc(it.n)}${last[it.n] ? `<small>${hm(last[it.n])}</small>` : ''}</button>`).join('') + '</div>', true);
  }).join('') + '<div class="tk-note">Items with details (size, side, units) open a short form; every detail is optional.</div>';
}
let vDraft = {}, mDraft = {vent: {}, neuro: {}, fhr: {}};
function rMon(){
  const lastOf = (k, g) => { for (let i = P.entries.length - 1; i >= 0; i--){ const e = P.entries[i]; if (e.k === k && (!g || e.g === g)) return e; } return null; };
  const info = e => e ? hm(e.t) : '';
  let h = fold('mon:vitals', 'Vitals', info(lastOf('vitals')), rVitals());
  for (const c of MON){
    const d = mDraft[c.g], last = lastOf('mon', c.g);
    let b = last ? `<div class="card"><h3>Last · ${hm(last.t)} · ${ago(last.t)}</h3><div class="tk-sum">${esc(monLabel(last).replace(/^[^:]+: /, ''))}</div></div>` : '';
    // Fields in config order; consecutive number fields share a two-column grid.
    let grid = [];
    const flush = () => { if (grid.length){ b += '<div class="tk-vgrid" style="margin-top:10px">' + grid.join('') + '</div>'; grid = []; } };
    for (const f of c.f){
      if (f.pick){ flush(); b += lbl(esc(f.l)) + '<div class="tk-chips">' + f.pick.map(o => `<button class="tk-chip${d[f.k] === o ? ' on' : ''}" data-act="mpick" data-g="${c.g}" data-f="${f.k}" data-v="${esc(o)}">${esc(o)}</button>`).join('') + '</div>'; }
      else grid.push(`<div class="field"><label>${esc(f.l)}${f.u ? ' (' + esc(f.u) + ')' : ''}</label><input data-mg="${c.g}" data-mf="${f.k}" type="number" inputmode="decimal" step="any" placeholder="—" value="${d[f.k] != null ? esc(d[f.k]) : ''}"></div>`);
    }
    flush();
    if (c.g === 'neuro' && d.e && d.v && d.m) b += `<div class="tk-note" style="margin:8px 2px 0">GCS total: <b>${+d.e + (d.v === 'T' ? 0 : +d.v) + +d.m}${d.v === 'T' ? 'T' : ''}</b></div>`;
    b += lbl('Time') + `<div class="tk-time"><input type="time" id="tkMt-${c.g}" value="${d._t || hm(Date.now())}"><button class="tk-sbtn" data-act="tnow" data-for="tkMt-${c.g}">Now</button></div>`;
    b += `<button class="btn" data-act="logmon" data-g="${c.g}" style="margin-top:14px">Log ${esc(c.t.toLowerCase())}</button>`;
    h += fold('mon:' + c.g, c.t, info(last), b);
  }
  return h;
}
function rVitals(){
  const lastV = [...P.entries].reverse().find(e => e.k === 'vitals');
  let h = lastV ? `<div class="card"><h3>Last set · ${hm(lastV.t)} · ${ago(lastV.t)}</h3><div class="tk-sum">${esc(vitalsLabel(lastV).replace(/^Vitals: /, ''))}</div></div>` : '';
  h += '<div class="tk-vgrid">' + VITALS.map(v => `<div class="field"><label for="tkv-${v.k}">${v.l}</label><input id="tkv-${v.k}" data-v="${v.k}" type="number" inputmode="decimal" step="any" placeholder="—" value="${vDraft[v.k] != null ? esc(vDraft[v.k]) : ''}"></div>`).join('') + '</div>';
  h += lbl('Rhythm') + '<div class="tk-chips">' + RHYTHMS.map(r => `<button class="tk-chip${vDraft.rhythm === r ? ' on' : ''}" data-act="rhythm" data-v="${esc(r)}">${esc(r)}</button>`).join('') + '</div>';
  h += lbl('Time') + `<div class="tk-time"><input type="time" id="tkVt" value="${vDraft.time || hm(Date.now())}"><button class="tk-sbtn" data-act="vnow">Now</button></div>`;
  h += `<button class="btn" data-act="logv" style="margin-top:14px">Log vitals</button>`;
  return h;
}
function rHx(){
  const h = P.hx;
  const chips = k => {
    const c = HX[k], val = h[k];
    return lbl(c.l) + '<div class="tk-chips">' + c.o.map(o => {
      const on = c.multi ? (val || []).includes(o) : val === o;
      return `<button class="tk-chip${on ? ' on' : ''}" data-act="hx" data-k="${k}" data-v="${esc(o)}">${esc(o)}</button>`;
    }).join('') + '</div>';
  };
  const over = h.age === '90+';
  const fresh = !P.entries.length && !h.wt && (h.age === '' || h.age == null);
  let s = (fresh ? `<div class="tk-start"><b>New patient: enter age and weight first.</b>Weight drives the dose calculations in Log. Age picks adult or pediatric doses (pediatric is under 18). <button class="tk-sbtn" data-act="tolog" style="margin-top:8px">Skip to Log</button></div>` : '') + `<div class="warn" style="margin-top:4px">No names, dates of birth, record numbers, addresses or other identifiers. There are no free-text fields on purpose.</div>
    <div class="inputs">
      <div class="field"><label for="tkAge">Age</label><input id="tkAge" data-h="age" type="number" inputmode="numeric" min="0" max="89" placeholder="—" value="${over ? '' : esc(h.age ?? '')}"${over ? ' disabled' : ''}></div>
      <div class="field"><label for="tkWt">Weight (kg)</label><input id="tkWt" data-h="wt" type="number" inputmode="decimal" min="0" max="400" step="any" placeholder="—" value="${esc(h.wt ?? '')}"></div>
    </div>
    <div class="tk-chips">${['y', 'mo'].map(u => `<button class="tk-chip${(h.ageU || 'y') === u && !over ? ' on' : ''}" data-act="ageu" data-v="${u}">${u === 'y' ? 'years' : 'months'}</button>`).join('')}<button class="tk-chip${over ? ' on' : ''}" data-act="age90">90 or older</button></div>`;
  s += chips('sex') + chips('imp') + chips('mech') + chips('pmh') + chips('alg');
  s += lbl('Allergy to a formulary drug') + `<select id="tkAlg" class="tk-chip" style="width:100%;color:var(--text)"><option value="">Add from formulary…</option>${MEDS.map(n => `<option>${esc(n)}</option>`).join('')}</select>`;
  s += chips('code');
  s += '<div class="tk-note">Ages 90 and over are recorded as "90+" because exact ages over 89 count as identifiers under HIPAA.</div>';
  return s;
}
function exportText(){
  const L = [];
  L.push('PATIENT TIMELINE (de-identified)');
  L.push(`Exported ${hm(Date.now())}. Times are device clock, 24 h.`);
  const hx = hxLine();
  if (hx.length){ L.push(''); for (const [k, v] of hx) L.push(`${k}: ${v}`); }
  L.push('');
  for (const e of P.entries) L.push(`${hm(e.t)}  ${label(e)}`);
  const tt = totals().filter(o => o.c > 1);
  if (tt.length){ L.push(''); L.push('Repeat-dose totals:'); for (const o of tt) L.push(`  ${o.n} ${fmtN(o.sum)} ${o.unit} (${o.c} doses)`); }
  const dr = drips();
  if (dr.length){ L.push(''); L.push('Drips running at export:'); for (const e of dr) L.push(`  ${e.n} ${e.dose != null ? fmtN(e.dose) + ' ' + e.unit : ''}`.trimEnd()); }
  return L.join('\n');
}
function rTimeline(){
  let h = '';
  const hx = hxLine();
  if (hx.length) h += `<div class="card" style="margin-top:4px"><h3>History</h3><div class="tk-sum">${hx.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div></div>`;
  const tt = totals(), dr = drips();
  if (tt.length || dr.length) h += `<div class="card"><h3>Meds</h3><div class="tk-sum">${tt.map(o => `<div>${esc(o.n)} <b>${fmtN(o.sum)} ${esc(o.unit)}</b>${o.c > 1 ? ` in ${o.c} doses` : ''}, last ${hm(o.last)}</div>`).join('')}${dr.map(e => `<div>${esc(e.n)} drip <b>${e.dose != null ? fmtN(e.dose) + ' ' + esc(e.unit) : 'running'}</b></div>`).join('')}</div></div>`;
  if (!P.entries.length) h += '<div class="empty">Nothing logged yet.</div>';
  else {
    const kind = {event: 'Event', med: 'Med', tx: 'Proc', vitals: 'Vitals', mon: 'Monitor'};
    h += lbl('Timeline · tap to edit') + '<div class="list">' + P.entries.map(e => `<button class="tk-row" data-act="edit" data-id="${e.id}"><span class="t">${hm(e.t)}</span><span class="l">${esc(label(e))}</span><span class="k">${kind[e.k] || ''}</span></button>`).join('') + '</div>';
  }
  h += `<div class="tk-bar"><button class="btn" data-act="copy"${hasData() ? '' : ' disabled'}>Copy timeline</button>${navigator.share ? `<button class="btn ghost" data-act="share"${hasData() ? '' : ' disabled'}>Share…</button>` : ''}</div>`;
  h += `<button class="btn ghost tk-danger" data-act="askclear">Clear patient</button>`;
  h += lbl('Auto-clear after last entry') + '<div class="tk-chips">' + [4, 8, 12, 24, 0].map(n => `<button class="tk-chip${prefs.ttl === n ? ' on' : ''}" data-act="ttl" data-v="${n}">${n ? n + ' h' : 'Off'}</button>`).join('') + '</div>';
  h += `<div class="tk-note">Everything here stays in this phone's browser storage. Nothing is uploaded and there are no analytics. Copy or Share puts the text in your clipboard or another app, which is then outside this app's control.<br><br>
    Leaving out identifier fields lowers the risk but is not a HIPAA guarantee: times, age, impression and events together can still identify a patient. Clear the patient after charting, and follow your employer's policy on clinical data on personal devices.</div>`;
  return h;
}

// ---------- sheets ----------
function openSheet(html){ sheet = true; q('#tkSheetIn').innerHTML = html; q('#tkSheet').classList.remove('hidden'); q('#tkSheetIn').scrollTop = 0; }
function closeSheet(){ sheet = null; q('#tkSheet').classList.add('hidden'); q('#tkSheetIn').innerHTML = ''; }
const timeRow = id => `<div class="tk-lbl">Time</div><div class="tk-time"><input type="time" id="${id}" value="${hm(Date.now())}"><button class="tk-sbtn" data-act="tnow" data-for="${id}">Now</button></div>`;
// Unchanged "now" keeps full precision so same-minute entries stay in tap order.
const pickTime = id => { const el = q('#' + id); const now = Date.now(); if (!el || el.value === hm(now)) return now; let t = fromHM(el.value, now); if (t > now + 60e3) t -= 864e5; return t; };
let ms = null; // med sheet state
function medSheet(n, act, fromId){
  const d = medDefaults(n);
  const src = fromId && P.entries.find(e => e.id === fromId);
  const running = drips().find(e => e.n === n);
  act = act || (running ? 'rate' : 'push');
  ms = {n, act, ri: null, unit: src ? src.unit : (act === 'push' ? d.unit : (running ? running.unit : d.rate)), route: src ? src.route : d.route, dose: src && src.dose != null ? src.dose : ''};
  drawMedSheet();
}
function drawMedSheet(){
  const isRate = ms.act === 'start' || ms.act === 'rate';
  const units = isRate ? RATE_U : PUSH_U;
  if (!units.includes(ms.unit)) ms.unit = isRate ? medDefaults(ms.n).rate : medDefaults(ms.n).unit;
  openSheet(`<h2>${esc(ms.n)}</h2>
    <div class="tk-chips">${Object.entries(ACTS).map(([k, l]) => `<button class="tk-chip${ms.act === k ? ' on' : ''}" data-act="msact" data-v="${k}">${l}</button>`).join('')}</div>
    ${ms.act === 'stop' ? '' : `
    <div id="tkDoseCalc">${doseBlock()}</div>
    <div class="tk-lbl">${isRate ? 'Rate' : 'Dose'}</div>
    <div class="field"><input id="tkDose" type="number" inputmode="decimal" step="any" placeholder="—" value="${esc(ms.dose)}"></div>
    <div class="tk-lbl">Unit</div><div class="tk-chips">${units.map(u => `<button class="tk-chip${ms.unit === u ? ' on' : ''}" data-act="msunit" data-v="${u}">${u}</button>`).join('')}</div>
    ${ms.act === 'rate' ? '' : `<div class="tk-lbl">Route</div><div class="tk-chips">${ROUTES.map(r => `<button class="tk-chip${ms.route === r ? ' on' : ''}" data-act="msroute" data-v="${r}">${r}</button>`).join('')}</div>`}`}
    ${timeRow('tkMt')}
    <div class="tk-bar" style="margin-top:16px"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="logmed">Log</button></div>`);
}
function txSheet(n){
  const it = TX.flatMap(g => g.items).find(x => x.n === n);
  if (!it) return;
  if (!it.f){ addEntry({k: 'tx', n}); return; }
  openSheet(`<h2>${esc(n)}</h2>` + it.f.map((f, i) => f.pick
    ? `<div class="tk-lbl">${esc(f.k)}</div><div class="tk-chips" data-pick="${i}">${f.pick.map(o => `<button class="tk-chip" data-act="pick" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
    : `<div class="tk-lbl">${esc(f.k)}${f.u ? ' (' + esc(f.u) + ')' : ''}</div><div class="field"><input data-f="${i}" type="number" inputmode="decimal" step="any" placeholder="optional"></div>`).join('') +
    timeRow('tkTt') + `<div class="tk-bar" style="margin-top:16px"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="logtx" data-n="${esc(n)}">Log</button></div>`);
}
function editSheet(id){
  const e = P.entries.find(x => x.id === id); if (!e) return;
  openSheet(`<h2>${esc(label(e))}</h2>
    <div class="tk-lbl">Time</div><div class="tk-time"><input type="time" id="tkEt" value="${hm(e.t)}"></div>
    <div class="tk-bar" style="margin-top:16px"><button class="btn ghost" data-act="close">Cancel</button><button class="btn" data-act="savet" data-id="${id}">Save time</button></div>
    <button class="btn ghost tk-danger" data-act="del" data-id="${id}">Delete entry</button>
    <div class="tk-note">To change a dose or detail, delete this entry and log it again.</div>`);
}
function clearSheet(){
  openSheet(`<h2>Clear this patient?</h2><p class="dim" style="margin:0 0 8px">Deletes every entry and the history from this phone. This can't be undone. Copy the timeline first if you still need it for charting.</p>
    <div class="tk-bar"><button class="btn ghost" data-act="close">Cancel</button><button class="btn tk-danger" data-act="doclear">Clear patient</button></div>`);
}

// ---------- snackbar ----------
function snack(msg, id, canRestore){
  const s = q('#tkSnack');
  s.innerHTML = `<span>${esc(msg)}</span>${id ? `<button data-act="undo" data-id="${id}">Undo</button><button data-act="edit" data-id="${id}">Time</button>` : ''}${canRestore ? '<button data-act="restore">Restore</button>' : ''}`;
  s.classList.remove('hidden');
  clearTimeout(snackT); snackT = setTimeout(() => s.classList.add('hidden'), 5000);
}

// ---------- events ----------
root.addEventListener('click', e => {
  const tb = e.target.closest('[data-tab]');
  if (tb){ tab = tb.dataset.tab; q('#tkBody').scrollTop = 0; render(); q('#tkBody').scrollTop = 0; return; }
  if (e.target.id === 'tkSheet'){ closeSheet(); return; }
  const fh = e.target.closest('[data-fold]');
  if (fh){ const k = fh.dataset.fold; prefs.fold[k] = !isOpen(k); savePrefs(); render(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, n = b.dataset.n, v = b.dataset.v, id = b.dataset.id;
  switch (a){
    case 'back': hide(true); break;
    case 'ev': addEntry({k: 'event', n}); break;
    case 'tx': txSheet(n); break;
    case 'medsheet': medSheet(n, b.dataset.a, id); break;
    case 'stopdrip': addEntry({k: 'med', n, act: 'stop'}); break;
    case 'msact': ms.dose = (q('#tkDose') || {}).value ?? ms.dose; ms.act = v; drawMedSheet(); break;
    case 'msunit': ms.dose = (q('#tkDose') || {}).value ?? ms.dose; ms.unit = v; b.parentNode.querySelectorAll('.tk-chip').forEach(c => c.classList.toggle('on', c === b)); { const el = q('#tkDoseCalc'); if (el) el.innerHTML = doseBlock(); } break;
    case 'msind': {
      ms.ri = +v; const d = DOSES()[ms.n], r = d && d.rows[ms.ri], w = num(P.hx.wt);
      if (r && w){ const c = computeDose(r, w); ms.dose = c.dose; ms.unit = c.unit; ms.calc = {pk: r.bands ? 'weight band' : `${fmtN(r.lo)}${r.hi !== r.lo ? '–' + fmtN(r.hi) : ''} ${r.u}/kg`, dose: c.dose, ind: r.ind}; const rt = routeFrom(r.how); if (rt) ms.route = rt; }
      else ms.dose = (q('#tkDose') || {}).value ?? ms.dose;
      drawMedSheet(); { const c = q('.tk-calc'); if (c) c.scrollIntoView({block: 'center'}); } break;
    }
    case 'tolog': tab = 'log'; render(); break;
    case 'gohx': closeSheet(); tab = 'hx'; render(); q('#tkBody').scrollTop = 0; break;
    case 'msroute': ms.route = v; b.parentNode.querySelectorAll('.tk-chip').forEach(c => c.classList.toggle('on', c === b)); break;
    case 'logmed': {
      const ent = {k: 'med', n: ms.n, act: ms.act, t: pickTime('tkMt')};
      if (ms.act !== 'stop'){
        const d = num((q('#tkDose') || {}).value);
        if (d == null && ms.act === 'rate'){ snack('Enter the new rate.'); return; }
        if (d != null){ ent.dose = d; ent.unit = ms.unit; }
        if (ms.act !== 'rate') ent.route = ms.route;
        const p = prefs.med[ms.n] || {};
        if (ms.act === 'push'){ p.unit = ms.unit; p.route = ms.route; } else { p.rate = ms.unit; }
        prefs.med[ms.n] = p; savePrefs();
      }
      if (ms.act === 'push') delete ent.act;
      if (ms.act === 'push' && ms.calc && ent.dose === ms.calc.dose && ent.unit === ms.unit){ ent.ind = ms.calc.ind; ent.pk = ms.calc.pk; }
      closeSheet(); addEntry(ent); break;
    }
    case 'pick': b.parentNode.querySelectorAll('.tk-chip').forEach(c => c.classList.toggle('on', c === b && !c.classList.contains('on'))); break;
    case 'logtx': {
      const it = TX.flatMap(g => g.items).find(x => x.n === n), d = [];
      it.f.forEach((f, i) => {
        if (f.pick){ const on = q(`[data-pick="${i}"] .tk-chip.on`); if (on) d.push(f.k === 'Side' || f.k === 'Limb' || f.k === 'Fluid' || f.k === 'Device' || f.k === 'Mode' ? on.dataset.v : `${f.k} ${on.dataset.v}`); }
        else { const x = num(q(`[data-f="${i}"]`).value); if (x != null) d.push(`${f.k} ${fmtN(x)}${f.u ? (f.u === '%' ? '%' : ' ' + f.u) : ''}`); }
      });
      const t = pickTime('tkTt'); closeSheet(); addEntry({k: 'tx', n, d, t}); break;
    }
    case 'tnow': { const el = q('#' + b.dataset.for); if (el) el.value = hm(Date.now()); break; }
    case 'mpick': { const d = mDraft[b.dataset.g]; d[b.dataset.f] = d[b.dataset.f] === v ? undefined : v; render(); break; }
    case 'logmon': {
      const g = b.dataset.g, c = MON.find(x => x.g === g), d = mDraft[g], vals = {};
      for (const f of c.f){
        if (f.pick){ if (d[f.k]) vals[f.k] = d[f.k]; }
        else { const x = num(d[f.k] ?? ''); if (x != null) vals[f.k] = fmtN(x); }
      }
      if (!Object.keys(vals).length){ snack('Enter at least one value.'); return; }
      const t = pickTime('tkMt-' + g);
      mDraft[g] = {}; addEntry({k: 'mon', g, v: vals, t}); break;
    }
    case 'rhythm': vDraft.rhythm = vDraft.rhythm === v ? undefined : v; render(); break;
    case 'vnow': vDraft.time = undefined; q('#tkVt').value = hm(Date.now()); break;
    case 'logv': {
      const vals = {};
      for (const f of VITALS){ const x = num(q('#tkv-' + f.k).value); if (x != null) vals[f.k] = x; }
      if (vDraft.rhythm) vals.rhythm = vDraft.rhythm;
      if (!Object.keys(vals).length){ snack('Enter at least one value.'); return; }
      const t = pickTime('tkVt');
      vDraft = {}; addEntry({k: 'vitals', v: vals, t}); break;
    }
    case 'hx': {
      const c = HX[b.dataset.k];
      if (c.multi){
        let arr = P.hx[b.dataset.k] || [];
        arr = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
        const excl = {pmh: 'None', alg: 'NKDA'}[b.dataset.k];
        if (excl) arr = v === excl ? arr.filter(x => x === excl) : arr.filter(x => x !== excl);
        P.hx[b.dataset.k] = arr;
      } else P.hx[b.dataset.k] = P.hx[b.dataset.k] === v ? '' : v;
      save(); render(); break;
    }
    case 'ageu': if (P.hx.age === '90+') P.hx.age = ''; P.hx.ageU = v; save(); render(); break;
    case 'age90': P.hx.age = P.hx.age === '90+' ? '' : '90+'; P.hx.ageU = 'y'; save(); render(); break;
    case 'edit': editSheet(id); break;
    case 'savet': { const en = P.entries.find(x => x.id === id); if (en){ en.t = fromHM(q('#tkEt').value, en.t); P.entries.sort((x, y) => x.t - y.t); save(); } closeSheet(); render(); break; }
    case 'del': case 'undo': {
      const en = P.entries.find(x => x.id === id);
      P.entries = P.entries.filter(x => x.id !== id); save(); closeSheet(); render();
      if (en){ lastRemoved = en; snack(`Removed: ${label(en)}`, null, true); }
      break;
    }
    case 'undolast': {
      if (!P.entries.length) break;
      const en = P.entries.reduce((a, x) => ((x.c || 0) >= (a.c || 0) ? x : a));
      P.entries = P.entries.filter(x => x !== en); lastRemoved = en; save(); render();
      snack(`Undid: ${label(en)}`, null, true);
      break;
    }
    case 'restore': if (lastRemoved){ P.entries.push(lastRemoved); P.entries.sort((x, y) => x.t - y.t); lastRemoved = null; save(); render(); snack('Restored.'); } break;
    case 'close': closeSheet(); break;
    case 'askclear': clearSheet(); break;
    case 'doclear': clearPatient(); vDraft = {}; mDraft = {vent: {}, neuro: {}, fhr: {}}; closeSheet(); tab = 'hx'; P.seen = 1; ls.set(KEY, P); render(); snack('Patient cleared. Enter age and weight for the next patient.'); break;
    case 'ttl': prefs.ttl = +v; savePrefs(); render(); break;
    case 'copy': copyText(exportText()); break;
    case 'share': navigator.share({title: 'Patient timeline', text: exportText()}).catch(() => {}); break;
  }
});
root.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'tkDose' && ms && (ms.act === 'start' || ms.act === 'rate')){ ms.dose = t.value; const el = q('#tkDoseCalc'); if (el) el.innerHTML = doseBlock(); return; }
  if (t.id === 'tkMq'){ medQ = t.value; q('#tkMlist').innerHTML = medList(); return; }
  if (t.dataset.mg){ mDraft[t.dataset.mg][t.dataset.mf] = t.value; return; }
  if (t.id && t.id.startsWith('tkMt-')){ mDraft[t.id.slice(5)]._t = t.value; return; }
  if (t.dataset.v && t.closest('.tk-vgrid')){ vDraft[t.dataset.v] = t.value; return; }
  if (t.id === 'tkVt'){ vDraft.time = t.value; return; }
  if (t.dataset.h === 'age'){ let x = num(t.value); if (x != null && x > 89 && (P.hx.ageU || 'y') === 'y'){ P.hx.age = '90+'; save(); render(); return; } P.hx.age = x == null ? '' : x; save(); return; }
  if (t.dataset.h === 'wt'){ const x = num(t.value); P.hx.wt = x == null ? '' : x; save(); return; }
});
root.addEventListener('change', e => {
  if (e.target.id === 'tkAlg' && e.target.value){
    const arr = (P.hx.alg || []).filter(x => x !== 'NKDA');
    if (!arr.includes(e.target.value)) arr.push(e.target.value);
    P.hx.alg = arr; save(); render();
  }
});
function copyText(s){
  const done = () => snack('Timeline copied. Paste it into your charting.');
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(done, () => fallback());
  else fallback();
  function fallback(){
    const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, s.length);
    let ok = false; try { ok = document.execCommand('copy'); } catch(e){}
    ta.remove(); ok ? done() : snack('Copy failed. Use Share instead.');
  }
}

// ---------- open / close / tile ----------
function show(push){
  const cleared = expire();
  open = true;
  // New patient: open on History so age and weight go in first.
  if (!P.seen){ P.seen = 1; ls.set(KEY, P); tab = 'hx'; }
  if (push) history.pushState({tk: 1}, '', '#tracker');
  root.classList.remove('hidden'); document.body.style.overflow = 'hidden';
  render();
  if (cleared) snack('Previous patient was cleared automatically.');
  clearInterval(clockT); clockT = setInterval(() => { if (expire()){ render(); snack('Patient cleared automatically.'); } else tick(); }, 15000);
}
function hide(viaBack){
  if (viaBack && history.state && history.state.tk){ history.back(); return; }
  open = false; closeSheet(); clearInterval(clockT);
  root.classList.add('hidden');
  if (document.querySelectorAll('.overlay:not(.hidden)').length === 0) document.body.style.overflow = '';
  if (location.hash === '#tracker') history.replaceState(null, '', location.pathname);
  updateTile();
}
window.addEventListener('popstate', () => { if (location.hash === '#tracker'){ if (!open) show(false); } else if (open) hide(false); });
document.addEventListener('click', e => { if (e.target.closest('[data-tk]')) show(true); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && expire()){ render(); updateTile(); } });
function updateTile(){
  const el = document.querySelector('.tk-tsub'); if (!el) return;
  const first = P.entries[0];
  el.textContent = first ? `In progress · started ${hm(first.t)} · ${P.entries.length} entr${P.entries.length === 1 ? 'y' : 'ies'}` : '';
}
const home = document.getElementById('home');
if (home) new MutationObserver(updateTile).observe(home, {childList: true});
expire(); updateTile();
if (location.hash === '#tracker') show(false);
})();
