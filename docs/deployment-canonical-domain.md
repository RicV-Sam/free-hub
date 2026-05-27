# Deployment canonical domain guard

Freehub's canonical production domain is:

- `https://freehub.co.za`

The legacy/stale deployment host `https://freehub.datacost.co.za` must not remain an indexable copy of the site.

## Required hosting action

This repository currently controls the GitHub Pages custom domain through `CNAME`, which is set to `freehub.co.za`. It does not contain a safe repo-level redirect rule for `freehub.datacost.co.za`; adding a blanket static redirect file to this same artifact could also affect the canonical domain on hosts that do not support host-conditional redirects.

Configure the old `freehub.datacost.co.za` host outside this repo with a permanent host-level redirect:

```text
https://freehub.datacost.co.za/*  ->  https://freehub.co.za/:splat  301
```

If the old host cannot support a 301 redirect, remove the old deployment or apply `noindex, follow` to every response from that host until it can be redirected.

## Verification

After changing DNS or hosting config, confirm:

- `https://freehub.datacost.co.za/` returns `301` to `https://freehub.co.za/`.
- A deep URL such as `https://freehub.datacost.co.za/competitions/` returns `301` to `https://freehub.co.za/competitions/`.
- The canonical site still serves `200` on `https://freehub.co.za/`.
