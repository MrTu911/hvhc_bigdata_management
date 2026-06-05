/**
 * Smoke harness – kiểm tra sức khỏe runtime của mọi trang + API GET.
 *
 * Mục tiêu: phát hiện CRASH (5xx / lỗi runtime) trên toàn bộ route sau nâng cấp
 * UI/UX, thứ mà tsc (chạy ở dev mode) không bắt được.
 *
 * Cách dùng:
 *   SMOKE_BASE_URL=http://localhost:3100 npm run smoke
 *
 * Tiền đề: server đang chạy (dev/prod) phản ánh code hiện tại, DB đã seed (để
 * login admin + resolve [id] động). Exit code 1 nếu có CRASH (CI-gateable).
 */

import fs from 'fs';
import path from 'path';
import { loginAsAdmin, BASE_URL } from './auth';

const ROOT = path.resolve(__dirname, '../..');
const APP_DIR = path.join(ROOT, 'app');
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY ?? 6);
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 30000);

type Verdict = 'OK' | 'AUTH_REDIRECT' | 'EXPECTED_NON_2XX' | 'SKIPPED_NO_ID' | 'CRASH';
interface Target { kind: 'page' | 'api'; url: string; raw: string; }
interface Result extends Target { status: number | string; verdict: Verdict; note?: string; }

// ── Enumeration ────────────────────────────────────────────────────────────

function walk(dir: string, fileName: 'page.tsx' | 'route.ts', out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, fileName, out);
    else if (entry.name === fileName) out.push(full);
  }
  return out;
}

/** app/(group)/dashboard/x/page.tsx -> /dashboard/x  (bỏ route group, [seg] giữ nguyên). */
function fileToRoute(file: string, fileName: string): string {
  let rel = path.relative(APP_DIR, file).replace(new RegExp(`/${fileName}$`), '');
  rel = rel
    .split('/')
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')'))) // route groups
    .join('/');
  return '/' + rel;
}

function hasGetExport(file: string): boolean {
  const src = fs.readFileSync(file, 'utf8');
  return /export\s+(async\s+)?function\s+GET\b/.test(src) || /export\s+const\s+GET\b/.test(src);
}

function isDynamic(route: string): boolean {
  return route.includes('[');
}

// ── Dynamic [id] resolution (API) ──────────────────────────────────────────
// Với route có ĐÚNG MỘT segment động dạng [x] (không catch-all), suy ra list
// endpoint = phần path trước segment đó, GET lấy data[].id để thay thế.

const idCache = new Map<string, string | null>();

async function resolveListId(listUrl: string, cookie: string): Promise<string | null> {
  if (idCache.has(listUrl)) return idCache.get(listUrl)!;
  let id: string | null = null;
  try {
    const res = await fetchWithTimeout(`${BASE_URL}${listUrl}?page=1&limit=5`, cookie);
    if (res.ok) {
      const json: unknown = await res.json();
      const arr = extractArray(json);
      const first = arr.find((x) => x && typeof x === 'object' && 'id' in x) as { id?: string } | undefined;
      if (first?.id) id = String(first.id);
    }
  } catch {
    id = null;
  }
  idCache.set(listUrl, id);
  return id;
}

function extractArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (obj.data && typeof obj.data === 'object') {
      const inner = obj.data as Record<string, unknown>;
      for (const v of Object.values(inner)) if (Array.isArray(v)) return v;
    }
    for (const v of Object.values(obj)) if (Array.isArray(v)) return v;
  }
  return [];
}

async function resolveDynamic(route: string, cookie: string): Promise<string | null> {
  if (route.includes('[...')) return null; // catch-all: bỏ
  const dynCount = (route.match(/\[/g) ?? []).length;
  if (dynCount !== 1) return null; // nhiều segment động: bỏ cho an toàn
  const idx = route.indexOf('/[');
  const listUrl = route.slice(0, idx); // path trước segment động
  if (!listUrl.startsWith('/api/')) return null; // chỉ resolve API (list rõ ràng)
  const id = await resolveListId(listUrl, cookie);
  if (!id) return null;
  return route.replace(/\[[^\]]+\]/, id);
}

