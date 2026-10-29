# Rauhnächte oracle

Main page: `/de/rauhnaechte/orakel/`. The `/rauhnächte/orakel/` and `/rauhnaechte/orakel/` paths forward to it on the same host.

The deck currently contains all 20 finished designs in `orakelkarten/` (excluding the shared cover). Each `fullDesign` image is displayed intact and exported as a PNG at its original resolution, without additional frames or text. Accompanying meanings and intentions are editable drafts. Edit `de/rauhnaechte/orakel/cards.js` to replace them. Set `backImage` to the shared card back path and each card's `image` to its front artwork path. Paths are relative to the oracle page. Portrait images work best; fronts are displayed in full without cropping. Each card has a `title`, `meaning`, and `intention`. The number of choices follows the number of entries automatically.

The interaction starts with a closed deck. Holding the deck with a mouse, touchpad, touch, Space, or Enter opens it and shuffles the cards. Releasing stops movement immediately so a card can be chosen. The hold-to-shuffle button allows another shuffle before choosing. Losing focus or cancelling touch also stops movement. Drawing again returns to the closed deck. No card history or email addresses are stored. Visitors can download or share a PNG of the revealed card; browsing the full deck is also available. Any localStorage data from the retired history feature is removed on load. Keyboard buttons, focus management, status announcements, and reduced-motion support are included; reduced motion uses a still spread instead of continuous movement.

Publish these files through the existing Nokmali hosting process. The aliases do not configure domains: `nokmali.de` must serve this checkout or preserve the requested path when forwarding to the primary domain.


## Viewing assets

Run `python3 scripts/optimize_orakel_assets.py` from the repository root (requires Pillow and fontTools) after changing card artwork. The deck uses 640px WebP viewing images and 320px gallery thumbnails in `de/rauhnaechte/orakel/art/cards/`. Original PNG paths remain in `originalImage` for full-resolution exports, loaded only when saving or sharing. The cover is preloaded; gallery images are assigned only when the gallery opens. Compact Latin WOFF font subsets are local to the Orakel page; source fonts remain unchanged.
