// Free APIs & MCP Finder — studio panel (vanilla DOM, house style).
//
// Lists the curated, verified free video/image APIs and MCP servers from
// src/lib/freeProviders.js, lets the user save a key per provider (localStorage
// only — keys never leave the browser), test the connection where a verified
// test exists, and query the Official MCP Registry live for video MCP servers.
// A manual Refresh button re-runs the live registry query; a scheduled
// re-check is a TODO (see docs/free-api-finder.md).

import {
    FREE_PROVIDERS,
    DISCOVERY_SOURCES,
    PAID_ONLY_CHECKED,
    REGISTRY_VERSION,
    searchMcpRegistry,
    fetchFreeApiList,
    getProviderKey,
    setProviderKey,
    hasProviderKey,
    getGlamaKey,
    setGlamaKey,
    getFinderMeta,
    setFinderMeta,
    testProviderConnection,
} from '../lib/freeProviders.js';

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
}

function link(url, label) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'text-[#8b7cff] hover:underline';
    a.textContent = label;
    return a;
}

function chip(text, tone) {
    const c = el('span', 'inline-block text-[11px] px-2 py-0.5 rounded-full mr-1 mb-1', text);
    const tones = {
        green: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        gray: 'bg-white/5 text-white/60 border border-white/10',
        violet: 'bg-[#7c5cff]/15 text-[#b7a8ff] border border-[#7c5cff]/30',
        red: 'bg-red-500/15 text-red-300 border border-red-500/30',
    };
    c.className += ' ' + (tones[tone] || tones.gray);
    return c;
}

function flagChips(p) {
    const wrap = el('div', 'mb-2');
    const map = {
        'already-integrated': ['Already in this studio', 'violet'],
        reseller: ['Unofficial reseller — not the model maker', 'amber'],
        stale: ['Stale — last updated 2025-04-17', 'red'],
        community: ['Community server — not official', 'amber'],
        new: ['Very new — verify before relying on it', 'amber'],
        'repo-archived': ['Self-hosted repo archived — use hosted route', 'amber'],
        'license-note': ['License needs a read before commercial use', 'amber'],
    };
    for (const f of p.flags || []) {
        if (map[f]) wrap.appendChild(chip(map[f][0], map[f][1]));
    }
    if (p.freeTierVerified) wrap.appendChild(chip('Free tier verified from provider’s own docs', 'green'));
    else wrap.appendChild(chip('Free amount NOT verified — shown as reported', 'amber'));
    return wrap;
}

