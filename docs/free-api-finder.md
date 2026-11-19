# Free API / MCP Finder — design (v1, 2026-11-19)

## What it is

A panel in the studio (“Free APIs” in the top nav) that answers one question:
**which video/image APIs and MCP servers can I actually use for free right now,
what is the real limit, and does my key still work?**

It does not promise free generation. Cloud generation always bills per use —
“free” here only ever means a free tier, one-time trial credits, or a local
model on your own GPU. Every entry shows its real limit.

## Data sources (live)

| Source | What the finder does with it | Auth |
|---|---|---|
| Official MCP Registry (`registry.modelcontextprotocol.io/v0.1/servers`) | Live search for MCP servers (default query: `video`). Primary source. | None — unauthenticated, read-only |
| Glama (`glama.ai/api/mcp/v1/connectors`) | Listed as a source; key field in the panel. Live Glama search is a TODO. | Free API key (Bearer) |
| MCPfinder (`mcpfinder.dev`) | Listed as a source + install instructions. Searches 141,396 servers across the Official Registry + Glama with trust scoring and install-ready config. No hosted HTTP endpoint — install locally. | None (local MCP server, AGPL-3.0) |
| FreeAPI list (`AIPMAndy/FreeAPI`, `apis.json`, MIT) | “Load FreeAPI catalog” button fetches the JSON and shows Video / Machine Learning / Art & Design / Photography categories. General APIs, not video-specific. | None |
| Ultimate API List (`kawsarlog/Ultimate-API-List`) | Link-out only — 75,960 APIs in per-category markdown, no single JSON endpoint. | None |

**Not a source: Smithery.** Its API, CLI, accounts and hosted endpoints shut
down Oct 31, 2026; it survives only as a plain directory run by Arcade.

## The gap this fills

None of the above is video-generation-specific, and none tracks whether a
video API’s free tier still exists, what its limit is, or whether a saved key
still works. That is the finder’s job: a curated registry of verified free
video tiers + MCP servers, with per-provider key entry and connection tests.

## Registry (`src/lib/freeProviders.js`)

- `FREE_PROVIDERS` — 26 entries, verified 2026-11-19 from each provider’s own
  docs/pricing page. Kinds: `api` (9 cloud free tiers), `local` (3 no-key apps),
  `local-model` (5 open-weight engines), `mcp` (9 MCP servers).
- `DISCOVERY_SOURCES` — the five live sources above.
- `PAID_ONLY_CHECKED` — providers verified as paid-only (Gemini API, HF
  Inference, Replicate, fal.ai, Together AI) plus Smithery (excluded as a
  source). Shown in the panel so the user can see what was checked.
- Rules enforced by `validateRegistry()` (tested): required fields, valid
  https URLs, and **no entry may contain “unlimited free”**. Amounts a provider
  does not publish are never hard-coded — they are flagged
  (`freeTierVerified: false` + `unverifiedNote`) and shown as “reported, not
  verified”.

## Key entry + test connection

- Keys are saved in `localStorage` (`freeapi_key_<id>`, `freeapi_glama_key`)
  and never leave the browser. Nothing is sent to any server except the test
  itself.
- Test types (all read-only, none spends generation credits):
  - `http` — GET a public endpoint (Muapi: `api.muapi.ai/openapi.json`).
    Reachability only; does not validate the key against a generation endpoint.
  - `openrouter` — key-format check (`sk-or-v1-` + 64 lowercase hex, per
    OpenRouter’s auth docs) + GET of the public models list.
  - `local-http` — is the local service answering on loopback?
    ComfyUI `127.0.0.1:8188`, OpenJutsu `127.0.0.1:3000`.
  - `wangp` — desktop-app check via `window.localAI.wan2gp.check` when available.
- Providers with no verified test endpoint show that plainly instead of a
  fake “Test” button.

## Refresh (v1: manual; scheduled: later)

- **V1:** the “↻ Refresh” button re-queries the Official MCP Registry;
  “Load FreeAPI catalog” re-fetches `apis.json`. The last refresh time and
  result count are stored in `localStorage` (`freeapi_finder_meta`) and shown
  in the header.
- **Later (scheduled re-check):** run the same queries on a timer — in the
  desktop app via the Electron main process, or as a small cron job that
  refreshes a cached snapshot — and surface “changed since last check” (new
  free tier, removed free tier, price change). The registry module already
  exports the query functions (`searchMcpRegistry`, `fetchFreeApiList`) so a
  scheduler can call them without touching the UI.

## Files

- `src/lib/freeProviders.js` — registry, discovery client, key store, tests
- `src/components/FreeApiFinder.js` — panel UI (vanilla DOM, house style)
- `src/components/Header.js` — “Free APIs” nav item
- `src/main.js` — `free-apis` route
- `src/lib/i18n.js` — `nav.freeapis` (en + zh)
- `tests/freeProviders.test.mjs` — 13 tests (`node --test tests/freeProviders.test.mjs`)

## TODO

- Live Glama search (needs the saved Glama key + attribution links per listing).
- Scheduled re-check (see above) + “changed since last check” diff.
- Per-provider balance/usage display where a verified endpoint exists
  (none verified in v1 — do not invent one).
- Re-verify the curated list periodically; free tiers change.
