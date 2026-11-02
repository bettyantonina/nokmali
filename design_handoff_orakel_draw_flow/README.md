# Handoff: Rauhnächte Orakel — new draw flow (v2)

## Overview
A redesign of the card-drawing interaction on `de/rauhnaechte/orakel/` (nokmali.com/de/rauhnaechte/orakel/). It replaces the current flow: cards scatter instantly, hold-to-shuffle runs on a separate button, cards move with drag, and a card is revealed with a double-tap. The new flow has three clear phases and one gesture each:

1. **Mischen (shuffle):** press and hold the deck → the cards spread out from the deck and drift slowly around the whole screen. The shuffle always runs for at least 3 s, even for a short tap. After release, the drifting slows down and each card glides into its place in loose rows.
2. **Wählen (choose):** a single tap on a card lifts it briefly and opens it. There is no confirm step, no double-tap and no dragging.
3. **Lesen (read):** the chosen card flies from its table position to the reading position, grows large and turns over. The other cards fade out, then the text panel appears.

**Primary target: mobile.** Most visitors arrive via QR code on a phone. All decisions below favour portrait phones (360–430 px wide).

## About the design files
The files in this bundle are **design references created in HTML**: a working prototype that shows the intended look, motion and behaviour. They are not production code to drop in as-is. Recreate the behaviour inside the existing `de/rauhnaechte/orakel/` page (plain HTML/CSS/JS, no framework). That means replacing the table/shuffle/choose/reveal parts of `orakel.js` and `orakel.css` while keeping what the live page already has:
- the `cards.js` data
- image export / share (`prepareExport`, `save-card`)
- the "Alle Karten ansehen" (view all cards) gallery
- text pagination, if wanted

## Fidelity
**High-fidelity** for motion, timing, layout and copy. Colours, fonts and card art are taken directly from the live `orakel.css` / `cards.js`.

## Screens / phases
The whole experience is one full-viewport stage (`position:fixed; inset:0`). It is a CSS grid with a single column and three rows: `auto` (top bar) / `minmax(0,1fr)` (table) / `auto` (dock). Each child is placed explicitly with `grid-area` (`.top 1/1`, `.table 2/1`, `.dock 3/1`, `.reading 2/1/4/2`). Without that, auto-placement creates extra columns. `stage[data-phase]` takes `deck | spreading | choose | reveal`. `stage[data-wash]` is set while cards drift.

### Top bar (all phases)
- 60 px min-height, padding 10px 18px (mobile 8px 14px).
- Left: brand, a 36 px bowl logo + "Nokmali" in the display font, 24 px (mobile 21 px), colour `--ink`.
- Right: in the deck phase, the pill link "Zu den Meditationen". In every other phase, the pill button "← Neu beginnen", which resets.
- Pill: 40 px min-height, padding 8px 16px, 1px border `#3e625880`, radius 30px, colour `--teal`, 13 px. Hover: bg `#3e625810`, colour `--ink`.

### 1 · Deck (`data-phase="deck"`)
- An intro sits over the top of the table area, centred:
  - eyebrow "Deine Rauhnächte · Orakel": 11px/600, uppercase, letter-spacing .15em, `--teal`
  - h1 "Zieh deine Karte": display font, weight 300, `clamp(36px,6vw,56px)`, line-height 1.08, letter-spacing −.03em
  - copy "Für einen Tag, eine Woche oder einen Monat – du entscheidest. Atme durch. Komm bei dir an. Folge deinem Gefühl.": 16 px, `--soft`, max-width 520 px
  - At `max-height:640px`, hide the copy paragraph and shrink the h1 to `clamp(30px,5vw,42px)`.
- Deck: 20 card elements stacked in the free space below the intro.
  - Card width `cw = clamp(min(W*0.36, (H − introH − 32)*0.8/1.5), 56, 172)`, height `cw*1.5`.
  - Stack offset per card k: x −0.25k px, y −0.5k px.
  - Each card has a fixed random tilt of ±0.9°, generated once per card. Don't derive the tilt from stack position; that causes jitter when the order changes.
  - The deck centre is clamped so the bottom keeps at least 18 px clearance.
