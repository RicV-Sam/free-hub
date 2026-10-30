import test from 'node:test';
import assert from 'node:assert/strict';
import { changedUrls, snapshot, stableHtml } from './notify-indexnow.mjs';
test('Cloudflare email randomization does not count as a content change', () => {
  const a = '<a data-cfemail="e9818c858586a98f9b8c8c819c8bc78a86c79388">email</a>';
  const b = '<a data-cfemail="e58d8089898aa5839780808d9087cb868acb9f84">email</a>';
  assert.equal(stableHtml(a), stableHtml(b));
  assert.notEqual(stableHtml(a), stableHtml(b.replace('e58d', 'e58c')));
});
test('only additions, content changes and removals are selected', () => {
  const previous = { schema_version: 1, host: 'example.com', pages: { a: 'same', b: 'old', c: 'removed' } };
  const current = { schema_version: 1, host: 'example.com', pages: { a: 'same', b: 'new', d: 'added' } };
  assert.deepEqual(changedUrls(previous, current), ['b', 'c', 'd']);
  assert.deepEqual(changedUrls(current, current), []);
  assert.throws(() => changedUrls(previous, { ...current, host: 'other.com' }));
});
test('nested sitemap snapshots are stable and failures never imply deletion', async () => {
  const documents = {
    'https://example.com/sitemap.xml': '<sitemapindex><sitemap><loc>https://example.com/child.xml</loc></sitemap></sitemapindex>',
    'https://example.com/child.xml': '<urlset><url><loc>https://example.com/a/</loc></url></urlset>',
    'https://example.com/a/': '<html>example</html>',
  };
  const fetcher = async url => new Response(documents[url], { status: documents[url] ? 200 : 404 });
  const a = await snapshot('https://example.com', fetcher);
  assert.equal(Object.keys(a.pages).length, 1);
  assert.deepEqual(changedUrls(a, await snapshot('https://example.com', fetcher)), []);
  await assert.rejects(snapshot('https://example.com', async () => new Response('', { status: 503 }), '/sitemap.xml', { sleep: async () => {} }));
  await assert.rejects(snapshot('https://example.com', async () => new Response('<urlset/>')));
  await assert.rejects(snapshot('https://example.com', async () => new Response('<urlset><loc>https://other.com/a/</loc></urlset>')));
});

test('temporary sitemap and page errors recover without losing URLs', async () => {
  const attempts = new Map();
  const delays = [];
  const documents = {
    'https://example.com/sitemap.xml': '<urlset><loc>https://example.com/a/</loc></urlset>',
    'https://example.com/a/': '<html>recovered page</html>',
  };
  const fetcher = async url => {
    const count = (attempts.get(url) || 0) + 1;
    attempts.set(url, count);
    return count < 3 ? new Response('temporary failure', { status: 503 }) : new Response(documents[url]);
  };
  const recovered = await snapshot('https://example.com', fetcher, '/sitemap.xml', { sleep: async ms => delays.push(ms) });
  const healthy = await snapshot('https://example.com', async url => new Response(documents[url]));
  assert.deepEqual(recovered.pages, healthy.pages);
  assert.deepEqual([...attempts.values()], [3, 3]);
  assert.deepEqual(delays, [2000, 4000, 2000, 4000]);
});

test('snapshot retries network and interrupted body reads', async () => {
  const delays = [];
  let attempts = 0;
  const fetcher = async () => {
    attempts++;
    if (attempts === 1) throw new TypeError('connection reset');
    if (attempts === 2) return new Response(new ReadableStream({ start(controller) { controller.error(new Error('body interrupted')); } }));
    return new Response('<urlset><loc>https://example.com/a/</loc></urlset>');
  };
  const result = await snapshot('https://example.com', fetcher, '/sitemap.xml', { sleep: async ms => delays.push(ms) });
  assert.deepEqual(Object.keys(result.pages), ['https://example.com/a/']);
  assert.equal(attempts, 4);
  assert.deepEqual(delays, [2000, 4000]);
});

test('snapshot respects Retry-After and releases unsuccessful response bodies', async () => {
  let attempts = 0;
  let cancellations = 0;
  const delays = [];
  const fetcher = async () => {
    if (++attempts === 1) return new Response(new ReadableStream({ cancel() { cancellations++; } }), { status: 429, headers: { 'Retry-After': '7' } });
    return new Response('<urlset><loc>https://example.com/a/</loc></urlset>');
  };
  await snapshot('https://example.com', fetcher, '/sitemap.xml', { sleep: async ms => delays.push(ms) });
  assert.deepEqual(delays, [7000]);
  assert.equal(cancellations, 1);
});

test('snapshot stops rather than retrying before a long Retry-After', async () => {
  let attempts = 0;
  const delays = [];
  await assert.rejects(snapshot('https://example.com', async () => {
    attempts++;
    return new Response('', { status: 503, headers: { 'Retry-After': '61' } });
  }, '/sitemap.xml', { sleep: async ms => delays.push(ms) }), /retry exceeds 60 seconds/);
  assert.equal(attempts, 1);
  assert.deepEqual(delays, []);
});

test('an interrupted error response body does not prevent recovery', async () => {
  let attempts = 0;
  const fetcher = async () => {
    if (++attempts === 1) return new Response(new ReadableStream({ start(controller) { controller.error(new Error('body interrupted')); } }), { status: 503 });
    return new Response('<urlset><loc>https://example.com/a/</loc></urlset>');
  };
  const result = await snapshot('https://example.com', fetcher, '/sitemap.xml', { sleep: async () => {} });
  assert.deepEqual(Object.keys(result.pages), ['https://example.com/a/']);
  assert.equal(attempts, 3);
});

test('persistent page failures reject the entire snapshot after bounded retries', async () => {
  let pageAttempts = 0;
  const delays = [];
  await assert.rejects(snapshot('https://example.com', async url => {
    if (url.endsWith('/sitemap.xml')) return new Response('<urlset><loc>https://example.com/a/</loc></urlset>');
    pageAttempts++;
    return new Response('', { status: 503 });
  }, '/sitemap.xml', { sleep: async ms => delays.push(ms) }), /HTTP 503 for https:\/\/example.com\/a\//);
  assert.equal(pageAttempts, 3);
  assert.deepEqual(delays, [2000, 4000]);
});

test('permanent page errors stop immediately without retries', async () => {
  let pageAttempts = 0;
  const delays = [];
  await assert.rejects(snapshot('https://example.com', async url => {
    if (url.endsWith('/sitemap.xml')) return new Response('<urlset><loc>https://example.com/a/</loc></urlset>');
    pageAttempts++;
    return new Response('', { status: 404 });
  }, '/sitemap.xml', { sleep: async ms => delays.push(ms) }), /HTTP 404/);
  assert.equal(pageAttempts, 1);
  assert.deepEqual(delays, []);
});

test('snapshot limits simultaneous page reads to two', async () => {
  let active = 0;
  let maximum = 0;
  const urls = ['a', 'b', 'c', 'd'].map(slug => `https://example.com/${slug}/`);
  const fetcher = async url => {
    if (url.endsWith('/sitemap.xml')) return new Response(`<urlset>${urls.map(page => `<loc>${page}</loc>`).join('')}</urlset>`);
    active++;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    return new Response('<html>page</html>');
  };
  const result = await snapshot('https://example.com', fetcher);
  assert.deepEqual(Object.keys(result.pages), urls);
  assert.equal(maximum, 2);
});
