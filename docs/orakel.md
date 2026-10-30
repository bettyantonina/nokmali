# Rauhnächte oracle

Main page: `/de/rauhnaechte/orakel/`. The `/rauhnächte/orakel/` and `/rauhnaechte/orakel/` paths forward to it on the same host.

The deck currently contains all 20 finished designs in `orakelkarten/` (excluding the shared cover). Each `fullDesign` image is displayed intact and exported as a PNG at its original resolution, without additional frames or text. Accompanying meanings and intentions are editable drafts. Edit `de/rauhnaechte/orakel/cards.js` to replace them. Set `backImage` to the shared card back path and each card's `image` to its front artwork path. Paths are relative to the oracle page. Portrait images work best; fronts are displayed in full without cropping. Each card has a `title`, `meaning`, and `intention`. The number of choices follows the number of entries automatically.

The interaction follows the Claude v2 design handoff in `orakelUI.zip` (README and HTML/JS prototype; the archive contains no video). It uses a full-viewport stage with Mischen, Wählen, and Lesen phases. Holding the deck starts a gentle drift shuffle with a three-second minimum; release lets the cards slow into loose rows. One tap selects and lifts a card, then it flies to the reading position and turns over. Mobile reading uses one scroll column with a large intact artwork and a “Lesen” cue; desktop uses a card and text panel side by side. Drawing again or “Neu beginnen” clears timers and restores the closed deck. Reduced motion skips drift and places shuffled cards immediately. Space/Enter can shuffle or choose, and arrow keys move between choices. Focus management, status announcements, pointer cancellation, and focus-loss handling are included.

Visitors can still download or share an original-resolution PNG, and “Alle Karten ansehen” opens a lazy-loaded gallery whose cards can be read individually. Export is prepared only for a revealed card. No card history or email addresses are stored; retired history data is removed on load.

Publish these files through the existing Nokmali hosting process. The aliases do not configure domains: `nokmali.de` must serve this checkout or preserve the requested path when forwarding to the primary domain.


## Viewing assets

Run `python3 scripts/optimize_orakel_assets.py` from the repository root (requires Pillow and fontTools) after changing card artwork. The deck uses 640px WebP viewing images and 320px gallery thumbnails in `de/rauhnaechte/orakel/art/cards/`. Original PNG paths remain in `originalImage` for full-resolution exports, loaded only when saving or sharing. The cover is preloaded; gallery images are assigned only when the gallery opens. Compact Latin WOFF font subsets are local to the Orakel page; source fonts remain unchanged.