function providerCard(p) {
    const card = el('div', 'bg-[#16151a] border border-white/10 rounded-xl p-4 mb-3');
    const head = el('div', 'flex flex-wrap items-center gap-2 mb-1');
    head.appendChild(el('h3', 'text-[15px] font-semibold text-white', p.name));
    for (const m of p.media || []) head.appendChild(chip(m, 'gray'));
    if (p.kind === 'local' || p.kind === 'local-model') head.appendChild(chip('$0 / job — your GPU', 'green'));
    if (p.kind === 'mcp') head.appendChild(chip('MCP server', 'violet'));
    card.appendChild(head);
    card.appendChild(flagChips(p));
    card.appendChild(el('p', 'text-[13px] text-white/70 mb-2', p.description));
    if (p.models?.length) {
        card.appendChild(el('p', 'text-[12px] text-white/50 mb-2', 'Models: ' + p.models.join(' · ')));
    }
    const free = el('p', 'text-[13px] text-emerald-200/90 mb-1');
    free.appendChild(el('strong', '', 'Free tier: '));
    free.appendChild(document.createTextNode(p.freeTier));
    card.appendChild(free);
    if (p.unverifiedNote) {
        card.appendChild(el('p', 'text-[12px] text-amber-300/90 mb-1', 'Reported, not verified: ' + p.unverifiedNote));
    }
    card.appendChild(el('p', 'text-[12px] text-white/50 mb-3', p.costNote || ''));
    const links = el('div', 'flex flex-wrap gap-4 text-[12px] mb-3');
    links.appendChild(link(p.keyUrl, p.kind === 'local-model' ? 'Get the weights / repo' : p.kind === 'local' ? 'Get it' : p.kind === 'mcp' ? 'Connect / repo' : 'Get a key'));
    links.appendChild(link(p.sourceUrl, 'Source (where this was verified)'));
    card.appendChild(links);

    // Key entry + test (cloud APIs and OpenRouter-style keyed entries only).
    if (p.kind === 'api') {
        const row = el('div', 'flex flex-wrap gap-2 items-center');
        const input = document.createElement('input');
        input.type = 'password';
        input.placeholder = 'Paste your API key (saved in this browser only)';
        input.value = getProviderKey(p.id);
        input.className = 'flex-1 min-w-[220px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#7c5cff]';
        const saveBtn = el('button', 'px-3 py-2 rounded-lg text-[13px] bg-white/10 hover:bg-white/20 text-white', hasProviderKey(p.id) ? 'Key saved ✓' : 'Save key');
        saveBtn.addEventListener('click', () => {
            const ok = setProviderKey(p.id, input.value.trim());
            if (ok) saveBtn.textContent = input.value.trim() ? 'Key saved ✓' : 'Save key';
        });
        row.appendChild(input);
        row.appendChild(saveBtn);
        if (p.test) {
            const testBtn = el('button', 'px-3 py-2 rounded-lg text-[13px] bg-[#7c5cff] hover:bg-[#6a4cf0] text-white', 'Test connection');
            const status = el('span', 'text-[12px] text-white/60', '');
            testBtn.addEventListener('click', async () => {
                status.textContent = 'Testing…';
                const result = await testProviderConnection(p);
                status.textContent = result.ok === true ? '✓ ' + result.detail : result.ok === false ? '✗ ' + result.detail : '— ' + result.detail;
                status.className = 'text-[12px] ' + (result.ok === true ? 'text-emerald-300' : result.ok === false ? 'text-red-300' : 'text-white/60');
            });
            row.appendChild(testBtn);
            row.appendChild(status);
        } else {
            row.appendChild(el('span', 'text-[12px] text-white/40', 'No test endpoint verified — check your dashboard on the provider’s site.'));
        }
        card.appendChild(row);
    } else if (p.test) {
        const row = el('div', 'flex flex-wrap gap-2 items-center');
        const testBtn = el('button', 'px-3 py-2 rounded-lg text-[13px] bg-[#7c5cff] hover:bg-[#6a4cf0] text-white', 'Test connection');
        const status = el('span', 'text-[12px] text-white/60', '');
        testBtn.addEventListener('click', async () => {
            status.textContent = 'Testing…';
            const result = await testProviderConnection(p);
            status.textContent = result.ok === true ? '✓ ' + result.detail : result.ok === false ? '✗ ' + result.detail : '— ' + result.detail;
            status.className = 'text-[12px] ' + (result.ok === true ? 'text-emerald-300' : result.ok === false ? 'text-red-300' : 'text-white/60');
        });
        row.appendChild(testBtn);
        row.appendChild(status);
        card.appendChild(row);
    }
    return card;
}

function section(title, subtitle) {
    const wrap = el('section', 'mb-6');
    wrap.appendChild(el('h2', 'text-[16px] font-semibold text-white mb-1', title));
    if (subtitle) wrap.appendChild(el('p', 'text-[12px] text-white/50 mb-3', subtitle));
    return wrap;
}