- An invisible hit button covers the top card plus 6–8 px: `touch-action:none`, cursor grab, contextmenu prevented.
- Dock copy: "Halte das Deck gedrückt, um zu mischen." with the small line "Lass los, wenn es sich richtig anfühlt."

### 2 · Shuffle → settle (`data-wash`, then `data-phase="spreading"`)
- When the press starts, the intro fades out (opacity 0, translateY −12px, .4s).
- Each card drifts on a smooth looping path: two sine waves per axis.
  - Weights .62 / .38; frequencies 0.07–0.12 and 0.14–0.22 cycles/s; random phases.
  - Rotation swings ±18–50° at 0.06–0.14 cycles/s.
  - The drift range covers the whole table, inset by ~0.62 × half the card diagonal so cards stay on screen.
  - Cards blend in from the deck over 1.6 s (smoothstep) and scale to the final slot scale × 1.04.
- Run it from requestAnimationFrame. Cap frame time at 34 ms so a dropped frame doesn't make cards jump.
- Minimum duration: **3 s from press start**. If released earlier, the dock says "Die Karten mischen sich …" / "Einen Moment noch." While holding, it says "Die Karten mischen sich …" / "… solange du hältst."
- Settle, which starts once the minimum time has passed and the press is released:
  - Assign each row slot the nearest drifting card (greedy, nearest first) so paths stay short.
  - Each card blends from its live drift position to its slot over 1500 ms with ease-out cubic. Stagger: `k*45ms + random(0–120ms)`.
  - Drift time keeps running, but its speed falls to zero over the settle (multiply time by `1 − smoothstep(progress)`), so motion slows rather than stops dead.
  - **Stacking order:** during settle, keep each card's current z-index (raise all of them by +n). Switch a card to its final slot z-index only once it is 90 % of the way to its slot. Switching every card's z-index at the start of settle causes a visible jolt.
  - Dock: "Die Karten finden ihren Platz …"
- Row layout (computeSlots):
  - Available area = table W−32 × H−28. Try 4–8 columns, and pick the one that gives the largest card width.
  - Card width ≤ 132 px and ≤ 0.9 × column width. If the rows don't fit, rows may overlap down to a 0.6 × card-height row step.
  - Row step = `min(h*1.08, (aH−h)/(rows−1))`; column step = `min(w*1.14, aW/cols)`. A short last row is centred.
  - Per-card jitter: x ±4 px, y ±4 px, rotation ±4.5°. Use a fixed pseudo-random value per slot index.
  - Later rows overlap earlier ones (z-index increases in reading order).
  - Typical results: 390×470 table → 4 columns × 5 rows at about 80 px wide; desktop → 7 columns × 3 rows at 130 px.
- Reduced motion: skip the drift, reorder randomly, place the cards in their slots instantly.

### 3 · Choose (`data-phase="choose"`)
- Dock: "Wähle eine Karte, die dich anspricht." / "Tippe sie an, um sie aufzudecken."
- Tapping a card:
  - The card lifts by translateY(−16 % of its height) along its own axis and scales ×1.1.
  - Ring: `0 0 0 2px #F7F6F0, 0 0 0 4px #BE9860`, plus shadow `0 18px 34px #20374438`.
  - z-index 500. Other cards dim with a paper-coloured overlay at 55 % opacity.
  - After **280 ms** the reveal starts on its own. Ignore further taps once a card is chosen.
- Cards use `touch-action:manipulation`.
- Keyboard: cards are buttons; ←/→ moves focus; Enter/Space opens.

### 4 · Read (`data-phase="reveal"`)
- The dock fades out. The reading section covers the table and dock rows and sits above the table layer (`position:relative; z-index:5`; table `z-index:0`).
- **Mobile (≤700 px), the main case:**
  - The reading section is a single scroll column (`overflow-y:auto; overscroll-behavior:contain`).
  - The card is as large as the screen allows: `width:min(100vw − 40px, (100dvh − 150px)/1.5)`, aspect ratio 2/3, centred.
  - A small "Lesen ↓" cue (13 px, teal, arrow bobbing 4 px over 1.8 s) sits below the card and scrolls to the panel.
  - The panel follows below and scrolls with the page, with no inner scroll box.
