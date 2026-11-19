// Free API / MCP Finder — provider registry and discovery client.
//
// Single source of truth for the finder panel (src/components/FreeApiFinder.js).
// Every free-tier claim in FREE_PROVIDERS was verified against the provider's
// own docs or pricing page on 2026-11-19. Amounts the provider does not publish
// are NOT hard-coded — they are flagged in `unverifiedNote` and shown in the UI
// as "reported, not verified". Paid-only providers live in PAID_ONLY_CHECKED
// (excluded from the free list, listed so the user can see what was checked).
//
// Honest constraint: cloud generation always bills per use. In this registry
// "free" only ever means a free tier, one-time trial credits, or a local model
// running on your own GPU. No entry promises unlimited free generation.

export const REGISTRY_VERSION = '2026-11-19';
export const REGISTRY_API_BASE = 'https://registry.modelcontextprotocol.io';
export const REGISTRY_API_VERSION = 'v0.1';

// ── Discovery sources ───────────────────────────────────────────────────────
// Live sources the finder queries (or links out to). Smithery is deliberately
// NOT a source: its API, CLI, accounts and hosted endpoints shut down on
// 31 October 2026 (confirmed by MCPfinder's own changelog).
export const DISCOVERY_SOURCES = [
    {
        id: 'official-mcp-registry',
        name: 'Official MCP Registry',
        url: 'https://registry.modelcontextprotocol.io',
        apiBase: 'https://registry.modelcontextprotocol.io/v0.1/servers',
        auth: 'None — unauthenticated, read-only',
        liveQuery: true,
        note: 'Canonical source. Search with ?search=<query>&limit=<n>; cursor pagination. Still in preview — no uptime or data-durability guarantees.',
    },
    {
        id: 'glama',
        name: 'Glama MCP Directory',
        url: 'https://glama.ai/mcp',
        apiBase: 'https://glama.ai/api/mcp/v1/connectors',
        auth: 'Free API key (Bearer) required for directory reads',
        liveQuery: false,
        note: 'Largest directory (50k+ servers) with quality/security grades. Attribution required: every listing shown must link back to its Glama page.',
    },
    {
        id: 'mcpfinder',
        name: 'MCPfinder',
        url: 'https://mcpfinder.dev',
        apiBase: null,
        auth: 'None — local MCP server (AGPL-3.0)',
        liveQuery: false,
        note: 'Searches 141,396 servers across the Official Registry + Glama with trust scoring (confidenceScore, warning flags) and install-ready config. No hosted HTTP endpoint — install it locally. Snapshot manifest: https://mcpfinder.dev/api/v1/snapshot/manifest.json',
    },
    {
        id: 'freeapi-list',
        name: 'FreeAPI (AIPMAndy)',
        url: 'https://github.com/AIPMAndy/FreeAPI',
        apiBase: 'https://raw.githubusercontent.com/AIPMAndy/FreeAPI/main/apis.json',
        auth: 'None',
        liveQuery: true,
        note: '1,092 general free APIs as machine-readable JSON (MIT), including a Video category (25 APIs). General APIs, not video-generation-specific — browse, then verify each entry before trusting it.',
    },
    {
        id: 'ultimate-api-list',
        name: 'Ultimate API List (kawsarlog)',
        url: 'https://github.com/kawsarlog/Ultimate-API-List',
        apiBase: null,
        auth: 'None',
        liveQuery: false,
        note: '75,960 APIs in per-category markdown (Videos: 4,681; MCP servers: 3,045; AI: 12,500). Browse-only source — no single JSON endpoint.',
    },
];

