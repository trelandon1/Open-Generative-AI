// Tests for the Free API / MCP Finder registry (src/lib/freeProviders.js).
// Run: node --test tests/freeProviders.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    FREE_PROVIDERS,
    DISCOVERY_SOURCES,
    PAID_ONLY_CHECKED,
    validateRegistry,
    getProviderById,
    providersByKind,
    buildRegistrySearchUrl,
    normalizeRegistryServer,
    searchMcpRegistry,
    fetchFreeApiList,
    validateOpenRouterKey,
    testProviderConnection,
} from '../src/lib/freeProviders.js';

test('registry validates: every entry has required fields and valid URLs', () => {
    const errors = validateRegistry();
    assert.deepEqual(errors, [], `registry errors: ${errors.join('; ')}`);
});

test('registry never promises unlimited free generation', () => {
    for (const p of FREE_PROVIDERS) {
        assert.doesNotMatch(p.freeTier, /unlimited free/i, `${p.id} promises unlimited free`);
        assert.doesNotMatch(p.description, /unlimited free/i, `${p.id} description promises unlimited free`);
    }
});

test('registry has all four kinds and a usable free list', () => {
    assert.ok(providersByKind('api').length >= 5, 'expected at least 5 cloud free tiers');
    assert.ok(providersByKind('local').length >= 3, 'expected at least 3 local options');
    assert.ok(providersByKind('local-model').length >= 4, 'expected at least 4 open-weight engines');
    assert.ok(providersByKind('mcp').length >= 5, 'expected at least 5 MCP servers');
    assert.ok(getProviderById('muapi'), 'muapi entry exists');
    assert.ok(getProviderById('wangp'), 'WanGP entry exists');
    assert.ok(getProviderById('comfy-mcp'), 'Comfy MCP entry exists');
    assert.equal(getProviderById('nope'), null, 'unknown id returns null');
});

test('paid-only list excludes Smithery as a source and names reasons', () => {
    assert.ok(PAID_ONLY_CHECKED.length >= 5);
    const smithery = PAID_ONLY_CHECKED.find((c) => c.name === 'Smithery');
    assert.ok(smithery, 'Smithery is recorded as excluded');
    assert.match(smithery.reason, /Oct 31, 2026/);
    for (const c of PAID_ONLY_CHECKED) {
        assert.ok(c.reason && c.reason.length > 10, `${c.name} needs a reason`);
        assert.match(c.sourceUrl, /^https:\/\//, `${c.name} needs a source URL`);
    }
});

test('discovery sources never include Smithery', () => {
    assert.ok(!DISCOVERY_SOURCES.some((s) => /smithery/i.test(s.id + s.name + s.url)));
    assert.ok(DISCOVERY_SOURCES.some((s) => s.id === 'official-mcp-registry' && s.liveQuery));
    assert.ok(DISCOVERY_SOURCES.some((s) => s.id === 'glama'));
    assert.ok(DISCOVERY_SOURCES.some((s) => s.id === 'mcpfinder'));
    assert.ok(DISCOVERY_SOURCES.some((s) => s.id === 'freeapi-list'));
});

test('buildRegistrySearchUrl builds the documented endpoint', () => {
    const url = buildRegistrySearchUrl('video', 20);
    assert.equal(url, 'https://registry.modelcontextprotocol.io/v0.1/servers?search=video&limit=20');
    const noQuery = buildRegistrySearchUrl('', 5);
    assert.equal(noQuery, 'https://registry.modelcontextprotocol.io/v0.1/servers?limit=5');
    const clamped = buildRegistrySearchUrl('x', 500);
    assert.match(clamped, /limit=100$/, 'limit clamps to 100');
});

test('normalizeRegistryServer handles the documented shape and missing fields', () => {
    const entry = {
        server: {
            name: 'io.github.example/video-mcp',
            title: 'Video MCP',
            description: 'Makes videos',
            version: '1.2.3',
            websiteUrl: 'https://example.com',
            repository: { url: 'https://github.com/example/video-mcp' },
            packages: [{ identifier: 'npm:video-mcp', transport: { type: 'stdio' } }],
            remotes: [{ url: 'https://example.com/mcp', type: 'http' }],
        },
        _meta: { 'io.modelcontextprotocol.registry/official': { status: 'active', isLatest: true } },
    };
    const n = normalizeRegistryServer(entry);
    assert.equal(n.name, 'io.github.example/video-mcp');
    assert.equal(n.title, 'Video MCP');
    assert.equal(n.url, 'https://example.com');
    assert.equal(n.remoteUrl, 'https://example.com/mcp');
    assert.equal(n.isLatest, true);
    assert.equal(n.status, 'active');
    // Missing fields must not throw.
    assert.doesNotThrow(() => normalizeRegistryServer({}));
    assert.doesNotThrow(() => normalizeRegistryServer(null));
    const empty = normalizeRegistryServer({});
    assert.equal(empty.name, '');
    assert.equal(empty.status, 'unknown');
});

test('searchMcpRegistry normalizes a stubbed registry response', async () => {
    const fetchImpl = async (url) => {
        assert.match(String(url), /^https:\/\/registry\.modelcontextprotocol\.io\/v0\.1\/servers\?search=video/);
        return {
            ok: true,
            status: 200,
            json: async () => ({
                servers: [
                    { server: { name: 'a/b', title: 'B', description: 'd', version: '1', websiteUrl: 'https://b.example' }, _meta: { 'io.modelcontextprotocol.registry/official': { status: 'active', isLatest: true } } },
                ],
                metadata: { next_cursor: 'abc' },
            }),
        };
    };
    const { servers, nextCursor } = await searchMcpRegistry('video', { fetchImpl });
    assert.equal(servers.length, 1);
    assert.equal(servers[0].name, 'a/b');
    assert.equal(nextCursor, 'abc');
});

test('searchMcpRegistry throws on a failed response', async () => {
    const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({}) });
    await assert.rejects(() => searchMcpRegistry('video', { fetchImpl }), /503/);
});