- **Desktop:**
  - Two columns, `.8fr / 1.2fr`, max-width 1100 px, gap `clamp(24px,4vw,56px)`, grid rows `minmax(0,1fr)`.
  - The card is `min(80dvh,640px)` tall.
  - The panel stretches to the full height. Only the text area scrolls; the panel itself is `overflow:hidden`. Below 480 px of height, the panel scrolls as a whole.
- Motion (FLIP):
  - Measure the final card position, then start the card at the tapped card's on-screen centre, rotation and scale.
  - Move it to its final position over **800 ms**, `cubic-bezier(.2,.8,.2,1)`.
  - It turns over (rotateY 180°, 850 ms, `cubic-bezier(.3,.7,.2,1)`) starting at **380 ms**.
  - The original table card hides instantly.
  - The other cards slide back to a stack at the table centre at scale .6 and fade out, staggered 12 ms × distance from the chosen card.
  - The panel fades in and rises from translateY(14px) to 0 at **1050 ms**. It then takes focus (`outline:none`).
- Panel:
  - bg `--panel`, 1px `--line` border, radius 12, padding 24 (mobile 20/18), shadow `0 12px 32px #243b4910`.
  - Eyebrow "Deine Karte".
  - h2 title: display 400, 32 px (mobile 27).
  - Meaning: paragraphs split on blank lines, 16/1.6 (mobile 15/1.55), `--soft`. Cards with no text show the italic placeholder "Raum für deine eigene Deutung. Was zeigt dir das Bild heute?"
  - Impulse block: top border, eyebrow from `promptLabel` (default "Deine Intention"), then the intention text in the display font at 22 px (19 px on mobile or below 640 px height), `--teal`.
  - Actions: primary "Noch eine Karte ziehen ↻" resets; ghost "Bild speichern". Production should use the existing share/export.
- Reset: clear all state and timers. Cards return to the deck stack and fade in, 10 ms stagger from the top. The intro returns.

## State
- `phase`: deck → spreading → choose → reveal → (reset) deck
- `order[]`: card indices by stack/slot position
- per-card `{x,y,r,s,lift}` in table coordinates
- `slots[]` (computed per layout/resize)
- `holding`, `holdStart`, `minUntil` (holdStart + 3000)
- drift parameters per card, `settling {start, dur, delay[], landed[]}`
- `selected`

On resize: deck → re-place the stack instantly; choose → recompute slots and place them instantly.

## Design tokens (from live orakel.css)
- `--paper #E7ECE9` (page / table)
- `--ink #203744`
- `--soft #42554e`
- `--teal #3E6258`, hover/dark `#304d48`
- `--line #bbc9c2`
- `--panel #F7F6F0`
- `--accent #BE9860` (selection ring)
- card back: `#efe4ce` with `cover.webp` as `contain`
- Paper shadow: `0 1px 0 #e5dbc6, 0 2px 0 #b9af9b, 0 3px 2px #413c3126, 0 7px 10px #2037441f, 0 16px 24px #20374412`
- Stacked deck layers use a light shadow (`0 1px 0 #d9cfb8, 0 1px 1px #463d2d1f`); only the bottom card gets the full drop shadow.
- Radius: cards 12 px, panel 12 px, buttons/pills 30 px
- Buttons: 48 px min-height, padding 12px 24px, 15 px. Primary: teal bg, `#faf7f0` text. Ghost: transparent, teal text, `#3e625880` border.
- Fonts: display "Oracle Else" (FluxischElse Light 300 / Regular 400 woff); body "Avenir Next", Avenir, system-ui
- Dock: steps row (11px/600, uppercase, .15em, a 6 px dot per step; on = teal, done = soft), status text 16 px (`min-height:44px`), actions row (`min-height:48px`), bottom padding `max(18px, env(safe-area-inset-bottom))`

## Assets
Everything already exists in the repo:
- `de/rauhnaechte/orakel/art/cards/*.webp` (cover, full card images, thumbs)
- `art/fonts/FluxischElse-*.woff`
- `art/nokmali-bowl-logo.png`
- data from `cards.js`

## Files
- `Rauhnaechte Orakel - Ziehen v2.html`: markup + all CSS
- `orakel-v2.js`: all behaviour (geometry, drift shuffle, settle, choose, FLIP reveal, reset)

To run the prototype locally, put both files at the repo root. They reference `de/rauhnaechte/orakel/cards.js` and the art paths above.