// ── Curated free providers ──────────────────────────────────────────────────
// kind: 'api' (cloud, key) | 'local' (local app/service, no key) |
//       'local-model' (open weights, not a service) | 'mcp' (MCP server)
// test: null (no verified test endpoint — UI says so) or
//   { type: 'http', url, keyHeader }           — GET, no generation spent
//   { type: 'openrouter', }                    — key-format + public models list
//   { type: 'local-http', url }                — is the local service running?
//   { type: 'wangp' }                          — desktop-app WanGP check
export const FREE_PROVIDERS = [
    // ── Cloud free tiers ──────────────────────────────────────────────────
    {
        id: 'muapi',
        name: 'Muapi',
        kind: 'api',
        media: ['video', 'image'],
        description: 'The studio’s own provider — 250+ models behind one key.',
        models: ['Veo 3.1', 'Seedance 2 / 2.5', 'Grok Video', 'Nano Banana Pro', 'GPT Image 2', 'Z-Image Turbo'],
        freeTier: 'Free credits on signup — amount not published on Muapi’s own pages. Sandbox key is free but returns mock results only. Paid credits never expire.',
        freeTierVerified: true,
        costNote: 'Top up from $10; no free refill. Failed generations are not charged.',
        keyUrl: 'https://muapi.ai',
        sourceUrl: 'https://muapi.ai/veo3-pricing',
        flags: ['already-integrated'],
        test: { type: 'http', url: 'https://api.muapi.ai/openapi.json', note: 'Reachability only — does not spend credits or validate the key against a generation endpoint.' },
    },
    {
        id: 'runway',
        name: 'Runway',
        kind: 'api',
        media: ['video', 'image'],
        description: 'Gen-4.5 video, Aleph editing, Act-Two. Free plan is a one-time grant.',
        models: ['Gen-4.5', 'Gen-4 Turbo', 'Gen-4 Image', 'Nano Banana Pro', 'Aleph 2.0', 'Act-Two'],
        freeTier: '125 credits, one time — never expire, never refresh. About 10 seconds of Gen-4.5 video (12 credits/sec).',
        freeTierVerified: true,
        costNote: 'Free accounts cannot buy more credits; Standard is $15/mo for 625 credits/mo.',
        keyUrl: 'https://runway.com',
        sourceUrl: 'https://runway.com/pricing',
        flags: [],
        test: null,
    },
    {
        id: 'kling',
        name: 'Kling AI',
        kind: 'api',
        media: ['video', 'image'],
        description: 'Kling video + image generation. Free plan exists; the amount is not published.',
        models: ['Kling 3.0 / 3.0 Omni', 'Video O1', 'Kling 2.6', 'Image 3.0 Omni'],
        freeTier: 'Free plan with signup credits and monthly login credits — amount not published on Kling’s own pages. Free output is watermarked, 720p cap, non-commercial.',
        freeTierVerified: false,
        unverifiedNote: 'Third-party trackers widely report 66 free credits/day — not published on Kling’s own pages, so the finder does not treat it as fact.',
        costNote: 'The developer API is paid-only (from $0.084/s standard).',
        keyUrl: 'https://kling.ai',
        sourceUrl: 'https://kling.ai/llms.txt',
        flags: [],
        test: null,
    },
    {
        id: 'hailuo',
        name: 'MiniMax / Hailuo',
        kind: 'api',
        media: ['video'],
        description: 'MiniMax H3 and Hailuo video models on the web editor.',
        models: ['MiniMax H3', 'H3 Max', 'Hailuo 2.3 / 2.0 / 1.0'],
        freeTier: 'One-time welcome credits on signup — expire 3 days after grant. 0 credits/month after that. Free downloads carry a watermark.',
        freeTierVerified: true,
        costNote: 'No recurring free credits. Standard is $14.99/mo for 1,000 credits/mo.',
        keyUrl: 'https://hailuoai.video',
        sourceUrl: 'https://hailuoai.video/doc/payment-policy.html',
        flags: [],
        test: null,
    },
    {
        id: 'kie',
        name: 'kie.ai',
        kind: 'api',
        media: ['video', 'image'],
        description: 'Aggregator reselling Veo, Kling, Wan, Seedance and more through one key.',
        models: ['Veo 3.1', 'Kling 3.0 / 4.0', 'Wan 3.0', 'Seedance 2.5', 'Nano Banana 2 / Pro', 'GPT Image 2'],
        freeTier: '80 free credits on signup (≈$0.40) — about 1 Veo 3.1 Fast clip, ~5s of Kling 3.0, or ~10 Nano Banana 2 images. No ongoing free plan. Purchased credits never expire.',
        freeTierVerified: true,
        costNote: 'Top-ups from ~$5.',
        keyUrl: 'https://kie.ai',
        sourceUrl: 'https://kie.ai/',
        flags: ['reseller'],
        test: null,
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        kind: 'api',
        media: ['image'],
        description: 'One key for many models. Free :free models for text; one free image model. Video is paid-only.',
        models: ['Recraft V4.1 Flash V2 (free image)', 'Veo 3.1, Sora 2 Pro, Wan 3.0, Kling v3.0 (video — paid)'],
        freeTier: ':free models — 50 requests/day, 20 RPM, no card required. Recraft V4.1 Flash V2 image is $0 (released Nov 13, 2026 — may be temporary). Video is paid-only.',
        freeTierVerified: true,
        costNote: 'Video draws on credit balance; 5.5% fee on credit purchases.',
        keyUrl: 'https://openrouter.ai',
        sourceUrl: 'https://openrouter.ai/recraft/recraft-v4.1-flash-v2:free',
        flags: [],
        test: { type: 'openrouter' },
    },
    {
        id: 'pollinations',
        name: 'Pollinations',
        kind: 'api',
        media: ['image', 'video'],
        description: 'Image, video, text, audio and 3D through one API with Pollen billing.',
        models: ['FLUX variants and ~84 image/video models (per third-party catalogs — not verified from official docs)'],
        freeTier: 'Quest Pollen — small one-off rewards for dashboard quests. The legacy no-key endpoint’s status is unconfirmed; do not rely on it.',
        freeTierVerified: false,
        unverifiedNote: 'The ~3 Pollen total figure comes from a third-party writeup, not Pollinations’ own docs.',
        costNote: '1 Pollen ≈ $1; top up to continue.',
        keyUrl: 'https://enter.pollinations.ai',
        sourceUrl: 'https://pollinations.ai/docs',
        flags: [],
        test: null,
    },
    {
        id: 'luma',
        name: 'Luma',
        kind: 'api',
        media: ['video', 'image'],
        description: 'Ray video, Seedance, Kling, Veo and more in one studio.',
        models: ['Ray 3.2 / 3.14', 'Seedance 2.5', 'Kling 4.0', 'Veo 3.1'],
        freeTier: 'Free trial credits only — count and duration are not published on Luma’s pricing page; no $0 plan is listed.',
        freeTierVerified: false,
        costNote: 'Plus is $30/mo (10,000 credits); Ray 3.2 5s 720p = 100 credits.',
        keyUrl: 'https://lumalabs.ai',
        sourceUrl: 'https://lumalabs.ai/pricing',
        flags: [],
        test: null,
    },
    {
        id: 'pika',
        name: 'Pika',
        kind: 'api',
        media: ['video', 'image'],
        description: 'Pika H3 plus hosted Seedance, Kling, Veo, Wan and more.',
        models: ['Pika H3 Flex', 'Seedance 2.5', 'Kling 4.0', 'Veo 3.1', 'Wan 3.0'],
        freeTier: 'Free account with 0 monthly credits — generation requires a paid credit pack (from $25 for 1,500 credits).',
        freeTierVerified: true,
        costNote: 'Starter is $10/mo (600 credits/mo); top-up credits expire in 365 days.',
        keyUrl: 'https://pika.art',
        sourceUrl: 'https://pika.art/pricing',
        flags: [],
        test: null,
    },
    // ── Local, no key, $0 per job ─────────────────────────────────────────
    {
        id: 'wangp',
        name: 'WanGP (formerly Wan2GP)',
        kind: 'local',
        media: ['video', 'image'],
        description: 'Local Gradio super-app for open generative models — video, image, audio, 3D. Already integrated in this studio; this entry surfaces what’s new.',
        models: ['Wan 2.1 / 2.2', 'MiniMax H3', 'LTX-2 / 2.3 / 2.5', 'HunyuanVideo 1 / 1.5', 'LongCat', 'Flux', 'Qwen Image'],
        freeTier: '$0 per job — runs on your own GPU; select models from 4 GB VRAM. Built-in MCP interface; H3 character swap (Genjutsu-style).',
        freeTierVerified: true,
        costNote: 'No key, no credits — your hardware is the only cost. Custom community license (not a standard OSS license) — verify before redistributing.',
        keyUrl: 'https://github.com/deepbeepmeep/WanGP',
        sourceUrl: 'https://github.com/deepbeepmeep/WanGP',
        flags: ['already-integrated', 'license-note'],
        test: { type: 'wangp' },
    },
    {
        id: 'comfyui',
        name: 'ComfyUI',
        kind: 'local',
        media: ['video', 'image'],
        description: 'Free local node-graph engine for open diffusion models. Runs fully offline.',
        models: ['Wan 2.1 / 2.2', 'LTX-Video 2 / 2.3', 'HunyuanVideo 1.5', 'Kandinsky 5 Video', 'CogVideoX', 'Mochi'],
        freeTier: '$0 per job — runs on your own GPU; as low as 4 GB VRAM + 8 GB RAM. GPL-3.0. (Built-in partner nodes for paid cloud APIs are separate — the local open-model path is the no-key one.)',
        freeTierVerified: true,
        costNote: 'No key, no credits — your hardware is the only cost.',
        keyUrl: 'https://github.com/comfyanonymous/ComfyUI',
        sourceUrl: 'https://github.com/comfyanonymous/ComfyUI',
        flags: [],
        test: { type: 'local-http', url: 'http://127.0.0.1:8188/', label: 'ComfyUI on 127.0.0.1:8188' },
    },
    {
        id: 'openjutsu',
        name: 'OpenJutsu',
        kind: 'local',
        media: ['video'],
        description: 'One-click character swap for videos — open-source Genjutsu alternative built on ComfyUI + MiniMax H3.',
        models: ['MiniMax H3 (video)', 'FLUX.3 Klein (relighting)', 'SAM 3.1 (tracking)'],
        freeTier: '$0 per job on your own NVIDIA GPU (tested on RTX 4060 Ti 16 GB). MIT.',
        freeTierVerified: true,
        costNote: 'NVIDIA GPU only. A 6s 480p clip takes ~6–13 min on a 4060 Ti.',
        keyUrl: 'https://github.com/D3voz/openjutsu',
        sourceUrl: 'https://github.com/D3voz/openjutsu',
        flags: [],
        test: { type: 'local-http', url: 'http://127.0.0.1:3000/', label: 'OpenJutsu on 127.0.0.1:3000' },
    },
    // ── Open-weight engines (download once, run locally) ───────────────────
    {
        id: 'ltx2',
        name: 'LTX-2 / LTX-2.5 (Lightricks)',
        kind: 'local-model',
        media: ['video'],
        description: 'Open-weight video model with synchronized audio+video in one pass, up to 4K/50fps. LTX-Video repo is legacy — LTX-2.5 is current.',
        models: ['LTX-2.5 (22B, recommended)', 'LTX-2', 'LTX-Video 0.9.x (legacy)'],
        freeTier: 'Open weights — $0 per job on your own GPU. Full distilled pack ≈66 GiB download; fp8 + offload for tight memory. Code Apache-2.0; weights under the LTX Community License.',
        freeTierVerified: true,
        costNote: 'Gated Hugging Face download (free account + accept terms).',
        keyUrl: 'https://github.com/Lightricks/LTX-2',
        sourceUrl: 'https://github.com/Lightricks/LTX-2',
        flags: [],
        test: null,
    },
    {
        id: 'wan22',
        name: 'Wan 2.2 (Alibaba)',
        kind: 'local-model',
        media: ['video'],
        description: 'Open large-scale video models — text-to-video, image-to-video, speech-to-video, character animation.',
        models: ['TI2V-5B (720p/24fps)', 'T2V-A14B / I2V-A14B', 'S2V-14B', 'Animate-14B'],
        freeTier: 'Open weights, Apache-2.0 — $0 per job. TI2V-5B runs on consumer cards (e.g. RTX 4090); T2V-A14B needs ~80 GB VRAM.',
        freeTierVerified: true,
        costNote: 'Weights download from Hugging Face (free account).',
        keyUrl: 'https://github.com/Wan-Video/Wan2.2',
        sourceUrl: 'https://github.com/Wan-Video/Wan2.2',
        flags: [],
        test: null,
    },
    {
        id: 'hunyuanvideo',
        name: 'HunyuanVideo-1.5 (Tencent)',
        kind: 'local-model',
        media: ['video'],
        description: '8.3B-parameter DiT for text-to-video and image-to-video, 480p/720p (+1080p super-resolution).',
        models: ['HunyuanVideo-1.5 (8.3B)', 'Step-distilled 480p variants'],
        freeTier: 'Open weights — $0 per job. Minimum 14 GB VRAM with offloading.',
        freeTierVerified: true,
        costNote: 'Tencent Hunyuan Community License — read it before commercial use.',
        keyUrl: 'https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5',
        sourceUrl: 'https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5',
        flags: ['license-note'],
        test: null,
    },
    {
        id: 'cogvideox',
        name: 'CogVideoX (Zhipu AI)',
        kind: 'local-model',
        media: ['video'],
        description: 'Text/image-to-video + video continuation. The lightest open video model here.',
        models: ['CogVideoX-2B', 'CogVideoX-5B', 'CogVideoX1.5-5B (1360×768, 10s)'],
        freeTier: 'Open weights — $0 per job. CogVideoX-2B from 4 GB VRAM (diffusers FP16); code Apache-2.0, 2B weights Apache-2.0.',
        freeTierVerified: true,
        costNote: '5B weights are under a separate model license — read it before commercial use.',
        keyUrl: 'https://github.com/zai-org/CogVideo',
        sourceUrl: 'https://github.com/zai-org/CogVideo',
        flags: [],
        test: null,
    },
    {
        id: 'mochi',
        name: 'Mochi 1 (Genmo)',
        kind: 'local-model',
        media: ['video'],
        description: '10B text-to-video research preview, 480p. Older and weaker than Wan 2.2 / LTX-2.5 — included for completeness.',
        models: ['Mochi 1 (10B AsymmDiT)'],
        freeTier: 'Open weights, Apache-2.0 — $0 per job. ~60 GB VRAM native; under 20 GB via ComfyUI.',
        freeTierVerified: true,
        costNote: 'Weights download from Hugging Face (free account).',
        keyUrl: 'https://github.com/genmoai/mochi',
        sourceUrl: 'https://github.com/genmoai/mochi',
        flags: [],
        test: null,
    },
    // ── MCP servers (plug-in surface — keyed unless noted) ─────────────────
    {
        id: 'muapi-mcp',
        name: 'muapi MCP server',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'This studio’s own provider as an MCP server — 100+ generative models, 19 tools.',
        models: ['Veo 3', 'Kling', 'Wan 2.1/2.2', 'Seedance', 'Hunyuan', 'Runway', 'PixVerse', 'MiniMax'],
        freeTier: 'Pay-per-generation; API key required — not free.',
        freeTierVerified: true,
        costNote: 'Hosted: https://api.muapi.ai/mcp (Bearer key). Self-host: github.com/SamurAIGPT/muapi-mcp-server (MIT).',
        keyUrl: 'https://github.com/SamurAIGPT/muapi-mcp-server',
        sourceUrl: 'https://muapi.ai/docs/mcp',
        flags: ['already-integrated'],
        test: null,
    },
    {
        id: 'replicate-mcp',
        name: 'Replicate MCP (official)',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Official Replicate MCP — search, compare and run thousands of models from any MCP client.',
        models: ['Kling', 'Wan 2.2', 'MiniMax', 'Hunyuan', 'Luma Ray', 'Grok Video', 'Seedance'],
        freeTier: 'Pay-per-run; API token required — not free.',
        freeTierVerified: true,
        costNote: 'Hosted: https://mcp.replicate.com/sse. Local: npx -y replicate-mcp with REPLICATE_API_TOKEN.',
        keyUrl: 'https://mcp.replicate.com/',
        sourceUrl: 'https://replicate.com/docs/reference/mcp',
        flags: [],
        test: null,
    },
    {
        id: 'fal-mcp',
        name: 'fal MCP (community)',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Community MCP server for fal.ai — 18 tools, 600+ models via dynamic discovery.',
        models: ['Kling', 'Veo 3.1', 'Wan 2.5/3.0', 'Seedance 2.5', 'MiniMax H3', 'Grok Imagine'],
        freeTier: 'Pay-per-model; FAL_KEY required — not free. Community server, not made by fal.',
        freeTierVerified: true,
        costNote: 'Connect: uvx --from fal-mcp-server fal-mcp (or Docker ghcr.io/raveenb/fal-mcp-server).',
        keyUrl: 'https://github.com/raveenb/fal-mcp-server',
        sourceUrl: 'https://github.com/raveenb/fal-mcp-server',
        flags: ['community'],
        test: null,
    },
    {
        id: 'runway-mcp',
        name: 'Runway MCP (hosted)',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Runway’s hosted MCP — video, image, audio, editing. Self-hosted repo is archived.',
        models: ['Seedance 2 (video)', 'Aleph 2 (editing)', 'Nano Banana Pro (images)'],
        freeTier: 'Bills Runway credits; key required — not free.',
        freeTierVerified: true,
        costNote: 'Hosted: https://mcp.runwayml.com/mcp (OAuth). Self-hosted repo archived 2026-09-30 — use the hosted route.',
        keyUrl: 'https://docs.dev.runwayml.com',
        sourceUrl: 'https://github.com/runwayml/runway-api-mcp-server',
        flags: ['repo-archived'],
        test: null,
    },
    {
        id: 'kling-mcp',
        name: 'Kling MCP (hosted)',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Kling’s first-party hosted MCP — image/video generation and task queries.',
        models: ['Kling video + image models (remote service)'],
        freeTier: 'Paid workspace credits; OAuth sign-in — not free.',
        freeTierVerified: true,
        costNote: 'No local server to install. Global endpoint: https://kling.ai/mcp/plugin (China: https://klingai.com/mcp/plugin).',
        keyUrl: 'https://github.com/klingai-tech/claude-plugin',
        sourceUrl: 'https://github.com/klingai-tech/claude-plugin',
        flags: [],
        test: null,
    },
    {
        id: 'comfy-mcp',
        name: 'Comfy MCP (official)',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Official local MCP server for ComfyUI — run your local ComfyUI from AI agents. 42 tools.',
        models: ['Whatever your local ComfyUI runs (Wan, LTX, HunyuanVideo, Mochi, CogVideoX…)'],
        freeTier: '$0 per job on your own ComfyUI — no key. AGPL-3.0.',
        freeTierVerified: true,
        costNote: 'Local: pip install comfy-mcp. Hosted Comfy Cloud MCP exists too (paid cloud GPUs).',
        keyUrl: 'https://github.com/Comfy-Org/comfy-mcp',
        sourceUrl: 'https://github.com/Comfy-Org/comfy-mcp',
        flags: [],
        test: null,
    },
    {
        id: 'ai-media-router',
        name: 'AI Media Router',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Open-source multi-provider MCP — Seedance, Kling, Veo, Wan, FLUX and more across 43 providers, with price comparison before spending. One Rust binary.',
        models: ['fal, Replicate, kie.ai, OpenRouter, Kling, Gemini/Veo, MiniMax, Runway, Luma, LTX, PixVerse, Vidu, xAI, Higgsfield, ComfyUI ($0/job)'],
        freeTier: 'Your own provider keys — you pay each provider, no middleman markup. ComfyUI provider is $0/job.',
        freeTierVerified: true,
        costNote: 'Very new (created 2026-11-01, 3 stars); README says some provider specs are not yet checked against a live response.',
        keyUrl: 'https://github.com/jutsuhq/ai-media-router',
        sourceUrl: 'https://github.com/jutsuhq/ai-media-router',
        flags: ['new'],
        test: null,
    },
    {
        id: 'picsart-mcp',
        name: 'Picsart MCP (hosted)',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Picsart’s hosted MCP — 103 video models / 262 models from 32 providers as MCP tools.',
        models: ['Seedance 2.5/2.0', 'Veo 3.1', 'Kling V3', 'Runway', 'Luma Ray 3.2', 'Wan', 'Hailuo', 'HeyGen'],
        freeTier: 'Spends Picsart account credits — not free.',
        freeTierVerified: true,
        costNote: 'Hosted, nothing to install, no API key: https://api.picsart.com/gen-ai/mcp (OAuth sign-in on first connect).',
        keyUrl: 'https://picsart.github.io/picsart-mcp-cli-docs/guide/mcp-quickstart',
        sourceUrl: 'https://picsart.github.io/picsart-mcp-cli-docs/guide/mcp-quickstart',
        flags: [],
        test: null,
    },
    {
        id: 'luma-mcp',
        name: 'Luma API MCP (official, stale)',
        kind: 'mcp',
        media: ['video', 'image'],
        description: 'Luma’s own MCP server: Ray video + Photon image models. Stale — last updated 2025-04-17.',
        models: ['Ray 2 / Ray Flash 2 / Ray 1.6', 'Photon 1 / Photon Flash 1'],
        freeTier: 'Billed per job on the Luma account — not free.',
        freeTierVerified: true,
        costNote: 'No Ray 3 / Ray 3.2 support. Luma has since moved to an Agents API with no MCP for it — use only for legacy Ray 2-era models.',
        keyUrl: 'https://github.com/lumalabs/luma-api-mcp',
        sourceUrl: 'https://github.com/lumalabs/luma-api-mcp',
        flags: ['stale'],
        test: null,
    },
];

