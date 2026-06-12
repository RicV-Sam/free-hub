# New Page Checklist

Use this checklist when adding a new public Freehub page, route, template or generated page family.

## Required follow-up paths

Every public content page must include:

- WhatsApp Channel link pointing to the shared `WHATSAPP_CHANNEL_URL` value.
- Google/email signup support through `renderGlobalAuthPanel()` and `/shared/auth-ui.js`.

The preferred baseline is to render `renderSiteFooter()` on the page. The footer includes both the WhatsApp Channel link and the global auth panel.

Homepage, hub, category, tag, brand and vertical pages may also include stronger in-page CTAs:

- `renderWhatsAppChannelCta()` for a visible WhatsApp follow prompt.
- `renderGlobalAuthPanel()` for contextual email alerts.

## Exception

`/out/*` redirect pages are intentionally excluded. They are noindex/nofollow redirect pages to official promoter sources and should not include normal content-page CTAs.

## Before shipping

Run:

```bash
node scripts/generate-pages.js
```

The generator checks public content pages for the WhatsApp Channel URL, the auth panel hook and the auth UI script.
