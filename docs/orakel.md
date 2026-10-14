# Rauhnächte oracle

Main page: `/de/rauhnaechte/orakel/`. The `/rauhnächte/orakel/` and `/rauhnaechte/orakel/` paths forward to it on the same host.

The artwork and intentions are provisional. Edit `de/rauhnaechte/orakel/cards.js` to replace them. Set `backImage` to the shared card back path and each card's `image` to its front artwork path. Paths are relative to the oracle page. Portrait images work best; fronts are displayed in full without cropping. Each card has a `title`, `meaning`, and `intention`. The number of choices follows the number of entries automatically.

The interaction starts with a closed deck. Opening scatters the cards across the table and continuously shuffles them until the visitor presses “Mischen stoppen”. Cards can then be selected and revealed with their meaning. Drawing again returns to the closed deck. No draws or personal data are stored. Keyboard buttons, focus management, status announcements, and reduced-motion support are included; reduced motion uses a still spread instead of continuous movement.

Publish these files through the existing Nokmali hosting process. The aliases do not configure domains: `nokmali.de` must serve this checkout or preserve the requested path when forwarding to the primary domain.