// ── Checked, paid-only — excluded from the free list ───────────────────────
// Shown in the panel as "checked, no free tier" so the user can see the work.
export const PAID_ONLY_CHECKED = [
    { name: 'Google Gemini API', reason: 'Video/image paid-only — free tier listed as “Not available” for Veo 3.1, Imagen and Nano Banana.', sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing' },
    { name: 'Hugging Face Inference Providers', reason: 'Free users get $0 inference credits — must purchase credits to call any model.', sourceUrl: 'https://huggingface.co/docs/inference-providers/pricing' },
    { name: 'Replicate', reason: 'No published free tier or trial credit amount — pay-per-use only.', sourceUrl: 'https://replicate.com/pricing' },
    { name: 'fal.ai', reason: 'No standing free tier — occasional promo free runs only, no fixed allowance.', sourceUrl: 'https://fal.ai/pricing' },
    { name: 'Together AI', reason: 'No free trial — $15 minimum first purchase before you can create a key.', sourceUrl: 'https://docs.together.ai/docs/billing' },
    { name: 'Smithery', reason: 'Excluded as a source: API, CLI, accounts and hosted endpoints shut down Oct 31, 2026. Survives only as a plain directory.', sourceUrl: 'https://mcpfinder.dev' },
];

// ── Registry validation ─────────────────────────────────────────────────────
const REQUIRED_FIELDS = ['id', 'name', 'kind', 'media', 'description', 'freeTier', 'keyUrl', 'sourceUrl'];

export function validateRegistry() {
    const errors = [];
    const ids = new Set();
    for (const p of FREE_PROVIDERS) {
        for (const f of REQUIRED_FIELDS) {
            if (p[f] === undefined || p[f] === null || p[f] === '') errors.push(`${p.id || '?'}: missing ${f}`);
        }
        if (ids.has(p.id)) errors.push(`${p.id}: duplicate id`);
        ids.add(p.id);
        if (!['api', 'local', 'local-model', 'mcp'].includes(p.kind)) errors.push(`${p.id}: bad kind ${p.kind}`);
        if (!Array.isArray(p.media) || p.media.length === 0) errors.push(`${p.id}: media must be a non-empty array`);
        if (/unlimited free/i.test(p.freeTier)) errors.push(`${p.id}: freeTier must never promise unlimited free generation`);
        if (typeof p.freeTierVerified !== 'boolean') errors.push(`${p.id}: freeTierVerified must be boolean`);
        for (const u of [p.keyUrl, p.sourceUrl]) {
            if (typeof u !== 'string' || !/^https:\/\//.test(u)) errors.push(`${p.id}: bad URL ${u}`);
        }
    }
    for (const s of DISCOVERY_SOURCES) {
        if (!s.id || !s.name || !/^https:\/\//.test(s.url)) errors.push(`discovery source ${s.id || '?'}: bad id/name/url`);
    }
    return errors;
}

export function getProviderById(id) {
    return FREE_PROVIDERS.find((p) => p.id === id) || null;
}

export function providersByKind(kind) {
    return FREE_PROVIDERS.filter((p) => p.kind === kind);
}

// ── Official MCP Registry discovery ─────────────────────────────────────────
// GET {apiBase}?search=<q>&limit=<n> — unauthenticated, cursor pagination.
// Response shape (verified live 2026-11-19):
// { servers: [ { server: { name, title, description, version, websiteUrl,
//   repository: { url }, packages: [{ identifier, transport }], remotes: [{ url, headers }] },
//   _meta: { 'io.modelcontextprotocol.registry/official': { status, isLatest } } } ],
//   metadata: { next_cursor } }
export function buildRegistrySearchUrl(query, limit = 20) {
    const url = new URL(`${REGISTRY_API_BASE}/${REGISTRY_API_VERSION}/servers`);
    if (query) url.searchParams.set('search', query);
    url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 100)));
    return url.toString();
}

