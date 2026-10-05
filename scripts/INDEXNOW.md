# IndexNow change notifications

After deployment, the notifier waits for the live revision marker, reads the live sitemap and hashes live HTML. It compares that snapshot with the latest indexnow-state artifact on main. Only added, changed or removed sitemap URLs are notified, in groups of at most ten. Another revision check stops submissions if production changes during the snapshot.

A no-change deployment makes no IndexNow requests. State is saved only after successful notification. Sitemap, page, API or state-download errors stop the run. Receipt is not proof of indexing.

The committed baseline records the live site before this integration. Nature requests one homepage notification on initial adoption, then drops that bootstrap flag from saved state. Do not refresh the baseline casually: it could hide changes awaiting notification.

Artifacts are retained for 90 days. If prior state artifacts expire, restore a reviewed snapshot from the last successful notification instead of resetting state automatically. Tests: node --test scripts/notify-indexnow.test.mjs.

FreeHub and Spinnit retain their existing configured keys. Nature uses scripts/indexnow-key.txt with a matching publicly served verification file. IndexNow requires that public file; change both sides together when rotating the protocol key.