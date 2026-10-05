# FreeHub hadeda artwork

Five reviewed poses of the original realistic hadeda: Welcome, Browse, Read, Direct and Recover. The navigation logo and favicon are unchanged.

- Transparent WebP variants use widths of 160, 320 and 640 pixels, all in a 4:5 frame.
- The largest file is 81,958 bytes. Keep each variant below 90,000 bytes.
- Render through `scripts/lib/mascot-renderer.js`; its internal manifest records exact dimensions and checksums.
- `scripts/lib/mascot-provenance.json` records the original reference fingerprint, prompts, generation mode and accepted master fingerprints. Artwork was produced with the built-in image-generation tool using the original as an identity reference.
- Generated masters, contact sheet and review screenshots are retained privately in the implementation checkout's ignored research folder. No rejected variants were needed.
- Mascots are brand decoration, separate from campaign imagery, listing facts and structured data. They must not imply provider endorsement or a guaranteed prize.
- Use an empty alternative text except for the identifying About illustration. Only Welcome and Recover receive a single 800ms greeting, disabled for reduced motion.

When updating artwork, increment the filename version and manifest together. Preserve the original face, feather colours, navy cap, FREEHUB lettering and lanyard. Review all five poses together before publication.