export function normalizeRegistryServer(entry) {
    const s = entry?.server || {};
    const meta = entry?._meta?.['io.modelcontextprotocol.registry/official'] || {};
    const remote = Array.isArray(s.remotes) ? s.remotes[0] : null;
    const pkg = Array.isArray(s.packages) ? s.packages[0] : null;
    return {
        name: s.name || '',
        title: s.title || s.name || '',
        description: s.description || '',
        version: s.version || '',
        url: s.websiteUrl || s.repository?.url || '',
        repoUrl: s.repository?.url || '',
        transport: remote ? `remote (${remote.type || 'http'})` : pkg ? `local (${pkg.transport?.type || 'stdio'})` : 'unknown',
        remoteUrl: remote?.url || '',
        packageId: pkg?.identifier || '',
        isLatest: meta.isLatest === true,
        status: meta.status || 'unknown',
    };
}

export async function searchMcpRegistry(query, { limit = 20, fetchImpl = null } = {}) {
    const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
    if (!doFetch) throw new Error('fetch is not available in this environment');
    const res = await doFetch(buildRegistrySearchUrl(query, limit), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`MCP Registry request failed: ${res.status}`);
    const data = await res.json();
    const servers = Array.isArray(data.servers) ? data.servers.map(normalizeRegistryServer) : [];
    return { servers, nextCursor: data?.metadata?.next_cursor || null };
}