// ── Request + classify ─────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, cookie: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { headers: { cookie }, redirect: 'manual', signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

const EXPECTED = new Set([400, 401, 403, 404, 405, 409, 410, 422, 429]);

async function probe(target: Target, cookie: string): Promise<Result> {
  let url = target.url;
  if (isDynamic(target.url)) {
    const resolved = await resolveDynamic(target.url, cookie);
    if (!resolved) return { ...target, status: '-', verdict: 'SKIPPED_NO_ID' };
    url = resolved;
  }
  try {
    const res = await fetchWithTimeout(`${BASE_URL}${url}`, cookie);
    const code = res.status;
    if (code >= 200 && code < 300) return { ...target, url, status: code, verdict: 'OK' };
    if (code >= 300 && code < 400) {
      const loc = res.headers.get('location') ?? '';
      if (/\/login|\/api\/auth/.test(loc)) return { ...target, url, status: code, verdict: 'AUTH_REDIRECT', note: loc };
      return { ...target, url, status: code, verdict: 'OK', note: `redirect ${loc}` };
    }
    if (EXPECTED.has(code)) return { ...target, url, status: code, verdict: 'EXPECTED_NON_2XX' };
    // 5xx và mọi mã khác → CRASH, kèm snippet
    const snippet = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
    return { ...target, url, status: code, verdict: 'CRASH', note: snippet };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ...target, url, status: 'ERR', verdict: 'CRASH', note: /abort/i.test(msg) ? `timeout ${TIMEOUT_MS}ms` : msg };
  }
}

async function runPool(targets: Target[], cookie: string): Promise<Result[]> {
  const results: Result[] = [];
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < targets.length) {
      const idx = i++;
      const r = await probe(targets[idx], cookie);
      results[idx] = r;
      done++;
      if (r.verdict === 'CRASH') console.log(`  ✗ CRASH [${r.status}] ${r.url}  ${r.note ?? ''}`);
      if (done % 50 === 0) console.log(`  …${done}/${targets.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Smoke target: ${BASE_URL} (concurrency=${CONCURRENCY}, timeout=${TIMEOUT_MS}ms)`);
  const session = await loginAsAdmin();
  console.log(`Logged in as admin (role=${session.role})\n`);

  const pages: Target[] = walk(path.join(APP_DIR), 'page.tsx')
    .map((f) => ({ kind: 'page' as const, raw: f, url: fileToRoute(f, 'page.tsx') }))
    .filter((t) => t.url.startsWith('/dashboard') || t.url === '/');
  const apis: Target[] = walk(path.join(APP_DIR, 'api'), 'route.ts')
    .filter(hasGetExport)
    .map((f) => ({ kind: 'api' as const, raw: f, url: '/api' + fileToRoute(f, 'route.ts').replace(/^\/api/, '') }));

  const targets = [...pages, ...apis];
  console.log(`Targets: ${pages.length} pages + ${apis.length} GET APIs = ${targets.length}\n`);

  const results = await runPool(targets, session.cookie);

  const by = (v: Verdict) => results.filter((r) => r.verdict === v);
  const crashes = by('CRASH');
  const skipped = by('SKIPPED_NO_ID');
  console.log('\n──────── SUMMARY ────────');
  console.log(`OK:                ${by('OK').length}`);
  console.log(`EXPECTED_NON_2XX:  ${by('EXPECTED_NON_2XX').length}`);
  console.log(`AUTH_REDIRECT:     ${by('AUTH_REDIRECT').length}  (nếu nhiều → kiểm tra phiên login)`);
  console.log(`SKIPPED_NO_ID:     ${skipped.length}  (route động không resolve được id)`);
  console.log(`CRASH:             ${crashes.length}`);
  if (crashes.length) {
    console.log('\n──────── CRASHES ────────');
    for (const c of crashes) console.log(`[${c.status}] ${c.kind} ${c.url}\n      ${c.note ?? ''}`);
  }
  process.exit(crashes.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke harness lỗi:', err);
  process.exit(2);
});
