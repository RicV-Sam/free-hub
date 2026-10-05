import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { submitIndexNow, waitForRevision } from './lib/indexnow-client.mjs';

const stateFile = '.indexnow-state/state.json';
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'");
export function stableHtml(html) {
  // Cloudflare randomizes the XOR key on each response, without changing the email.
  const email = encoded => {
    const bytes = Buffer.from(encoded, 'hex');
    return Buffer.from([...bytes.subarray(1)].map(byte => byte ^ bytes[0])).toString('hex');
  };
  return html.replace(/data-cfemail="([a-f0-9]+)"/gi, (_, encoded) => `data-cfemail="email:${email(encoded)}"`)
    .replace(/\/cdn-cgi\/l\/email-protection#([a-f0-9]+)/gi, (_, encoded) => `/cdn-cgi/l/email-protection#email:${email(encoded)}`);
}
export function changedUrls(previous, current) {
  if (previous.schema_version !== 1 || current.schema_version !== 1 || !previous.pages || !current.pages) throw new Error('Invalid IndexNow state; refusing to infer changes.');
  if (previous.host !== current.host) throw new Error('IndexNow baseline belongs to another host.');
  return [...new Set([...Object.keys(previous.pages), ...Object.keys(current.pages)])]
    .filter(url => previous.pages[url] !== current.pages[url]).sort();
}
export async function snapshot(site, fetcher = fetch, sitemapPath = '/sitemap.xml') {
  const origin = new URL(site).origin;
  const pages = {};
  const visited = new Set();
  async function get(url) {
    if (new URL(url).origin !== origin) throw new Error('Foreign URL in sitemap.');
    const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
    if (response.status !== 200) throw new Error(`Live snapshot failed: HTTP ${response.status} for ${url}`);
    return response.text();
  }
  async function sitemap(url) {
    if (visited.has(url)) return [];
    visited.add(url);
    const xml = await get(url);
    const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m => decode(m[1].trim()));
    if (!locs.length) throw new Error('Empty or invalid live sitemap; refusing to infer removals.');
    if (!/<sitemapindex\b/i.test(xml)) return locs;
    return (await Promise.all(locs.map(sitemap))).flat();
  }
  const urls = [...new Set(await sitemap(`${origin}${sitemapPath}`))];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(5, urls.length) }, async () => {
    while (next < urls.length) {
      const url = urls[next++];
      const html = await get(url);
      pages[url] = createHash('sha256').update(stableHtml(html)).digest('hex');
    }
  }));
  return { schema_version: 1, host: new URL(origin).host, pages: Object.fromEntries(Object.entries(pages).sort()), checked_at: new Date().toISOString() };
}
async function baseline() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    // API/download failures are fatal: never silently reset previously submitted state.
    const data = JSON.parse(execFileSync('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY}/actions/artifacts?name=indexnow-state&per_page=100`], { encoding: 'utf8' }));
    if (data.artifacts.length && data.artifacts.every(a => a.expired)) throw new Error('Prior IndexNow state expired; restore a reviewed baseline before submitting.');
    const artifact = data.artifacts.find(a => !a.expired && a.workflow_run?.head_branch === 'main');
    if (artifact) {
      execFileSync('gh', ['run', 'download', String(artifact.workflow_run.id), '--repo', process.env.GITHUB_REPOSITORY, '--name', 'indexnow-state', '--dir', '.indexnow-state'], { stdio: 'pipe' });
      return JSON.parse(await readFile(stateFile, 'utf8'));
    }
  }
  return JSON.parse(await readFile('scripts/indexnow-baseline.json', 'utf8'));
}
async function main() {
  const [command, site, sitemapPath = '/sitemap.xml'] = process.argv.slice(2);
  if (!site) throw new Error('Specify snapshot or notify and the site origin.');
  if (command === 'snapshot') {
    const current = await snapshot(site, fetch, sitemapPath);
    await writeFile('scripts/indexnow-baseline.json', JSON.stringify(current, null, 2) + '\n');
    console.log(`Baseline captured: ${Object.keys(current.pages).length} live pages; no submissions.`);
    return;
  }
  if (command !== 'notify') throw new Error('Unknown command.');
  const previous = await baseline();
  const revision = process.env.GITHUB_SHA;
  if (!revision) throw new Error('GITHUB_SHA is required for deployment verification.');
  await waitForRevision(`${new URL(site).origin}/indexnow-revision.txt`, revision, { attempts: 60 });
  const current = await snapshot(site, fetch, sitemapPath);
  const marker = await fetch(new URL(site).origin + '/indexnow-revision.txt?revision=' + revision, { redirect: 'error', signal: AbortSignal.timeout(10000), headers: { 'Cache-Control': 'no-cache' } });
  if (marker.status !== 200 || (await marker.text()).trim() !== revision) throw new Error('Production changed during snapshot; submission stopped.');
  const urls = changedUrls(previous, current);
  // Nature adopts IndexNow with one explicit homepage notification, once only.
  if (previous.bootstrap_homepage && !urls.includes(`${new URL(site).origin}/`)) urls.push(`${new URL(site).origin}/`);
  const key = (process.env.INDEXNOW_API_KEY || await readFile('scripts/indexnow-key.txt', 'utf8').catch(() => '')).trim();
  await submitIndexNow({ host: current.host, key, urls, batchSize: 10 });
  await mkdir('.indexnow-state', { recursive: true });
  await writeFile(stateFile, JSON.stringify(current, null, 2) + '\n');
  console.log(`Changed-page state saved; ${urls.length} notifications. Indexing is not confirmed.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
