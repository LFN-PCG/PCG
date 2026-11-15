// Weight-based doses from the Patient Care Guidelines formulary (chapter 12), version 2026.09.15.
// Each value was read from the PDF dosing table on the page given (p = PDF page; printed page = p - 1).
// pop: A adult, P pediatric, N neonatal. lo/hi: dose per kg (range when they differ). u: dose unit.
// max: max single dose in u. c: concentration in u per mL where the PCG names one. Only weight-based
// rows are included; fixed adult doses are not. Re-verify every row when the guidelines change.
window.LFN_DOSES = {
"version": "2026.09.15",
"drugs": {
  "Activated Charcoal": {"sec": "12.03", "p": 314, "rows": [
    {"ind": "Toxic absorption", "pop": "A", "lo": 1, "hi": 1, "u": "g", "how": "PO/NG", "note": "", "max": 100},
    {"ind": "Toxic absorption", "pop": "P", "lo": 0.5, "hi": 1, "u": "g", "how": "PO/NG", "note": "", "max": 50}
  ]},
  "Adenosine": {"sec": "12.04", "p": 315, "rows": [
    {"ind": "SVT, first dose", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "rapid IVP", "note": "Max initial dose 6 mg", "max": 6},
    {"ind": "SVT, repeat dose", "pop": "P", "lo": 0.2, "hi": 0.2, "u": "mg", "how": "rapid IVP", "note": "May repeat x2 if no response; max single dose 12 mg", "max": 12}
  ]},
  "Amiodarone": {"sec": "12.07", "p": 319, "rows": [
    {"ind": "Pulseless VT/VF", "pop": "P", "lo": 5, "hi": 5, "u": "mg", "how": "IV/IO", "note": "May repeat x2", "max": 300},
    {"ind": "VT with a pulse", "pop": "P", "lo": 5, "hi": 5, "u": "mg", "how": "IV over 60 min", "note": "Max dose 15 mg/kg"}
  ]},
  "Atropine": {"sec": "12.09", "p": 321, "rows": [
    {"ind": "Bradycardia", "pop": "P", "lo": 0.02, "hi": 0.02, "u": "mg", "how": "IV", "note": "May repeat x1; max single dose 0.5 mg; max total 3 mg", "max": 0.5},
    {"ind": "Ketamine hypersecretions", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV PRN", "note": ""},
    {"ind": "Organophosphate poisoning", "pop": "P", "lo": 0.05, "hi": 0.05, "u": "mg", "how": "IV", "note": "Repeat q 5 min until secretions have decreased"},
    {"ind": "RSI pretreatment (≤ 28 days)", "pop": "P", "lo": 0.02, "hi": 0.02, "u": "mg", "how": "IV", "note": ""}
  ]},
  "Calcium Chloride": {"sec": "12.11", "p": 323, "rows": [
    {"ind": "Hyperkalemia / hypocalcemia / CCB OD", "pop": "P", "lo": 20, "hi": 20, "u": "mg", "how": "IV over 2–5 min", "note": "May repeat x1 PRN"},
    {"ind": "Blood product administration (MTP)", "pop": "P", "lo": 10, "hi": 20, "u": "mg", "how": "IV over 2 min", "note": ""}
  ]},
  "Calcium Gluconate": {"sec": "12.12", "p": 324, "rows": [
    {"ind": "Hyperkalemia with ECG changes", "pop": "P", "lo": 50, "hi": 50, "u": "mg", "how": "IV over 2 min", "note": ""},
    {"ind": "Magnesium sulfate toxicity", "pop": "P", "lo": 10, "hi": 30, "u": "mg", "how": "IV over 2 min", "note": ""},
    {"ind": "Massive blood transfusion", "pop": "P", "lo": 50, "hi": 50, "u": "mg", "how": "IV over 5 min", "note": "Consider after 1–2 boluses"},
    {"ind": "Septic shock, ionized Ca < 1.1", "pop": "P", "lo": 50, "hi": 50, "u": "mg", "how": "IV over 5 min", "note": "Max dose 2 grams", "max": 2000}
  ]},
  "Cefazolin": {"sec": "12.13", "p": 325, "rows": [
    {"ind": "Open fractures", "pop": "P", "lo": 30, "hi": 30, "u": "mg", "how": "IVP over 3–5 min", "note": "Max 2 grams", "max": 2000}
  ]},
  "Cisatracurium": {"sec": "12.14", "p": 326, "rows": [
    {"ind": "Ongoing paralysis (bolus)", "pop": "A", "lo": 0.1, "hi": 0.2, "u": "mg", "how": "IV bolus", "note": "Infusion 1–3 mcg/kg/min"},
    {"ind": "Ongoing paralysis (bolus)", "pop": "P", "lo": 0.1, "hi": 0.15, "u": "mg", "how": "IV bolus", "note": "Infusion 1–4 mcg/kg/min"}
  ]},
  "Dexamethasone": {"sec": "12.17", "p": 330, "rows": [
    {"ind": "Croup", "pop": "P", "lo": 0.6, "hi": 0.6, "u": "mg", "how": "", "note": "Max dose 12 mg", "max": 12}
  ]},
  "Dextrose": {"sec": "12.19", "p": 332, "rows": [
    {"ind": "Hypoglycemia / AMS / BB or salicylate OD (D10)", "pop": "P", "lo": 5, "hi": 5, "u": "mL", "how": "D10 IV PRN", "note": "If BGL < 60 mg/dL"},
    {"ind": "Neonatal hypoglycemia (D10)", "pop": "P", "lo": 2, "hi": 2, "u": "mL", "how": "D10 IV PRN", "note": "For neonates if BGL < 40 mg/dL"},
    {"ind": "Hyperkalemia (D10 with insulin)", "pop": "P", "lo": 2, "hi": 2, "u": "mL", "how": "D10 IV over 30 min", "note": "Plus insulin 0.1 units/kg; D10 not required if BGL > 250 mg/dL"}
  ]},
  "Diazepam": {"sec": "12.20", "p": 333, "rows": [
    {"ind": "Seizures", "pop": "P", "lo": 0.15, "hi": 0.15, "u": "mg", "how": "IV", "note": "May repeat q 5 min; max single dose 5 mg; max total 30 mg", "max": 5},
    {"ind": "Anxiety", "pop": "P", "lo": 0.05, "hi": 0.05, "u": "mg", "how": "IV", "note": "May repeat q 30 min PRN"},
    {"ind": "Combative patient", "pop": "P", "lo": 0.05, "hi": 0.1, "u": "mg", "how": "IV", "note": "May repeat q 30 min PRN; max dose 5 mg", "max": 5},
    {"ind": "Sedation: post-intubation", "pop": "P", "lo": 0.05, "hi": 0.1, "u": "mg", "how": "IV", "note": "May repeat q 15 min PRN; max single dose 5 mg", "max": 5}
  ]},
  "Diltiazem": {"sec": "12.21", "p": 334, "rows": [
    {"ind": "Narrow complex tachycardia", "pop": "A", "lo": 0.25, "hi": 0.25, "u": "mg", "how": "IV bolus", "note": "Repeat with 0.35 mg/kg if rate not controlled after 15 min; max single dose 20 mg", "max": 20},
    {"ind": "Narrow complex tachycardia, repeat", "pop": "A", "lo": 0.35, "hi": 0.35, "u": "mg", "how": "IV bolus", "note": "If rate not controlled after 15 min; max single dose 20 mg", "max": 20},
    {"ind": "Aortic emergencies", "pop": "A", "lo": 0.25, "hi": 0.25, "u": "mg", "how": "IV bolus", "note": "Max 20 mg; for tachycardia despite beta blocker therapy", "max": 20}
  ]},
  "Diphenhydramine": {"sec": "12.22", "p": 335, "rows": [
    {"ind": "Refractory nausea/vomiting", "pop": "A", "lo": 1, "hi": 1, "u": "mg", "how": "SIVP", "note": "Max 25 mg; pediatric same as adult", "max": 25},
    {"ind": "Refractory nausea/vomiting", "pop": "P", "lo": 1, "hi": 1, "u": "mg", "how": "SIVP", "note": "Same as adult", "max": 25},
    {"ind": "Allergic reactions", "pop": "A", "lo": 1, "hi": 1, "u": "mg", "how": "SIVP", "note": "Max 50 mg; pediatric same as adult", "max": 50},
    {"ind": "Allergic reactions", "pop": "P", "lo": 1, "hi": 1, "u": "mg", "how": "SIVP", "note": "Same as adult", "max": 50},
    {"ind": "Post-droperidol", "pop": "P", "lo": 1, "hi": 1, "u": "mg", "how": "IV/IO/IM", "note": "Max 50 mg", "max": 50}
  ]},
  "Droperidol": {"sec": "12.25", "p": 338, "rows": [
    {"ind": "Combative patient", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "Max single dose 5 mg; max total 10 mg; give diphenhydramine 1 mg/kg if dystonic symptoms occur", "max": 5},
    {"ind": "Refractory nausea/vomiting", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV", "note": "Max dose 1.25 mg", "max": 1.25}
  ]},
  "Epinephrine": {"sec": "12.26", "p": 340, "rows": [
    {"ind": "Push dose (10 mcg/mL)", "pop": "P", "lo": 1, "hi": 1, "u": "mcg", "how": "IV (0.1 mL/kg)", "note": "May repeat q 3–5 min; max single dose 20 mcg", "max": 20, "c": 10},
    {"ind": "Cardiac arrest (0.1 mg/mL)", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV (0.1 mL/kg)", "note": "May repeat q 3–5 min; max single dose 1 mg", "max": 1, "c": 0.1},
    {"ind": "Cardiac arrest, neonatal (0.1 mg/mL)", "pop": "N", "lo": 0.02, "hi": 0.02, "u": "mg", "how": "IV (0.2 mL/kg)", "note": "May repeat q 3–5 min; max single dose 1 mg", "max": 1, "c": 0.1},
    {"ind": "Allergic reaction / asthma (1 mg/mL)", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IM", "note": "May repeat q 15 min; max single dose 0.3 mg", "max": 0.3, "c": 1},
    {"ind": "Refractory anaphylaxis (0.1 mg/mL)", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "SIVP over 2 min (0.1 mL/kg)", "note": "May repeat q 3–5 min; max single dose 0.1 mg", "max": 0.1, "c": 0.1},
    {"ind": "LOST, low output state of trauma (0.1 mg/mL)", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV (0.1 mL/kg)", "note": "May repeat q 3–5 min; max single dose 1 mg", "max": 1, "c": 0.1},
    {"ind": "Nebulized, non-racemic (croup / anaphylaxis)", "pop": "A", "lo": 0.5, "hi": 0.5, "u": "mL", "how": "neb, 1 mg/mL solution", "note": "Max single dose 5 mL; may repeat x2 q 15 min; if < 5 mL add NS to 5 mL total", "max": 5},
    {"ind": "Nebulized, non-racemic (croup / anaphylaxis)", "pop": "P", "lo": 0.5, "hi": 0.5, "u": "mL", "how": "neb, 1 mg/mL solution", "note": "Max single dose 5 mL; may repeat x2 q 15 min; if < 5 mL add NS to 5 mL total", "max": 5}
  ]},
  "Esmolol": {"sec": "12.28", "p": 343, "rows": [
    {"ind": "Loading dose (aortic emergency / refractory VF-pVT / AF-flutter with RVR)", "pop": "A", "lo": 500, "hi": 500, "u": "mcg", "how": "IV over 1 min", "note": "Then infusion at 50 mcg/kg/min; repeat bolus after 4 min if targets not met. 10 mg/mL: dosing chart p.343", "c": 10000}
  ]},
  "Etomidate": {"sec": "12.29", "p": 345, "rows": [
    {"ind": "RSI", "pop": "A", "lo": 0.3, "hi": 0.3, "u": "mg", "how": "IV", "note": "May repeat dose x2; max 40 mg", "max": 40},
    {"ind": "RSI", "pop": "P", "lo": 0.3, "hi": 0.3, "u": "mg", "how": "IV", "note": "May repeat dose x2; max 20 mg", "max": 20},
    {"ind": "Procedural sedation", "pop": "A", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV over 30–60 s", "note": "May repeat with 0.05 mg/kg q 3–5 min PRN; max 3 doses"},
    {"ind": "Procedural sedation", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV over 30–60 s", "note": "Same as adult: repeat 0.05 mg/kg q 3–5 min PRN; max 3 doses"}
  ]},
  "Fentanyl": {"sec": "12.30", "p": 346, "rows": [
    {"ind": "Pain management", "pop": "A", "lo": 1, "hi": 2, "u": "mcg", "how": "IV/IO/IN/IM", "note": "May repeat q 10 min; max single dose 150 mcg", "max": 150},
    {"ind": "Pain management", "pop": "P", "lo": 1, "hi": 2, "u": "mcg", "how": "IV/IO/IN/IM", "note": "May repeat q 10 min; max single dose 150 mcg; max total 4 mcg/kg", "max": 150}
  ]},
  "Flumazenil": {"sec": "12.31", "p": 347, "rows": [
    {"ind": "Benzodiazepine OD", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV over 15 s", "note": "May repeat if no response after 45 s; max 0.2 mg per dose; max total 1 mg", "max": 0.2}
  ]},
  "Fosphenytoin": {"sec": "12.32", "p": 348, "rows": [
    {"ind": "Status epilepticus", "pop": "A", "lo": 15, "hi": 20, "u": "mg PE", "how": "IV at 150 mg/min", "note": "Max dose 2000 mg PE", "max": 2000},
    {"ind": "Status epilepticus", "pop": "P", "lo": 15, "hi": 20, "u": "mg PE", "how": "IV", "note": "Max 1,500 mg PE/dose", "max": 1500}
  ]},
  "Furosemide": {"sec": "12.33", "p": 349, "rows": [
    {"ind": "Pulmonary edema & CHF / hyperkalemia", "pop": "P", "lo": 1, "hi": 2, "u": "mg", "how": "IV", "note": "Or equal to patient’s daily dose; max 20 mg", "max": 20}
  ]},
  "Heparin": {"sec": "12.35", "p": 351, "rows": [
    {"ind": "STEMI / ACS (TSE)", "pop": "A", "lo": 60, "hi": 60, "u": "units", "how": "IV bolus", "note": "Max 4,000 units, then infusion at 12 units/kg/hr (max 1000 units/hr)", "max": 4000},
    {"ind": "STEMI bound for St. Charles Bend", "pop": "A", "lo": 70, "hi": 70, "u": "units", "how": "IV bolus", "note": "Max 10,000 units", "max": 10000}
  ]},
  "Hydromorphone": {"sec": "12.37", "p": 353, "rows": [
    {"ind": "Pain management, age < 6 months", "pop": "P", "lo": 0.005, "hi": 0.005, "u": "mg", "how": "IV/IM", "note": "May repeat q 15 min to max of 4 mg"},
    {"ind": "Pain management, age ≥ 6 months", "pop": "P", "lo": 0.015, "hi": 0.015, "u": "mg", "how": "IV/IM", "note": "May repeat q 15 min to max of 4 mg"}
  ]},
  "Hydroxocobalamin": {"sec": "12.38", "p": 354, "rows": [
    {"ind": "Cyanide poisoning", "pop": "P", "lo": 70, "hi": 70, "u": "mg", "how": "IV over 15 min", "note": "May repeat x1"}
  ]},
  "Hypertonic Saline 3%": {"sec": "12.39", "p": 355, "rows": [
    {"ind": "Increased ICP (hemorrhagic stroke, cerebral edema, head injury)", "pop": "P", "lo": 5, "hi": 5, "u": "mL", "how": "IV over 15 min", "note": "May repeat x1 PRN; max 250 mL per bolus", "max": 250}
  ]},
  "Insulin": {"sec": "12.40", "p": 356, "rows": [
    {"ind": "Diabetic ketoacidosis", "pop": "A", "lo": 0.1, "hi": 0.1, "u": "units", "how": "IV bolus", "note": "Then infusion at 0.1 units/kg/hr"},
    {"ind": "Beta blocker / calcium channel blocker OD", "pop": "A", "lo": 1, "hi": 1, "u": "units", "how": "IV bolus", "note": "Then infusion at 0.5 units/kg/hr, titrate q 15–30 min to 2 units/kg/hr; give with D10 if BGL < 250 mg/dL"},
    {"ind": "Hyperkalemia", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "units", "how": "IV over 30 min", "note": "Give with D10 if BGL < 250 mg/dL"}
  ]},
  "Lactated Ringers": {"sec": "12.44", "p": 362, "rows": [
    {"ind": "Fluid resuscitation (typical bolus)", "pop": "P", "lo": 10, "hi": 20, "u": "mL", "how": "IV", "note": "Titrate to desired effect per patient presentation"}
  ]},
  "Levetiracetam": {"sec": "12.45", "p": 363, "rows": [
    {"ind": "Seizures", "pop": "A", "lo": 50, "hi": 50, "u": "mg", "how": "IV over 15 min in 100 mL NS", "note": "Max dose 3000 mg", "max": 3000},
    {"ind": "Seizures", "pop": "P", "lo": 50, "hi": 50, "u": "mg", "how": "IV over 15 min in 100 mL NS", "note": "Max dose 1500 mg", "max": 1500}
  ]},
  "Lidocaine": {"sec": "12.46", "p": 364, "rows": [
    {"ind": "Cardiac arrest: medical", "pop": "A", "lo": 1, "hi": 1.5, "u": "mg", "how": "IV", "note": "Repeat with 0.75 mg/kg q 5–10 min; max 3 doses or 3 mg/kg"},
    {"ind": "Cardiac arrest: repeat dose", "pop": "A", "lo": 0.75, "hi": 0.75, "u": "mg", "how": "IV", "note": "q 5–10 min; max 3 doses or 3 mg/kg"},
    {"ind": "Tachycardias", "pop": "A", "lo": 1, "hi": 1.5, "u": "mg", "how": "IV", "note": "Repeat with 0.5–0.75 mg/kg q 3–5 min; max 3 doses or 3 mg/kg"},
    {"ind": "Tachycardias: repeat dose", "pop": "A", "lo": 0.5, "hi": 0.75, "u": "mg", "how": "IV", "note": "q 3–5 min; max 3 doses or 3 mg/kg"},
    {"ind": "Intraosseous pain management (< 20 kg)", "pop": "P", "lo": 0.5, "hi": 0.5, "u": "mg", "how": "IO over 120 s", "note": "Allow to dwell 60 s; max 40 mg. Same as adult (40 mg) if > 20 kg", "max": 40}
  ]},
  "Lipid Emulsion 2%": {"sec": "12.47", "p": 365, "rows": [
    {"ind": "Beta blocker / calcium channel blocker OD", "pop": "A", "lo": 1.5, "hi": 1.5, "u": "mL", "how": "IV over 1 min", "note": "Follow with 0.25–0.5 mL/kg/min infusion"}
  ]},
  "Lorazepam": {"sec": "12.48", "p": 366, "rows": [
    {"ind": "Anxiolysis", "pop": "A", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV q 20 min PRN", "note": "Max 1 mg per dose", "max": 1},
    {"ind": "Anxiolysis", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV q 20 min PRN", "note": "Same as adult; max 1 mg per dose", "max": 1},
    {"ind": "Combative patient", "pop": "P", "lo": 0.05, "hi": 0.1, "u": "mg", "how": "IV/IM q 20 min", "note": ""},
    {"ind": "Sedation: post-intubation", "pop": "P", "lo": 0.05, "hi": 0.1, "u": "mg", "how": "IV", "note": "May repeat q 45 min"},
    {"ind": "Refractory nausea", "pop": "P", "lo": 0.05, "hi": 0.05, "u": "mg", "how": "IV", "note": "Max 1 mg", "max": 1},
    {"ind": "Shivering from rapid cooling for heat stroke", "pop": "P", "lo": 0.05, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "Max single dose 1 mg; max total 5 mg", "max": 1},
    {"ind": "Seizures", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV q 5 min PRN", "note": "Max single dose 4 mg", "max": 4}
  ]},
  "Ketamine": {"sec": "12.42", "p": 358, "rows": [
    {"ind": "Pain management", "pop": "A", "lo": 0.1, "hi": 0.2, "u": "mg", "how": "slow IVP", "note": "May repeat q 20 min"},
    {"ind": "Pain management", "pop": "P", "lo": 0.1, "hi": 0.2, "u": "mg", "how": "slow IVP", "note": "Same as adult; dilute to 1 mg/mL if < 25 kg"},
    {"ind": "Sedation: post-intubation", "pop": "A", "lo": 1, "hi": 1, "u": "mg", "how": "slow IVP", "note": "Repeat 0.5 mg/kg q 15 min; if last dose ≥ 15 min ago, redose at 1 mg/kg"},
    {"ind": "Sedation: post-intubation", "pop": "P", "lo": 1, "hi": 1, "u": "mg", "how": "slow IVP", "note": "Same as adult"},
    {"ind": "Sedation: post-intubation, repeat", "pop": "A", "lo": 0.5, "hi": 0.5, "u": "mg", "how": "slow IVP", "note": "q 15 min"},
    {"ind": "Sedation: post-intubation, repeat", "pop": "P", "lo": 0.5, "hi": 0.5, "u": "mg", "how": "slow IVP", "note": "Same as adult"},
    {"ind": "Combative patient, IM", "pop": "A", "lo": 4, "hi": 4, "u": "mg", "how": "IM", "note": "For severe agitation without IV access"},
    {"ind": "Combative patient, IM", "pop": "P", "lo": 4, "hi": 4, "u": "mg", "how": "IM", "note": "Same as adult"},
    {"ind": "Combative patient, IV", "pop": "A", "lo": 0.5, "hi": 2, "u": "mg", "how": "IV", "note": "May repeat q 15 min"},
    {"ind": "Combative patient, IV", "pop": "P", "lo": 0.5, "hi": 2, "u": "mg", "how": "IV", "note": "Same as adult"},
    {"ind": "RSI induction", "pop": "A", "lo": 1, "hi": 2, "u": "mg", "how": "slow IVP", "note": "Reduce to 1 mg/kg for hypotensive patients"},
    {"ind": "RSI induction", "pop": "P", "lo": 1, "hi": 2, "u": "mg", "how": "slow IVP", "note": "Same as adult"},
    {"ind": "Refractory seizures", "pop": "A", "lo": 1, "hi": 1, "u": "mg", "how": "slow IVP", "note": "May repeat q 5 min to max total of 5 mg/kg"},
    {"ind": "Refractory seizures", "pop": "P", "lo": 1, "hi": 1, "u": "mg", "how": "slow IVP", "note": "Same as adult"},
    {"ind": "Procedural sedation", "pop": "A", "lo": 0.5, "hi": 1, "u": "mg", "how": "IV over 30–60 s", "note": "May repeat q 15 min PRN"},
    {"ind": "Procedural sedation", "pop": "P", "lo": 0.5, "hi": 1, "u": "mg", "how": "IV over 30–60 s", "note": "Same as adult"}
  ]},
  "Magnesium Sulfate": {"sec": "12.49", "p": 367, "rows": [
    {"ind": "Torsades de pointes", "pop": "P", "lo": 25, "hi": 50, "u": "mg", "how": "IV over 15 min", "note": "Max 2 grams/dose", "max": 2000},
    {"ind": "Asthma", "pop": "P", "lo": 50, "hi": 50, "u": "mg", "how": "IV over 20 min", "note": "Max 2 grams", "max": 2000}
  ]},
  "Mannitol": {"sec": "12.50", "p": 369, "rows": [
    {"ind": "Cerebral edema (DKA) / herniation (head injury, ICH)", "pop": "A", "lo": 0.5, "hi": 1, "u": "g", "how": "IV over 15 min", "note": ""},
    {"ind": "Cerebral edema (DKA) / herniation (head injury, ICH)", "pop": "P", "lo": 0.5, "hi": 1, "u": "g", "how": "IV over 15 min", "note": "Same as adult"}
  ]},
  "Methylprednisolone": {"sec": "12.52", "p": 371, "rows": [
    {"ind": "Allergic reaction / asthma / epiglottitis & croup / high altitude", "pop": "P", "lo": 2, "hi": 2, "u": "mg", "how": "IV", "note": "Max 60 mg", "max": 60}
  ]},
  "Midazolam": {"sec": "12.54", "p": 373, "rows": [
    {"ind": "Combative patient, IN", "pop": "A", "lo": 0.3, "hi": 0.3, "u": "mg", "how": "IN, split between nostrils", "note": "Max 10 mg; consider lower doses for frail/elderly", "max": 10},
    {"ind": "Combative patient, IV/IM", "pop": "P", "lo": 0.05, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "May repeat q 15 min"},
    {"ind": "Combative patient, IN", "pop": "P", "lo": 0.3, "hi": 0.3, "u": "mg", "how": "IN, split between nostrils", "note": "Max 10 mg", "max": 10},
    {"ind": "Post-intubation sedation", "pop": "P", "lo": 0.05, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "Max dose 5 mg; may repeat q 15 min", "max": 5},
    {"ind": "Seizures, IV/IM", "pop": "A", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "May repeat q 5 min; max single dose 5 mg", "max": 5},
    {"ind": "Seizures, IV/IM", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "Same as adult", "max": 5},
    {"ind": "Seizures, IN", "pop": "A", "lo": 0.3, "hi": 0.3, "u": "mg", "how": "IN, split between nostrils", "note": "Max dose 10 mg", "max": 10},
    {"ind": "Seizures, IN", "pop": "P", "lo": 0.3, "hi": 0.3, "u": "mg", "how": "IN, split between nostrils", "note": "Same as adult", "max": 10},
    {"ind": "RSI induction", "pop": "A", "lo": 0.2, "hi": 0.2, "u": "mg", "how": "IV", "note": "0.1 mg/kg if hypotensive; max 20 mg", "max": 20},
    {"ind": "RSI induction, hypotensive", "pop": "A", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV", "note": "Max 20 mg", "max": 20},
    {"ind": "RSI induction", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV", "note": "Max dose 20 mg", "max": 20},
    {"ind": "Anxiolysis", "pop": "A", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV q 15 min PRN", "note": "Max single dose 5 mg", "max": 5},
    {"ind": "Anxiolysis", "pop": "P", "lo": 0.01, "hi": 0.01, "u": "mg", "how": "IV q 15 min PRN", "note": "Same as adult", "max": 5}
  ]},
  "Milrinone": {"sec": "12.55", "p": 375, "rows": [
    {"ind": "Pulmonary edema / CHF, loading dose", "pop": "A", "lo": 50, "hi": 50, "u": "mcg", "how": "IV over 10 min", "note": "Then 0.375–0.75 mcg/kg/min infusion"},
    {"ind": "Pulmonary edema / CHF, loading dose", "pop": "P", "lo": 50, "hi": 50, "u": "mcg", "how": "IV over 10 min", "note": "Same as adult"}
  ]},
  "Morphine Sulfate": {"sec": "12.56", "p": 376, "rows": [
    {"ind": "Pain management", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "Max 5 mg; may repeat q 5 min", "max": 5}
  ]},
  "N-acetylcysteine": {"sec": "12.57", "p": 377, "rows": [
    {"ind": "Acetaminophen OD, oral loading", "pop": "A", "lo": 140, "hi": 140, "u": "mg", "how": "PO or NG/OG", "note": "Additional doses 70 mg/kg q 4 hours for 68 hours"},
    {"ind": "Acetaminophen OD, oral loading", "pop": "P", "lo": 140, "hi": 140, "u": "mg", "how": "PO or NG/OG", "note": "Same as adult"},
    {"ind": "Acetaminophen OD, IV loading", "pop": "A", "lo": 150, "hi": 150, "u": "mg", "how": "in 200 mL D5W over 60 min", "note": "Then 50 mg/kg in 500 mL D5W over 4 h, then 100 mg/kg in 1000 mL D5W over 16 h"},
    {"ind": "Acetaminophen OD, IV loading", "pop": "P", "lo": 150, "hi": 150, "u": "mg", "how": "in 200 mL D5W over 60 min", "note": "Same as adult"}
  ]},
  "Naloxone": {"sec": "12.58", "p": 378, "rows": [
    {"ind": "Opioid overdose", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV/IM/IN", "note": "May repeat q 3–5 min PRN; max single dose 0.4 mg", "max": 0.4},
    {"ind": "Clonidine overdose (opioid-naive adult)", "pop": "A", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV", "note": "Max 2 mg/dose; repeat q 1–2 min PRN to 10 mg total", "max": 2},
    {"ind": "Clonidine overdose", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV", "note": "Repeat q 1–2 min PRN; max single dose 2 mg; max total 10 mg", "max": 2}
  ]},
  "Ondansetron": {"sec": "12.65", "p": 386, "rows": [
    {"ind": "Nausea/vomiting", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV/IM", "note": "May repeat x1 after 15 min; max single dose 4 mg", "max": 4}
  ]},
  "Phenobarbital": {"sec": "12.67", "p": 388, "rows": [
    {"ind": "Status epilepticus", "pop": "A", "lo": 15, "hi": 20, "u": "mg", "how": "IV at 60 mg/min", "note": "Max dose 1000 mg", "max": 1000},
    {"ind": "Status epilepticus", "pop": "P", "lo": 15, "hi": 20, "u": "mg", "how": "IV at 60 mg/min", "note": "Same as adult", "max": 1000}
  ]},
  "Potassium Chloride": {"sec": "12.69", "p": 390, "rows": [
    {"ind": "Hypokalemia, oral", "pop": "P", "lo": 2, "hi": 2, "u": "mEq", "how": "PO", "note": "If K 2.5–3.0; may repeat x1 after 30–60 min; max 40 mEq", "max": 40},
    {"ind": "Hypokalemia, IV", "pop": "P", "lo": 0.5, "hi": 0.5, "u": "mEq", "how": "IV over 1–2 hours", "note": "Not to exceed 10 mEq/hr; if K < 2.5 (asymptomatic) or < 3 if symptomatic. Never IV push"}
  ]},
  "Pralidoxime": {"sec": "12.70", "p": 391, "rows": [
    {"ind": "Organophosphate insecticide poisoning", "pop": "P", "lo": 20, "hi": 50, "u": "mg", "how": "IV infusion in 100 mL NS over 15–30 min", "note": "Dose and volume not to exceed adult dosage (1–2 g)", "max": 2000}
  ]},
  "Promethazine": {"sec": "12.71", "p": 392, "rows": [
    {"ind": "Nausea/vomiting", "pop": "P", "lo": 0.5, "hi": 0.5, "u": "mg", "how": "deep IM or IV", "note": "Max 25 mg. Do not use in children < 2 years", "max": 25}
  ]},
  "Propofol": {"sec": "12.72", "p": 393, "rows": [
    {"ind": "Post-intubation sedation, bolus to start infusion", "pop": "A", "lo": 1, "hi": 1, "u": "mg", "how": "IV via pump (not IV push)", "note": "Max 25 mg; then infusion at 25 mcg/kg/min (max 75)", "max": 25},
    {"ind": "Post-intubation sedation, bolus to start infusion", "pop": "P", "lo": 0.5, "hi": 0.5, "u": "mg", "how": "IV via pump (not IV push)", "note": "Max 20 mg; then infusion at 25 mcg/kg/min (max 75)", "max": 20}
  ]},
  "Rocuronium": {"sec": "12.74", "p": 395, "rows": [
    {"ind": "Paralysis for RSI, IV", "pop": "A", "lo": 1, "hi": 1, "u": "mg", "how": "IV", "note": "Max 100 mg", "max": 100},
    {"ind": "Paralysis for RSI, IV", "pop": "P", "lo": 1, "hi": 1, "u": "mg", "how": "IV", "note": "Same as adult", "max": 100},
    {"ind": "Paralysis for RSI, IM", "pop": "A", "lo": 1.8, "hi": 1.8, "u": "mg", "how": "IM", "note": "Max 100 mg", "max": 100},
    {"ind": "Paralysis for RSI, IM", "pop": "P", "lo": 1.8, "hi": 1.8, "u": "mg", "how": "IM", "note": "Same as adult", "max": 100},
    {"ind": "To maintain paralysis", "pop": "A", "lo": 0.5, "hi": 0.5, "u": "mg", "how": "IV", "note": "May repeat PRN; max 100 mg", "max": 100},
    {"ind": "To maintain paralysis", "pop": "P", "lo": 0.5, "hi": 0.5, "u": "mg", "how": "IV", "note": "Same as adult", "max": 100},
    {"ind": "Combative, no IV access, succinylcholine contraindicated", "pop": "A", "lo": 2, "hi": 2, "u": "mg", "how": "IM", "note": "Extreme/safety of flight concerns only"}
  ]},
  "Sodium Bicarbonate": {"sec": "12.75", "p": 396, "rows": [
    {"ind": "Hyperkalemia", "pop": "A", "lo": 1, "hi": 1, "u": "mEq", "how": "IV", "note": "Max 50 mEq; may repeat if ECG changes or arrest persist", "max": 50},
    {"ind": "Hyperkalemia", "pop": "P", "lo": 1, "hi": 1, "u": "mEq", "how": "IV", "note": "Same as adult", "max": 50},
    {"ind": "Salicylate / barbiturate overdose", "pop": "A", "lo": 2, "hi": 2, "u": "mEq", "how": "IV", "note": "Then 250 mL/hr infusion (150 mEq in 850 mL D5W)"},
    {"ind": "Salicylate / barbiturate overdose", "pop": "P", "lo": 2, "hi": 2, "u": "mEq", "how": "IV", "note": "Same as adult"},
    {"ind": "TCA OD: QRS > 100 ms, HR > 140, seizures or hypotension", "pop": "P", "lo": 1, "hi": 1, "u": "mEq", "how": "IVP", "note": "Max 50 mEq. Seizures: plus IV benzodiazepine. Hypotension: plus IV fluid bolus", "max": 50},
    {"ind": "TCA OD: QRS > 160 ms", "pop": "P", "lo": 2, "hi": 2, "u": "mEq", "how": "IVP", "note": "Max 100 mEq", "max": 100}
  ]},
  "Sodium Polystyrene Sulfonate": {"sec": "12.77", "p": 399, "rows": [
    {"ind": "Hyperkalemia", "pop": "P", "lo": 1, "hi": 2, "u": "g", "how": "PO/PR", "note": ""}
  ]},
  "Succinylcholine": {"sec": "12.78", "p": 400, "rows": [
    {"ind": "Paralysis for RSI", "pop": "A", "lo": 1, "hi": 2, "u": "mg", "how": "IV", "note": "Max 200 mg", "max": 200},
    {"ind": "Paralysis for RSI (age < 10 years)", "pop": "P", "lo": 2, "hi": 2, "u": "mg", "how": "IV", "note": "Max 200 mg. Rocuronium is the paralytic of choice under 10 years", "max": 200}
  ]},
  "Tenecteplase": {"sec": "12.79", "p": 401, "rows": [
    {"ind": "STEMI (weight-banded single bolus)", "pop": "A", "bands": [[60, 30], [70, 35], [80, 40], [90, 45], [null, 50]], "u": "mg", "how": "IV bolus over 5 s", "note": "< 60 kg 30 mg; 60–69 kg 35 mg; 70–79 kg 40 mg; 80–89 kg 45 mg; ≥ 90 kg 50 mg"},
    {"ind": "Ischemic stroke", "pop": "A", "lo": 0.25, "hi": 0.25, "u": "mg", "how": "IV", "note": "Max 25 mg", "max": 25}
  ]},
  "Terbutaline": {"sec": "12.80", "p": 402, "rows": [
    {"ind": "Asthma in extremis", "pop": "P", "lo": 10, "hi": 10, "u": "mcg", "how": "SQ/IM, or IV over 10 min", "note": "Max 400 mcg/dose; may repeat q 20 min PRN, max 3 doses", "max": 400}
  ]},
  "Tranexamic Acid (TXA)": {"sec": "12.82", "p": 404, "rows": [
    {"ind": "Severe trauma likely to need massive transfusion, injury ≤ 2 h", "pop": "P", "lo": 15, "hi": 15, "u": "mg", "how": "in 100 mL NS over 10 min", "note": "Max 1 gram", "max": 1000}
  ]},
  "Vecuronium": {"sec": "12.84", "p": 406, "rows": [
    {"ind": "Paralysis of the intubated patient", "pop": "A", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV", "note": "May repeat PRN"},
    {"ind": "Paralysis of the intubated patient", "pop": "P", "lo": 0.1, "hi": 0.1, "u": "mg", "how": "IV", "note": "Same as adult"}
  ]}
}};
