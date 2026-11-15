# LFN Assistant server (Cloudflare Worker)

The app is a public static site, so the Anthropic API key cannot live in it. This Worker holds the key,
checks an access code, reads the guideline text from the app's own `data.json`, and lets Claude read the
relevant sections before answering. The phone page is `assistant.html` in the repo root.

## How a question flows

1. `assistant.html` sends the question (plus the last few Q&A turns) to `POST /ask` with the access code.
2. The Worker checks the code, loads `data.json` from the live site (refreshed every 6 h, so a new guideline
   version is picked up automatically), and calls Claude with the table of contents in the system prompt.
3. Claude calls `read_sections` / `search_guidelines` (run inside the Worker) to read the sections it needs,
   then answers with `[p. N]` citations. Anything not from the guidelines goes in a labelled
   "General knowledge" section.
4. The page turns `[p. N]` into buttons that open that page in the guideline viewer.

Nothing is logged by the Worker. The Anthropic API does not train on API inputs by default.

## One-time setup (Roy)

1. **Anthropic API account**: sign up at https://platform.claude.com, add a payment method or prepaid credit,
   create an API key, and set a monthly **spend limit** (Settings → Limits). The spend limit is the hard cap
   on cost if the access code ever leaks.
2. **Cloudflare account** (free plan is enough): https://dash.cloudflare.com/sign-up
3. **Create the Worker from this repo**: Workers & Pages → Create → Import a repository → pick `LFN-PCG/PCG`.
   - Root directory: `worker`
   - Branch: the branch this lives on (until it is merged to `main`)
   - Deploy command: `npx wrangler deploy` (the default)
4. **Secrets**: in the Worker → Settings → Variables and Secrets, add two **Secrets**:
   - `ANTHROPIC_API_KEY` = the key from step 1
   - `ACCESS_CODE` = a long passphrase you choose (this is what the phone sends)
5. Copy the Worker URL (e.g. `https://lfn-assistant.<you>.workers.dev`). On the phone open
   `assistant.html`, tap the gear, paste the URL and the access code.

Command-line alternative: `npm install`, `npx wrangler login`, `npx wrangler secret put ANTHROPIC_API_KEY`,
`npx wrangler secret put ACCESS_CODE`, `npx wrangler deploy`.

## Settings (`wrangler.toml`)

- `ALLOWED_ORIGINS`: sites allowed to call the Worker from a browser.
- `DATA_URL`: the guideline index the Worker reads.
- `MODEL`: defaults to `claude-opus-5-5`. `claude-sonnet-5-5` costs half.

## Local test

`.dev.vars` (not committed) can set `ANTHROPIC_API_KEY`, `ACCESS_CODE`, and for offline testing
`ANTHROPIC_BASE_URL` (a mock) and `DATA_URL`. Then `npx wrangler dev`.