// ── FreeAPI list (general free APIs, machine-readable JSON) ────────────────
export const FREEAPI_JSON_URL = 'https://raw.githubusercontent.com/AIPMAndy/FreeAPI/main/apis.json';

export async function fetchFreeApiList({ fetchImpl = null } = {}) {
    const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
    if (!doFetch) throw new Error('fetch is not available in this environment');
    const res = await doFetch(FREEAPI_JSON_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`FreeAPI list request failed: ${res.status}`);
    const data = await res.json();
    const categories = data.categories || {};
    // The finder only surfaces the media-relevant categories by default.
    const pick = (name) => (Array.isArray(categories[name]) ? categories[name] : []);
    return {
        total: data.total || 0,
        video: pick('Video'),
        machineLearning: pick('Machine Learning'),
        artDesign: pick('Art & Design'),
        photography: pick('Photography'),
        categories: Object.keys(categories),
    };
}

// ── Key storage (localStorage; keys never leave the browser) ───────────────
const KEY_PREFIX = 'freeapi_key_';
const GLAMA_KEY = 'freeapi_glama_key';
const META_KEY = 'freeapi_finder_meta';

function storage() {
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
        return null;
    }
}

export function getProviderKey(id) {
    return storage()?.getItem(KEY_PREFIX + id) || '';
}

