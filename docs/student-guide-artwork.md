# Student guide artwork and pre-deployment polish

Created 7 September 2026 using the built-in image generation tool (not CLI/API fallback). Images were inspected, then exported as JPEGs for web delivery. Originals remain in Codex generated_images; deployable assets are in the repository.

## Final files

- `assets/student-guide/campus-study-1200.jpg` — 1200 × 675, 193,385 bytes; visible guide illustration, Article image and social preview.
- `assets/student-guide/campus-study-640.jpg` — 640 × 360, 69,227 bytes; responsive small-screen export of the same artwork.
- `assets/student-guide/student-tools-square.jpg` — 1080 × 1080, 242,067 bytes; companion artwork available for future social posts. Not loaded by the guide.

The page caption identifies the artwork as AI-created illustration. No actual institution, student identity, provider logo or promotional claim is depicted. Width/height and responsive sources reserve layout space and limit image payload.

## Exact generation prompts

### Campus illustration

Use case: illustration-story. Create a polished editorial illustration for FreeHub's South African student freebies and discounts guide. Wide landscape 16:9 composition. Three diverse adult university students studying together at a campus table with a laptop, notebooks, headphones and reusable water bottle; subtle South African campus setting, no specific named university. Warm, thoughtful contemporary print-editorial illustration, fine paper texture, natural proportions, confident shapes, navy #102036, deep teal #0f766e, warm cream and restrained golden yellow matching FreeHub. Focus on learning and practical student life, not prizes or luxury. Balanced composition with all important subjects within the central 75% so a social crop works. No lettering, no logos, no provider marks, no prices, no discount percentages, no flags, no graduation caps, no watermark. This is illustrative artwork, not a photograph or depiction of real identified students.

### Square companion

Use case: illustration-story. Square editorial illustration for FreeHub's South African student freebies and discounts guide, companion to a warm campus study illustration. Top-down practical student desk: a navy laptop with abstract teal study-note shapes on its screen (no readable text), cream notebook, pencil, teal backpack edge, headphones and a reusable golden-yellow water bottle. Warm cream tabletop, subtle leafy shadows, contemporary print-editorial style with fine paper grain, clear confident shapes and tactile texture. Palette deep navy #102036, teal #0f766e, cream and restrained golden yellow. Keep objects in a balanced central composition with generous outer margins for small social previews. No people, no text, no prices, no discount percentages, no logos or provider marks, no cash or credit cards, no graduation cap, no watermark. Represent useful student learning tools, not a giveaway prize.

## Implemented polish

Visible FreeHub byline links to About; the Article author URL agrees. Student-only Article/social image fields now use the local campus artwork. Open Graph type is article, with image dimensions, descriptive alternate text and publication/review fields. Other pages retain their existing image defaults. Removed the unverified promotional amount and internal research-brief wording from Table Mountain's public entry.

Publication remains a separate action. If publishing later, confirm the actual first-publication date without changing research dates automatically. Cloudflare's broader reuse policy was not broadened: allowing full reproduction is a content-rights choice, not a necessary metadata fix. Existing repository-wide validation failures remain separately documented.
