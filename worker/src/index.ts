// LFN Companion assistant proxy (Cloudflare Worker).
// Holds the Anthropic API key, checks an access code, retrieves guideline text
// and lets Claude read the sections it needs before answering.

import Anthropic from "@anthropic-ai/sdk";
import { GuidelineData, readSections, search, tableOfContents, versionOf } from "./guidelines";

export interface Env {
  ANTHROPIC_API_KEY: string; // secret: wrangler secret put ANTHROPIC_API_KEY
  ACCESS_CODE: string; // secret: wrangler secret put ACCESS_CODE
  ALLOWED_ORIGINS: string; // comma-separated, set in wrangler.toml
  DATA_URL: string; // the app's published data.json
  MODEL?: string; // optional override, defaults to claude-opus-5-5
  ANTHROPIC_BASE_URL?: string; // only for local testing against a mock
}

const DEFAULT_MODEL = "claude-opus-5-5";
const MAX_TOOL_ROUNDS = 4;
const MAX_QUESTION_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 6;

// USD per million tokens, for the per-question cost shown in the app. Update if pricing changes.
const PRICES: Record<string, { in: number; out: number; cacheWrite: number; cacheRead: number }> = {
  "claude-opus-5-5": { in: 4, out: 20, cacheWrite: 5, cacheRead: 0.2 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheWrite: 2.5, cacheRead: 0.1 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
};

let cached: { data: GuidelineData; at: number; system: string } | null = null;

async function loadGuidelines(env: Env): Promise<{ data: GuidelineData; system: string }> {
  // Re-fetch at most every 6 hours so a new guideline version is picked up automatically.
  if (cached && Date.now() - cached.at < 6 * 3600_000) return cached;
  const res = await fetch(env.DATA_URL, { cf: { cacheTtl: 3600 } } as RequestInit);
  if (!res.ok) throw new Error(`Could not load guidelines (${res.status})`);
  const data = (await res.json()) as GuidelineData;
  cached = { data, at: Date.now(), system: buildSystemPrompt(data) };
  return cached;
}

function buildSystemPrompt(d: GuidelineData): string {
  return `You are a decision-support assistant for a critical care transport (flight and ground) clinician at Life Flight Network. The clinician is a trained professional preparing for or managing a transport, usually reading on a phone, sometimes in a moving vehicle.

Your source of truth is the organization's Patient Care Guidelines, version ${versionOf(d)}. The table of contents is below. You do not have the text yet: use read_sections to read every section relevant to the question (usually 2 to 6, including related drug monographs in chapter 12 and general transport sections), and search_guidelines when you are not sure where a topic lives. Read before you answer; never quote doses, thresholds or steps from memory when the guidelines cover them.

How to answer:
- Lead with what matters most for this transport: the key risks, what to prepare or have drawn up, monitoring and targets, and the triggers that change management. Then the details.
- Keep it scannable: short headings and bullets, no long paragraphs. Aim for what fits on two or three phone screens.
- Every fact taken from the guidelines gets a page citation in this exact form: [p. 149] or [p. 149-150], using the PDF page numbers shown in the text you read. Quote doses, concentrations, rates and limits exactly as written.
- Anything not from the guidelines (general medical knowledge, physiology, common practice) goes in a separate final section titled "General knowledge (not from LFN guidelines)". Never mix it into the cited sections, and never present it as protocol.
- If the guidelines say to contact medical control (OLMC/physician) or require an order for something, say so.
- If the guidelines do not cover something, say that plainly instead of filling the gap.
- If the question is ambiguous in a way that changes management, answer the most likely reading and state your assumption in one line.
- Do not ask for or repeat patient names, dates of birth, record numbers or other identifiers. If the clinician includes any, do not repeat them.
- You support, and do not replace, the clinician's judgment, the guidelines themselves and medical control. Do not add a disclaimer; the app shows one.

TABLE OF CONTENTS (section number, title, PDF pages)
${tableOfContents(d)}`;
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_sections",
    description:
      "Return the full text of guideline sections by section number (e.g. \"6.07\", \"12.49\"), page by page with PDF page numbers. Up to 8 sections per call. Request every section you need in one call where possible.",
    input_schema: {
      type: "object",
      properties: {
        nums: { type: "array", items: { type: "string" }, description: "Section numbers from the table of contents" },
      },
      required: ["nums"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "search_guidelines",
    description:
      "Keyword search across the full guideline text. Returns the best-matching sections with a snippet and page. Use it when a topic is not obvious from the table of contents (for example a drug mentioned inside other protocols).",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "A few keywords, e.g. \"magnesium toxicity calcium gluconate\"" } },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
];

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0 && a.length > 0;
}

