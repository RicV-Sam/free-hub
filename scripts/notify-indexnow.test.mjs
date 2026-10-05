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
  await assert.rejects(snapshot('https://example.com', async () => new Response('', { status: 503 })));
  await assert.rejects(snapshot('https://example.com', async () => new Response('<urlset/>')));
  await assert.rejects(snapshot('https://example.com', async () => new Response('<urlset><loc>https://other.com/a/</loc></urlset>')));
});
