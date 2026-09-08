// Canonical source: Analytics Hub shared/indexnow. Sync with scripts/sync-indexnow.py.
// Node 22+, no dependencies. Receipt by IndexNow is not proof of indexing.
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const VERSION = '1.0.0';
export const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const reportPath = () => process.env.INDEXNOW_REPORT_PATH || '.indexnow-status.json';

export async function saveStatus(result, file = reportPath()) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.tmp`, JSON.stringify(result, null, 2) + '\n');
  await rename(`${file}.tmp`, file);
}

function status(host) {
  return { schema_version: 1, client_version: VERSION, provider: 'IndexNow', host,
    checked_at: new Date().toISOString(), revision: process.env.GITHUB_SHA || null,
    run_id: process.env.GITHUB_RUN_ID || null, status: 'failed', selected_count: 0,
    accepted_count: 0, pending_count: 0, batches: [], indexing_status: 'not_checked' };
}

function validUrl(raw, host) {
  const url = new URL(raw);
  if (!['https:', 'http:'].includes(url.protocol) || url.host !== host || url.username || url.password || url.hash) {
    throw new Error('Submission URLs must be HTTP(S), on the exact configured host, without credentials or fragments.');
  }
  return url.toString();
}

export function retryDelay(response, attempt, base, now = Date.now()) {
  const header = response?.headers?.get('retry-after');
  if (header) {
    const seconds = Number(header);
    const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - now;
    if (Number.isFinite(ms)) return Math.max(0, ms);
  }
  return base * 2 ** attempt;
}

export async function submitIndexNow(options, deps = {}) {
  const { host, key = '', urls = [], dryRun = false,
    endpoint = DEFAULT_ENDPOINT, keyLocation = `https://${host}/${key}.txt`,
    retries = Number(process.env.INDEXNOW_RETRIES || 2),
    retryDelayMs = Number(process.env.INDEXNOW_RETRY_DELAY_MS || 15000),
    batchSize = 10000, timeoutMs = 15000 } = options;
  const fetcher = deps.fetch || fetch;
  const sleep = deps.sleep || pause;
  const result = status(host);
  const file = options.reportPath || reportPath();
  try {
    if (!host || new URL(`https://${host}`).host !== host) throw new Error('Invalid configured host.');
    const target = new URL(endpoint);
    if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash) {
      throw new Error('IndexNow endpoint must be an HTTPS URL without credentials, query or fragment.');
    }
    if (!Number.isInteger(retries) || retries < 0 || retries > 5 || !Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
      throw new Error('Invalid retry settings.');
    }
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10000) throw new Error('Invalid batch size.');
    const selected = [...new Set(urls.map(raw => validUrl(raw, host)))];
    result.selected_count = selected.length;
    result.endpoint = endpoint;
    if (!selected.length) {
      result.status = 'skipped';
      result.message = 'No URLs matched the site selection rules.';
    } else if (dryRun) {
      result.status = 'dry_run';
      result.message = 'Selection validated; no network requests made.';
    } else {
      if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('Missing or invalid IndexNow key.');
      const location = new URL(validUrl(keyLocation, host));
      const prefix = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
      if (selected.some(url => !new URL(url).pathname.startsWith(prefix))) throw new Error('URL is outside the key file scope.');
      let keyVerified = false;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const check = await fetcher(location.toString(), { redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
          keyVerified = check.status === 200 && (await check.text()).trim() === key;
        } catch { keyVerified = false; }
        if (keyVerified) break;
        if (attempt < retries) await sleep(retryDelayMs * 2 ** attempt);
      }
      if (!keyVerified) throw new Error('Live IndexNow key file could not be verified; no URLs submitted.');
      for (let offset = 0; offset < selected.length; offset += batchSize) {
        const batch = selected.slice(offset, offset + batchSize);
        const entry = { count: batch.length, attempts: 0, http_status: null };
        result.batches.push(entry);
        for (let attempt = 0; attempt <= retries; attempt++) {
          entry.attempts++;
          let response;
          try {
            response = await fetcher(endpoint, { method: 'POST', redirect: 'error',
              signal: AbortSignal.timeout(timeoutMs), headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({ host, key, keyLocation, urlList: batch }) });
          } catch {
            if (attempt === retries) throw new Error('IndexNow network request failed; receipt is unknown for this batch.');
            await sleep(retryDelayMs * 2 ** attempt);
            continue;
          }
          entry.http_status = response.status;
          // Never log the response body: an upstream service might echo credentials.
          await response.body?.cancel();
          if (response.status === 200 || response.status === 202) {
            result[response.status === 200 ? 'accepted_count' : 'pending_count'] += batch.length;
            break;
          }
          const retryable = response.status === 429 || response.status >= 500;
          if (!retryable || attempt === retries) throw new Error(`IndexNow returned HTTP ${response.status}.`);
          const delay = retryDelay(response, attempt, retryDelayMs);
          // Do not retry earlier than Retry-After, or leave a runner waiting indefinitely.
          if (delay > 60000) throw new Error('IndexNow requested a retry after more than 60 seconds; retry in a later run.');
          await sleep(delay);
        }
      }
      result.status = result.pending_count ? 'pending_verification' : 'accepted';
      result.message = 'Receipt recorded. Indexing and ranking are not confirmed.';
    }
    await saveStatus(result, file);
    console.log(`IndexNow: ${result.status}; selected ${result.selected_count}, accepted ${result.accepted_count}, pending verification ${result.pending_count}.`);
    return result;
  } catch (error) {
    result.message = String(error.message).replaceAll(key || '\u0000', '[redacted]');
    result.status = result.accepted_count || result.pending_count ? 'partial_failure' : 'failed';
    await saveStatus(result, file);
    throw new Error(result.message);
  }
}

export async function waitForRevision(url, revision, deps = {}) {
  if (!/^[a-f0-9]{40}$/i.test(revision)) throw new Error('A full commit revision is required.');
  const target = new URL(url);
  if (target.protocol !== 'https:') throw new Error('The deployment marker must use HTTPS.');
  const fetcher = deps.fetch || fetch;
  const sleep = deps.sleep || pause;
  for (let attempt = 0; attempt < (deps.attempts || 30); attempt++) {
    try {
      target.searchParams.set('revision', revision);
      const response = await fetcher(target, { redirect: 'error', signal: AbortSignal.timeout(10000), headers: { 'Cache-Control': 'no-cache' } });
      if (response.status === 200 && (await response.text()).trim() === revision) return;
    } catch { /* The deployment may still be becoming available. */ }
    await sleep(15000);
  }
  throw new Error('Production did not confirm this revision; submission stopped.');
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'wait-live') return waitForRevision(args[0], args[1]);
  if (command === 'finalize') {
    try { await readFile(reportPath(), 'utf8'); return; } catch { /* No submission report. */ }
    const result = status(args[0]);
    result.status = args[1] === 'skipped' || !args[1] ? 'skipped' : 'failed';
    result.selected_count = result.accepted_count = result.pending_count = null;
    result.message = 'No submission receipt. Check workflow steps for missing configuration, deployment checks or selection errors.';
    return saveStatus(result);
  }
  throw new Error('Expected wait-live or finalize.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
