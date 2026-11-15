// Retrieval over the guideline index (data.json) that the app already publishes.
// data.json: { sections: [{num,title,lvl,start,end,chapter}], pages: string[], abbr: {abbr: expansion} }
// `start`/`end` are 1-based PDF page numbers, the same numbers the app's viewer uses.

export interface Section {
  num: string;
  title: string;
  lvl: number;
  start: number;
  end: number;
  chapter: string;
}

export interface GuidelineData {
  sections: Section[];
  pages: string[];
  abbr: Record<string, string>;
}

export function versionOf(d: GuidelineData): string {
  const m = (d.pages[0] || "").match(/Version\s+([\d.]+)/);
  return m ? m[1] : "unknown";
}

/** Compact table of contents for the system prompt. */
export function tableOfContents(d: GuidelineData): string {
  const lines: string[] = [];
  let chapter = "";
  for (const s of d.sections) {
    if (s.chapter !== chapter) {
      chapter = s.chapter;
      lines.push(`\n## ${chapter}`);
    }
    const pages = s.start === s.end ? `p${s.start}` : `p${s.start}-${s.end}`;
    lines.push(`${s.num} ${s.title} (${pages})`);
  }
  return lines.join("\n").trim();
}

function pageText(d: GuidelineData, p: number): string {
  return d.pages[p - 1] ?? "";
}

const MAX_SECTIONS_PER_CALL = 8;

/** Full text of the requested sections, page by page, labelled with PDF page numbers. */
export function readSections(d: GuidelineData, nums: string[]): { text: string; pages: number[] } {
  const out: string[] = [];
  const pages = new Set<number>();
  const wanted = [...new Set(nums.map((n) => String(n).trim()))].slice(0, MAX_SECTIONS_PER_CALL);
  for (const num of wanted) {
    const s = d.sections.find((x) => x.num === num);
    if (!s) {
      out.push(`Section ${num}: not found. Check the table of contents.`);
      continue;
    }
    out.push(`=== Section ${s.num} ${s.title} (${s.chapter}) ===`);
    for (let p = s.start; p <= s.end; p++) {
      out.push(`--- PDF page ${p} ---\n${pageText(d, p)}`);
      pages.add(p);
    }
  }
  if (nums.length > MAX_SECTIONS_PER_CALL) {
    out.push(`(Only the first ${MAX_SECTIONS_PER_CALL} sections were returned. Ask again for the rest if needed.)`);
  }
  return { text: out.join("\n\n"), pages: [...pages] };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.\-/ ]+/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.\-/]+|[.\-/]+$/g, ""))
    .filter((t) => t.length > 1 && !/^[\d.\-/]+$/.test(t)); // drop bare numbers: they match dose tables
}

const STOP = new Set(
  "the and for with what are was this that from into about should when then than have has had will can its not but you your our patient patients pt".split(
    " ",
  ),
);

/** Keyword search across all pages. Returns ranked sections with a snippet. */
export function search(d: GuidelineData, query: string, limit = 10): string {
  let terms = tokenize(query).filter((t) => !STOP.has(t));
  // Expand abbreviations the guidelines define (e.g. "ett" -> "endotracheal tube").
  for (const t of [...terms]) {
    const exp = d.abbr[t];
    if (exp) terms.push(...tokenize(exp).filter((x) => !STOP.has(x)));
  }
  terms = [...new Set(terms)];
  if (terms.length === 0) return "No searchable terms in the query.";

  const lowerPages = d.pages.map((p) => p.toLowerCase());
  const results: { s: Section; score: number; page: number; snippet: string }[] = [];
  for (const s of d.sections) {
    const title = s.title.toLowerCase();
    let score = 0;
    let bestPage = s.start;
    let bestPageScore = -1;
    for (const t of terms) if (title.includes(t)) score += 8;
    for (let p = s.start; p <= s.end; p++) {
      const text = lowerPages[p - 1] ?? "";
      let ps = 0;
      for (const t of terms) {
        let i = text.indexOf(t);
        let n = 0;
        while (i !== -1 && n < 20) {
          n++;
          i = text.indexOf(t, i + t.length);
        }
        if (n) ps += 1 + Math.log2(n);
      }
      score += ps;
      if (ps > bestPageScore) {
        bestPageScore = ps;
        bestPage = p;
      }
    }
    if (score <= 0) continue;
    // Snippet around the first matched term on the best page.
    const raw = pageText(d, bestPage);
    const low = raw.toLowerCase();
    let at = -1;
    for (const t of terms) {
      const i = low.indexOf(t);
      if (i !== -1 && (at === -1 || i < at)) at = i;
    }
    const snippet =
      at === -1 ? raw.slice(0, 160) : raw.slice(Math.max(0, at - 80), at + 160);
    results.push({ s, score, page: bestPage, snippet: snippet.replace(/\s+/g, " ").trim() });
  }
  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, limit);
  if (top.length === 0) return `No matches for: ${terms.join(", ")}`;
  return top
    .map((r) => `${r.s.num} ${r.s.title} (best match PDF page ${r.page}): …${r.snippet}…`)
    .join("\n");
}