export function setProviderKey(id, key) {
    const store = storage();
    if (!store) return false;
    if (key) store.setItem(KEY_PREFIX + id, key);
    else store.removeItem(KEY_PREFIX + id);
    return true;
}

export function hasProviderKey(id) {
    return getProviderKey(id).length > 0;
}

export function getGlamaKey() {
    return storage()?.getItem(GLAMA_KEY) || '';
}

export function setGlamaKey(key) {
    const store = storage();
    if (!store) return false;
    if (key) store.setItem(GLAMA_KEY, key);
    else store.removeItem(GLAMA_KEY);
    return true;
}

export function getFinderMeta() {
    try {
        return JSON.parse(storage()?.getItem(META_KEY) || '{}');
    } catch {
        return {};
    }
}

export function setFinderMeta(patch) {
    const store = storage();
    if (!store) return;
    store.setItem(META_KEY, JSON.stringify({ ...getFinderMeta(), ...patch }));
}

// ── Test connection ─────────────────────────────────────────────────────────
// Never spends generation credits. Returns { ok, detail }.
// 'http': plain GET (reachability only — does not validate the key).
// 'openrouter': key-format check (documented: sk-or-v1- + 64 lowercase hex)
//   plus a GET of the public models list.
// 'local-http': is the local service answering on its loopback URL?
// 'wangp': desktop-app WanGP check via window.localAI when available.
export const OPENROUTER_KEY_PATTERN = /^sk-or-v1-[0-9a-f]{64}$/;

