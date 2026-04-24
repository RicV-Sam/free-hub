# free-hub POC

This project is a content-driven traffic and monetisation platform.

## Goals
- Generate low-cost traffic via display and DSP
- Engage users with content (games, video, competitions)
- Monetise via native ads and DCB flows
- Implement operator-aware targeting (Vodacom, MTN, Telkom)

## Stack
- Next.js
- Vercel
- Supabase
- GA4

## Status
POC / MVP

## Competition Maintenance
- Dry-run audit (expired, closing soon, keyword coverage):
  - `node scripts/competition-maintenance.js`
- Archive expired competitions and remove them from active list:
  - `node scripts/competition-maintenance.js --archive-expired`
- Regenerate static pages after updates:
  - `node scripts/generate-pages.js`
