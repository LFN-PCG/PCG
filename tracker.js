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
    {n: 'Vent settings', f: [{k: 'Mode', pick: ['AC/VC', 'AC/PC', 'SIMV', 'PRVC', 'CPAP/PS']}, {k: 'Vt', u: 'mL'}, {k: 'RR'}, {k: 'PEEP'}, {k: 'FiO2', u: '%'}]},
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
let prefs = Object.assign({ttl: 12, med: {}}, ls.get(PREF, {}));
let tab = 'events', medQ = '', sheet = null, open = false, snackT = 0, clockT = 0;
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
  e.id = uid(); if (!e.t) e.t = Date.now();
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
  return `${e.n}${d ? ' ' + d : ''}${e.route ? ' ' + e.route : ''}`;
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
function label(e){
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
    <button class="ibtn" data-act="askclear" aria-label="Clear patient"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
  </div>
  <nav class="tk-tabs" id="tkTabs"></nav>
  <div class="pbody" id="tkBody"></div>
  <div class="tk-sheet hidden" id="tkSheet"><div class="tk-sheet-in" id="tkSheetIn"></div></div>
  <div class="tk-snack hidden" id="tkSnack"></div>`;
document.body.appendChild(root);
const q = s => root.querySelector(s);

// ---------- render ----------
const TABS = [['timeline', 'Timeline'], ['hx', 'History'], ['events', 'Events'], ['meds', 'Meds'], ['tx', 'Procedures'], ['vitals', 'Vitals']];
function render(){
  if (!open) return;
  q('#tkTabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}${k === 'timeline' && P.entries.length ? `<span class="n">${P.entries.length}</span>` : ''}</button>`).join('');
  const tb = q('#tkTabs'), on = q('#tkTabs .on');
  if (on && (on.offsetLeft < tb.scrollLeft || on.offsetLeft + on.offsetWidth > tb.scrollLeft + tb.clientWidth)) tb.scrollLeft = on.offsetLeft - 10;
  tick();
  const y = q('#tkBody').scrollTop;
  const f = {events: rEvents, meds: rMeds, tx: rTx, vitals: rVitals, hx: rHx, timeline: rTimeline}[tab];
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
function rEvents(){
  const last = {}, cnt = {};
  for (const e of P.entries) if (e.k === 'event'){ last[e.n] = e.t; cnt[e.n] = (cnt[e.n] || 0) + 1; }
  return EVENTS.map((g, i) => lbl(g.g, i ? '' : ' style="margin-top:4px"') + '<div class="tk-grid">' + g.items.map(n =>
    `<button class="tk-ev${last[n] ? ' hot' : ''}" data-act="ev" data-n="${esc(n)}">${esc(n)}<small>${last[n] ? hm(last[n]) + (cnt[n] > 1 ? ' · ×' + cnt[n] : '') : ''}</small></button>`).join('') + '</div>').join('') +
    recentHTML(3) + `<div class="tk-note">Tap logs the current time. Use Edit to change the time afterward.</div>`;
}
function medDefaults(n){
  const d = DEF[n] || [], p = prefs.med[n] || {};
  return {unit: p.unit || d[0] || 'mg', route: p.route || d[1] || 'IV', rate: p.rate || d[2] || 'mcg/min'};
}
function rMeds(){
  let h = '';
  const dr = drips();
  if (dr.length) h += lbl('Running drips', ' style="margin-top:4px"') + dr.map(e =>
    `<div class="tk-drip"><span class="l">${esc(e.n)} ${e.dose != null ? fmtN(e.dose) + ' ' + esc(e.unit) : ''}<small>since ${hm(e.t)}</small></span><button class="tk-sbtn" data-act="medsheet" data-n="${esc(e.n)}" data-a="rate">Rate</button><button class="tk-sbtn" data-act="stopdrip" data-n="${esc(e.n)}">Stop</button></div>`).join('');
  const seen = new Set(), rec = [];
  for (let i = P.entries.length - 1; i >= 0 && rec.length < 6; i--){
    const e = P.entries[i];
    if (e.k === 'med' && (!e.act || e.act === 'push') && !seen.has(e.n)){ seen.add(e.n); rec.push(e); }
  }
  if (rec.length) h += lbl('Given this patient · tap to redose') + '<div class="tk-chips">' + rec.map(e =>
    `<button class="tk-chip" data-act="medsheet" data-n="${esc(e.n)}" data-id="${e.id}">${esc(medLabel(e))}<small>${ago(e.t)}</small></button>`).join('') + '</div>';
  h += `<div class="searchbox" style="margin:16px 0 4px;height:52px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
    <input id="tkMq" type="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Find a formulary drug" value="${esc(medQ)}"></div>`;
  h += '<div id="tkMlist">' + medList() + '</div>';
  return h;
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
  return TX.map((g, i) => lbl(g.g, i ? '' : ' style="margin-top:4px"') + '<div class="tk-chips">' + g.items.map(it =>
    `<button class="tk-chip${last[it.n] ? ' on' : ''}" data-act="tx" data-n="${esc(it.n)}">${esc(it.n)}${last[it.n] ? `<small>${hm(last[it.n])}</small>` : ''}</button>`).join('') + '</div>').join('') +
    recentHTML(3) + '<div class="tk-note">Items without details log on tap. Items with details (size, side, units) open a short form; every detail is optional.</div>';
}
let vDraft = {};
function rVitals(){
  const lastV = [...P.entries].reverse().find(e => e.k === 'vitals');
  let h = lastV ? `<div class="card" style="margin-top:4px"><h3>Last set · ${hm(lastV.t)} · ${ago(lastV.t)}</h3><div class="tk-sum">${esc(vitalsLabel(lastV).replace(/^Vitals: /, ''))}</div></div>` : '';
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
  let s = `<div class="warn" style="margin-top:4px">No names, dates of birth, record numbers, addresses or other identifiers. There are no free-text fields on purpose.</div>
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
    const kind = {event: 'Event', med: 'Med', tx: 'Proc', vitals: 'Vitals'};
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
  ms = {n, act, unit: src ? src.unit : (act === 'push' ? d.unit : (running ? running.unit : d.rate)), route: src ? src.route : d.route, dose: src && src.dose != null ? src.dose : ''};
  drawMedSheet();
}
function drawMedSheet(){
  const isRate = ms.act === 'start' || ms.act === 'rate';
  const units = isRate ? RATE_U : PUSH_U;
  if (!units.includes(ms.unit)) ms.unit = isRate ? medDefaults(ms.n).rate : medDefaults(ms.n).unit;
  openSheet(`<h2>${esc(ms.n)}</h2>
    <div class="tk-chips">${Object.entries(ACTS).map(([k, l]) => `<button class="tk-chip${ms.act === k ? ' on' : ''}" data-act="msact" data-v="${k}">${l}</button>`).join('')}</div>
    ${ms.act === 'stop' ? '' : `
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
function snack(msg, id){
  const s = q('#tkSnack');
  s.innerHTML = `<span>${esc(msg)}</span>${id ? `<button data-act="undo" data-id="${id}">Undo</button><button data-act="edit" data-id="${id}">Time</button>` : ''}`;
  s.classList.remove('hidden');
  clearTimeout(snackT); snackT = setTimeout(() => s.classList.add('hidden'), 5000);
}

// ---------- events ----------
root.addEventListener('click', e => {
  const tb = e.target.closest('[data-tab]');
  if (tb){ tab = tb.dataset.tab; q('#tkBody').scrollTop = 0; render(); q('#tkBody').scrollTop = 0; return; }
  if (e.target.id === 'tkSheet'){ closeSheet(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, n = b.dataset.n, v = b.dataset.v, id = b.dataset.id;
  switch (a){
    case 'back': hide(true); break;
    case 'ev': addEntry({k: 'event', n}); break;
    case 'tx': txSheet(n); break;
    case 'medsheet': medSheet(n, b.dataset.a, id); break;
    case 'stopdrip': addEntry({k: 'med', n, act: 'stop'}); break;
    case 'msact': ms.dose = (q('#tkDose') || {}).value ?? ms.dose; ms.act = v; drawMedSheet(); break;
    case 'msunit': ms.dose = (q('#tkDose') || {}).value ?? ms.dose; ms.unit = v; b.parentNode.querySelectorAll('.tk-chip').forEach(c => c.classList.toggle('on', c === b)); break;
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
      if (en) snack(`Removed: ${label(en)}`);
      break;
    }
    case 'close': closeSheet(); break;
    case 'askclear': clearSheet(); break;
    case 'doclear': clearPatient(); vDraft = {}; closeSheet(); tab = 'events'; render(); snack('Patient cleared.'); break;
    case 'ttl': prefs.ttl = +v; savePrefs(); render(); break;
    case 'copy': copyText(exportText()); break;
    case 'share': navigator.share({title: 'Patient timeline', text: exportText()}).catch(() => {}); break;
  }
});
root.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'tkMq'){ medQ = t.value; q('#tkMlist').innerHTML = medList(); return; }
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