export function validateOpenRouterKey(key) {
    return OPENROUTER_KEY_PATTERN.test(String(key || '').trim());
}

export async function testProviderConnection(provider, { fetchImpl = null, localAI = null } = {}) {
    if (!provider?.test) return { ok: null, detail: 'No test endpoint verified for this provider — check its dashboard.' };
    const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
    const t = provider.test;
    try {
        if (t.type === 'http') {
            if (!doFetch) return { ok: null, detail: 'fetch is not available here.' };
            const res = await doFetch(t.url, { method: 'GET', headers: { Accept: 'application/json' } });
            if (res.ok) return { ok: true, detail: `Reachable (${res.status}). ${t.note || ''}`.trim() };
            return { ok: false, detail: `API answered ${res.status} — the service may be down or the URL may have changed.` };
        }
        if (t.type === 'openrouter') {
            const key = getProviderKey(provider.id);
            if (!key) return { ok: false, detail: 'No key saved yet — add your OpenRouter key first.' };
            if (!validateOpenRouterKey(key)) return { ok: false, detail: 'Key format is wrong — OpenRouter keys look like sk-or-v1- followed by 64 lowercase hex characters.' };
            if (!doFetch) return { ok: null, detail: 'Key format is valid; fetch is not available here to check the API.' };
            const res = await doFetch('https://openrouter.ai/api/v1/models', { headers: { Accept: 'application/json' } });
            if (res.ok) return { ok: true, detail: 'Key format is valid and the OpenRouter API answered. (This checks reachability, not your credit balance.)' };
            return { ok: false, detail: `OpenRouter API answered ${res.status}.` };
        }
        if (t.type === 'local-http') {
            if (!doFetch) return { ok: null, detail: 'fetch is not available here.' };
            const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => ctrl.abort(), 3000) : null;
            try {
                const res = await doFetch(t.url, { signal: ctrl?.signal });
                return { ok: res.status < 500, detail: res.status < 500 ? `${t.label || t.url} is running.` : `${t.label || t.url} answered ${res.status}.` };
            } catch (e) {
                return { ok: false, detail: `${t.label || t.url} did not answer — is the service running locally? (${e?.name === 'AbortError' ? 'timed out after 3s' : 'connection refused'})` };
            } finally {
                if (timer) clearTimeout(timer);
            }
        }
        if (t.type === 'wangp') {
            const client = localAI || (typeof window !== 'undefined' ? window.localAI : null);
            if (!client?.wan2gp?.check) return { ok: null, detail: 'WanGP check only works in the desktop app — open this studio there to test it.' };
            const cfg = await client.wan2gp.getConfig().catch(() => ({}));
            const result = await client.wan2gp.check(cfg || {});
            if (result?.ok) return { ok: true, detail: 'WanGP answered — local video generation is available.' };
            return { ok: false, detail: result?.error || 'WanGP did not answer — check the WanGP folder/URL in Settings → Local Models.' };
        }
    } catch (e) {
        return { ok: false, detail: `Test failed: ${e?.message || e}` };
    }
    return { ok: null, detail: 'Unknown test type.' };
}