export function createFreeApiFinderPage() {
    const root = el('div', 'flex-1 overflow-y-auto p-6 text-white');
    const meta = getFinderMeta();

    // ── Header ──
    const header = el('div', 'mb-5');
    header.appendChild(el('h1', 'text-[22px] font-bold', 'Free APIs & MCP Finder'));
    header.appendChild(el('p', 'text-[13px] text-white/60 mt-1', `Curated registry v${REGISTRY_VERSION} — every free-tier claim verified from the provider’s own docs or pricing page. “Free” here only ever means a free tier, one-time trial credits, or a local model on your own GPU. Cloud generation always bills per use — this panel shows the real limit for each entry and never promises unlimited free generation.`));
    const metaRow = el('div', 'flex flex-wrap items-center gap-3 mt-3 text-[12px] text-white/50');
    const lastRefresh = el('span', '', meta.lastRegistryRefresh ? `Last registry refresh: ${new Date(meta.lastRegistryRefresh).toLocaleString()}` : 'Registry not refreshed yet — hit Refresh to query the live MCP Registry.');
    metaRow.appendChild(lastRefresh);
    const refreshBtn = el('button', 'px-3 py-1.5 rounded-lg text-[13px] bg-[#7c5cff] hover:bg-[#6a4cf0] text-white', '↻ Refresh — query live MCP Registry');
    metaRow.appendChild(refreshBtn);
    header.appendChild(metaRow);
    root.appendChild(header);

    // ── Live MCP Registry search ──
    const searchSec = section('Search the Official MCP Registry (live)', 'Queries registry.modelcontextprotocol.io — the canonical MCP directory. No key needed.');
    const searchRow = el('div', 'flex flex-wrap gap-2 mb-3');
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.value = 'video';
    searchInput.placeholder = 'Search MCP servers — e.g. video, image, kling, replicate';
    searchInput.className = 'flex-1 min-w-[240px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#7c5cff]';
    const searchBtn = el('button', 'px-4 py-2 rounded-lg text-[13px] bg-[#7c5cff] hover:bg-[#6a4cf0] text-white', 'Search');
    searchRow.appendChild(searchInput);
    searchRow.appendChild(searchBtn);
    searchSec.appendChild(searchRow);
    const resultsBox = el('div', 'space-y-2');
    searchSec.appendChild(resultsBox);
    root.appendChild(searchSec);

    async function runRegistrySearch(query) {
        resultsBox.innerHTML = '';
        resultsBox.appendChild(el('p', 'text-[13px] text-white/50', 'Querying the Official MCP Registry…'));
        try {
            const { servers } = await searchMcpRegistry(query || 'video', { limit: 20 });
            setFinderMeta({ lastRegistryRefresh: new Date().toISOString(), lastQuery: query || 'video', lastResultCount: servers.length });
            lastRefresh.textContent = `Last registry refresh: ${new Date().toLocaleString()} — ${servers.length} servers for “${query || 'video'}”.`;
            resultsBox.innerHTML = '';
            if (!servers.length) {
                resultsBox.appendChild(el('p', 'text-[13px] text-white/50', 'No servers matched that query.'));
                return;
            }
            for (const s of servers) {
                const item = el('div', 'bg-[#16151a] border border-white/10 rounded-lg p-3');
                const head = el('div', 'flex flex-wrap items-center gap-2');
                head.appendChild(el('span', 'text-[13px] font-semibold', s.title || s.name));
                head.appendChild(chip(s.transport, 'gray'));
                if (s.isLatest) head.appendChild(chip('latest', 'green'));
                if (s.status && s.status !== 'active') head.appendChild(chip(`status: ${s.status}`, 'amber'));
                item.appendChild(head);
                if (s.description) item.appendChild(el('p', 'text-[12px] text-white/60 mt-1', s.description));
                const links = el('div', 'flex flex-wrap gap-4 text-[12px] mt-2');
                if (s.url) links.appendChild(link(s.url, 'Website / repo'));
                if (s.remoteUrl) links.appendChild(link(s.remoteUrl, 'Remote endpoint'));
                if (s.packageId) links.appendChild(el('code', 'text-white/50', s.packageId));
                item.appendChild(links);
                resultsBox.appendChild(item);
            }
        } catch (e) {
            resultsBox.innerHTML = '';
            const err = el('p', 'text-[13px] text-red-300', `Registry query failed: ${e?.message || e}. The registry is in preview and offers no uptime guarantees — try Refresh again, or browse it at registry.modelcontextprotocol.io.`);
            resultsBox.appendChild(err);
        }
    }
    searchBtn.addEventListener('click', () => runRegistrySearch(searchInput.value.trim()));
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runRegistrySearch(searchInput.value.trim()); });
    refreshBtn.addEventListener('click', () => runRegistrySearch(searchInput.value.trim()));

    // ── Free cloud tiers ──
    const cloudSec = section('Free cloud tiers — video & image APIs', 'One-time or recurring free credits. The panel shows the exact limit; when it runs out, generation is paid.');
    for (const p of FREE_PROVIDERS.filter((x) => x.kind === 'api')) cloudSec.appendChild(providerCard(p));
    root.appendChild(cloudSec);

    // ── Local, no key ──
    const localSec = section('Local, no key — $0 per job', 'Runs on your own GPU. No account, no credits, no per-clip bill.');
    for (const p of FREE_PROVIDERS.filter((x) => x.kind === 'local')) localSec.appendChild(providerCard(p));
    root.appendChild(localSec);

    // ── Open-weight engines ──
    const modelsSec = section('Open-weight video engines', 'Download the weights once (Hugging Face, free account), run them in WanGP, ComfyUI or standalone. Not services — nothing to test here.');
    for (const p of FREE_PROVIDERS.filter((x) => x.kind === 'local-model')) modelsSec.appendChild(providerCard(p));
    root.appendChild(modelsSec);

    // ── MCP servers ──
    const mcpSec = section('MCP servers for video generation', 'Plug these into any MCP client (Claude, Cursor, this studio’s MCP & CLI studio). Cloud ones need a key and pay per job — only the local ones are free.');
    for (const p of FREE_PROVIDERS.filter((x) => x.kind === 'mcp')) mcpSec.appendChild(providerCard(p));
    root.appendChild(mcpSec);

    // ── Discovery sources + general free-API lists ──
    const srcSec = section('Where this finder looks', 'Live sources behind the search above, plus general free-API catalogs for non-video needs.');
    for (const s of DISCOVERY_SOURCES) {
        const card = el('div', 'bg-[#16151a] border border-white/10 rounded-xl p-4 mb-3');
        const head = el('div', 'flex flex-wrap items-center gap-2 mb-1');
        head.appendChild(el('h3', 'text-[15px] font-semibold text-white', s.name));
        head.appendChild(chip(s.liveQuery ? 'Live query' : 'Browse / link-out', s.liveQuery ? 'green' : 'gray'));
        card.appendChild(head);
        card.appendChild(el('p', 'text-[13px] text-white/70 mb-1', s.note));
        card.appendChild(el('p', 'text-[12px] text-white/50 mb-2', 'Auth: ' + s.auth));
        const links = el('div', 'flex flex-wrap gap-4 text-[12px]');
        links.appendChild(link(s.url, 'Open directory'));
        if (s.apiBase) links.appendChild(link(s.apiBase, 'API endpoint'));
        card.appendChild(links);
        srcSec.appendChild(card);
    }
    // FreeAPI list browser (Video category)
    const freeApiCard = el('div', 'bg-[#16151a] border border-white/10 rounded-xl p-4 mb-3');
    freeApiCard.appendChild(el('h3', 'text-[15px] font-semibold text-white mb-1', 'Browse the FreeAPI catalog (general free APIs)'));
    freeApiCard.appendChild(el('p', 'text-[13px] text-white/70 mb-2', 'Loads the machine-readable apis.json (1,092 general free APIs) and shows the Video, Machine Learning, Art & Design and Photography categories. General APIs — not video-generation-specific, so verify each entry before trusting it.'));
    const freeApiRow = el('div', 'flex flex-wrap gap-2 items-center mb-2');
    const freeApiBtn = el('button', 'px-3 py-2 rounded-lg text-[13px] bg-[#7c5cff] hover:bg-[#6a4cf0] text-white', 'Load FreeAPI catalog');
    const freeApiStatus = el('span', 'text-[12px] text-white/60', '');
    freeApiRow.appendChild(freeApiBtn);
    freeApiRow.appendChild(freeApiStatus);
    freeApiCard.appendChild(freeApiRow);
    const freeApiResults = el('div', 'space-y-1');
    freeApiCard.appendChild(freeApiResults);
    freeApiBtn.addEventListener('click', async () => {
        freeApiStatus.textContent = 'Loading…';
        freeApiResults.innerHTML = '';
        try {
            const data = await fetchFreeApiList();
            freeApiStatus.textContent = `Catalog total: ${data.total} APIs. Video: ${data.video.length} · Machine Learning: ${data.machineLearning.length} · Art & Design: ${data.artDesign.length} · Photography: ${data.photography.length}`;
            const renderGroup = (label, items) => {
                if (!items.length) return;
                freeApiResults.appendChild(el('h4', 'text-[13px] font-semibold text-white mt-3 mb-1', label));
                for (const a of items.slice(0, 25)) {
                    const row = el('div', 'text-[12px] text-white/70');
                    const aEl = document.createElement('a');
                    aEl.href = a.url;
                    aEl.target = '_blank';
                    aEl.rel = 'noopener noreferrer';
                    aEl.className = 'text-[#8b7cff] hover:underline';
                    aEl.textContent = a.name || 'Unnamed API';
                    row.appendChild(aEl);
                    row.appendChild(document.createTextNode(` — ${a.description || ''} [auth: ${a.auth || 'unknown'}]`));
                    freeApiResults.appendChild(row);
                }
            };
            renderGroup('Video', data.video);
            renderGroup('Machine Learning', data.machineLearning);
            renderGroup('Art & Design', data.artDesign);
            renderGroup('Photography', data.photography);
        } catch (e) {
            freeApiStatus.textContent = `Failed to load the catalog: ${e?.message || e}`;
        }
    });
    srcSec.appendChild(freeApiCard);
    // Glama key
    const glamaCard = el('div', 'bg-[#16151a] border border-white/10 rounded-xl p-4 mb-3');
    glamaCard.appendChild(el('h3', 'text-[15px] font-semibold text-white mb-1', 'Glama directory key (optional)'));
    glamaCard.appendChild(el('p', 'text-[13px] text-white/70 mb-2', 'Glama’s directory API needs a free API key (Bearer). Save it here and the finder can query Glama directly once the Glama query is wired in — v1 lists Glama as a source and links out; live Glama search is a TODO.'));
    const glamaRow = el('div', 'flex flex-wrap gap-2 items-center');
    const glamaInput = document.createElement('input');
    glamaInput.type = 'password';
    glamaInput.placeholder = 'Glama API key (saved in this browser only)';
    glamaInput.value = getGlamaKey();
    glamaInput.className = 'flex-1 min-w-[220px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#7c5cff]';
    const glamaBtn = el('button', 'px-3 py-2 rounded-lg text-[13px] bg-white/10 hover:bg-white/20 text-white', getGlamaKey() ? 'Key saved ✓' : 'Save key');
    glamaBtn.addEventListener('click', () => {
        const ok = setGlamaKey(glamaInput.value.trim());
        if (ok) glamaBtn.textContent = glamaInput.value.trim() ? 'Key saved ✓' : 'Save key';
    });
    glamaRow.appendChild(glamaInput);
    glamaRow.appendChild(glamaBtn);
    glamaCard.appendChild(glamaRow);
    srcSec.appendChild(glamaCard);
    root.appendChild(srcSec);

    // ── Paid-only, checked ──
    const paidSec = section('Checked — paid only (excluded from the free list)', 'These were verified and have no free tier, so they are not listed above.');
    const details = document.createElement('details');
    details.className = 'bg-[#16151a] border border-white/10 rounded-xl p-4';
    const summary = document.createElement('summary');
    summary.className = 'cursor-pointer text-[13px] font-semibold text-white';
    summary.textContent = `Show ${PAID_ONLY_CHECKED.length} checked providers`;
    details.appendChild(summary);
    for (const c of PAID_ONLY_CHECKED) {
        const row = el('p', 'text-[13px] text-white/70 mt-2');
        row.appendChild(el('strong', '', c.name + ': '));
        row.appendChild(document.createTextNode(c.reason + ' '));
        row.appendChild(link(c.sourceUrl, 'Source'));
        details.appendChild(row);
    }
    paidSec.appendChild(details);
    root.appendChild(paidSec);

    // ── Refresh / scheduled re-check note ──
    const noteSec = section('How freshness works', '');
    noteSec.appendChild(el('p', 'text-[13px] text-white/70 mb-2', 'V1 is manual: the Refresh button re-queries the Official MCP Registry, and “Load FreeAPI catalog” re-fetches apis.json. The curated free-tier list is a snapshot dated ' + REGISTRY_VERSION + ' — free tiers change, so re-verify a provider on its own pricing page before relying on it for a big job.'));
    noteSec.appendChild(el('p', 'text-[13px] text-white/70', 'Scheduled re-check (later work): run the same registry + FreeAPI queries on a timer — in the desktop app via the Electron main process, or as a small cron job that refreshes a cached snapshot — and surface “changed since last check” (new free tier, removed free tier, price change). The registry module already exports the query functions (searchMcpRegistry, fetchFreeApiList) so a scheduler can call them without touching the UI.'));
    root.appendChild(noteSec);

    // Run the default search on first open.
    runRegistrySearch('video');
    return root;
}