interface AskBody {
  question?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

function costOf(model: string, u: Anthropic.Beta.BetaUsage): number {
  const p = PRICES[model] ?? PRICES[DEFAULT_MODEL];
  return (
    ((u.input_tokens ?? 0) * p.in +
      (u.output_tokens ?? 0) * p.out +
      (u.cache_creation_input_tokens ?? 0) * p.cacheWrite +
      (u.cache_read_input_tokens ?? 0) * p.cacheRead) /
    1_000_000
  );
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    if (req.method !== "POST" || url.pathname !== "/ask") return json({ error: "Not found" }, 404, h);

    const auth = req.headers.get("Authorization") || "";
    const code = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!safeEqual(code, env.ACCESS_CODE || "")) return json({ error: "Wrong access code." }, 401, h);

    let body: AskBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Bad request." }, 400, h);
    }
    const question = (body.question || "").trim();
    if (!question) return json({ error: "Empty question." }, 400, h);
    if (question.length > MAX_QUESTION_CHARS) return json({ error: "Question is too long." }, 400, h);

    const model = env.MODEL || DEFAULT_MODEL;
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined });

    try {
      const { data, system } = await loadGuidelines(env);

      // Earlier Q&A in this conversation, text only, trimmed.
      const history: Anthropic.Beta.BetaMessageParam[] = (body.history || [])
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));
      while (history.length && history[0].role !== "user") history.shift();
      if (history.length && history[history.length - 1].role === "user") history.pop();

      const messages: Anthropic.Beta.BetaMessageParam[] = [...history, { role: "user", content: question }];
      const pagesRead = new Set<number>();
      let cost = 0;
      let answer = "";

      for (let round = 0; ; round++) {
        const lastRound = round >= MAX_TOOL_ROUNDS;
        const response = await client.beta.messages.create({
          model,
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          cache_control: { type: "ephemeral" },
          output_config: { effort: "medium" },
          system,
          tools: TOOLS,
          tool_choice: lastRound ? { type: "none" } : { type: "auto" },
          messages,
        });
        cost += costOf(model, response.usage);

        if (response.stop_reason === "refusal") {
          return json({ error: "The model declined to answer this question. Try rephrasing it." }, 200, h);
        }

        const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
        if (response.stop_reason !== "tool_use" || toolUses.length === 0 || lastRound) {
          answer = response.content
            .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
            .map((b) => b.text)
            .join("\n")
            .trim();
          if (response.stop_reason === "max_tokens") answer += "\n\n(Answer was cut off. Ask a narrower question.)";
          break;
        }

        messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((t) => {
          const input = t.input as { nums?: unknown; query?: unknown };
          if (t.name === "read_sections" && Array.isArray(input.nums)) {
            const r = readSections(data, input.nums.map(String));
            r.pages.forEach((p) => pagesRead.add(p));
            return { type: "tool_result", tool_use_id: t.id, content: r.text };
          }
          if (t.name === "search_guidelines" && typeof input.query === "string") {
            return { type: "tool_result", tool_use_id: t.id, content: search(data, input.query) };
          }
          return { type: "tool_result", tool_use_id: t.id, content: "Invalid tool input.", is_error: true };
        });
        messages.push({ role: "user", content: results });
      }

      return json(
        {
          answer: answer || "No answer was returned. Try again.",
          version: versionOf(data),
          model,
          pagesRead: [...pagesRead].sort((a, b) => a - b),
          costUsd: Math.round(cost * 10000) / 10000,
        },
        200,
        h,
      );
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) return json({ error: "Server API key is invalid." }, 502, h);
      if (err instanceof Anthropic.RateLimitError) return json({ error: "Rate limited. Try again in a minute." }, 429, h);
      if (err instanceof Anthropic.APIError) return json({ error: `AI service error (${err.status}).` }, 502, h);
      return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500, h);
    }
  },
};
