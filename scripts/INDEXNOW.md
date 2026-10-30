# IndexNow change notifications

After deployment, the notifier waits for the live revision marker, reads the live sitemap and hashes live HTML. It compares that snapshot with the latest indexnow-state artifact on main. Only added, changed or removed sitemap URLs are notified, in groups of at most ten. Another revision check stops submissions if production changes during the snapshot.

A no-change deployment makes no IndexNow requests. State is saved only after successful notification. Live sitemap and page reads retry network/body-read failures, HTTP 429 and HTTP 5xx up to twice, with 2-second then 4-second delays unless Retry-After specifies a delay. A requested delay above 60 seconds stops the run instead of retrying early. Page reads use at most two concurrent requests. Other HTTP failures stop immediately; exhausted retries, invalid sitemaps, API or state-download errors still stop the run without saving a partial snapshot. Receipt is not proof of indexing.

The committed baseline records the live site before this integration. Nature requests one homepage notification on initial adoption, then drops that bootstrap flag from saved state. Do not refresh the baseline casually: it could hide changes awaiting notification.

Artifacts are retained for 90 days. If prior state artifacts expire, restore a reviewed snapshot from the last successful notification instead of resetting state automatically. Tests: node --test scripts/notify-indexnow.test.mjs.

FreeHub and Spinnit retain their existing configured keys. Nature uses scripts/indexnow-key.txt with a matching publicly served verification file. IndexNow requires that public file; change both sides together when rotating the protocol key.