test('fetchFreeApiList picks the media-relevant categories', async () => {
    const fetchImpl = async (url) => {
        assert.equal(String(url), 'https://raw.githubusercontent.com/AIPMAndy/FreeAPI/main/apis.json');
        return {
            ok: true,
            status: 200,
            json: async () => ({
                total: 1092,
                categories: {
                    Video: [{ name: 'V1', url: 'https://v1.example', description: 'vid', auth: 'No' }],
                    'Machine Learning': [{ name: 'M1', url: 'https://m1.example', description: 'ml', auth: 'apiKey' }],
                    'Art & Design': [],
                    Photography: [],
                    Weather: [{ name: 'W1', url: 'https://w1.example', description: 'w', auth: 'No' }],
                },
            }),
        };
    };
    const data = await fetchFreeApiList({ fetchImpl });
    assert.equal(data.total, 1092);
    assert.equal(data.video.length, 1);
    assert.equal(data.machineLearning.length, 1);
    assert.ok(data.categories.includes('Weather'));
});

test('validateOpenRouterKey enforces the documented format', () => {
    const good = 'sk-or-v1-' + 'a'.repeat(64);
    assert.equal(validateOpenRouterKey(good), true);
    assert.equal(validateOpenRouterKey('sk-or-v1-' + 'A'.repeat(64)), false, 'uppercase hex rejected');
    assert.equal(validateOpenRouterKey('sk-or-v1-' + 'a'.repeat(63)), false, 'short key rejected');
    assert.equal(validateOpenRouterKey('sk-abc'), false);
    assert.equal(validateOpenRouterKey(''), false);
    assert.equal(validateOpenRouterKey(null), false);
});

test('testProviderConnection returns null-ok for providers with no test', async () => {
    const p = getProviderById('runway');
    assert.equal(p.test, null);
    const result = await testProviderConnection(p);
    assert.equal(result.ok, null);
    assert.match(result.detail, /No test endpoint/);
});

test('testProviderConnection http test reports reachability without spending credits', async () => {
    const p = getProviderById('muapi');
    const okFetch = async () => ({ ok: true, status: 200 });
    const ok = await testProviderConnection(p, { fetchImpl: okFetch });
    assert.equal(ok.ok, true);
    assert.match(ok.detail, /Reachable/);
    const badFetch = async () => ({ ok: false, status: 500 });
    const bad = await testProviderConnection(p, { fetchImpl: badFetch });
    assert.equal(bad.ok, false);
    assert.match(bad.detail, /500/);
});
