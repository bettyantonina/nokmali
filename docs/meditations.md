# Rauhnächte meditation recordings

Page: `https://nokmali.com/de/rauhnaechte/`

The twelve entries live in `de/rauhnaechte/index.html`. This collection is the single source for their titles and audio URLs. The first is **Ankomment und den Funken entdecken**; the other titles are intentionally undecided. An empty `data-audio-src` keeps an entry unavailable without requesting a missing audio file.

To add a recording:

1. Put the finished audio file in `de/rauhnaechte/audio/` (create the folder when adding the first recording). MP3 is a suitable default; an externally hosted HTTPS audio URL also works.
2. Set that entry's source in the collection, for example `data-audio-src="./audio/ground-and-spark.mp3"`. Relative URLs also work in local file previews.
3. Update its `.track-title` when the title is known. Remove `lang="en"` if replacing an English title with German.
4. Keep the numbered ID unchanged. The script automatically enables the full row and changes its availability label. Only one recording plays at a time; the player includes native pause, seeking and volume controls where supported.
5. Run `python3 scripts/build_rauhnaechte_pages.py` to update all twelve recording pages. Do not edit the numbered pages directly: their titles, audio URLs, metadata and asset paths are generated from the collection. Run this after collection, style-version or script-version changes too.
6. Check playback on the collection and the numbered page on a phone, then publish the collection, generated pages and audio together using the website's existing deployment process. Bump the stylesheet or script version in the collection HTML if those files change.

## Stable QR destinations

Use the page URL above for the collection, or these links for individual entries. They remain valid when a title or audio filename changes:

```text
https://nokmali.com/de/rauhnaechte/01
https://nokmali.com/de/rauhnaechte/02
https://nokmali.com/de/rauhnaechte/03
https://nokmali.com/de/rauhnaechte/04
https://nokmali.com/de/rauhnaechte/05
https://nokmali.com/de/rauhnaechte/06
https://nokmali.com/de/rauhnaechte/07
https://nokmali.com/de/rauhnaechte/08
https://nokmali.com/de/rauhnaechte/09
https://nokmali.com/de/rauhnaechte/10
https://nokmali.com/de/rauhnaechte/11
https://nokmali.com/de/rauhnaechte/12
```

Each QR destination opens a real, standalone HTML page for that recording, with its own title, player button and link back to the collection. GitHub Pages adds the trailing slash automatically. Playback starts after a tap, so the links work with mobile autoplay restrictions. No audio file is requested for an unpublished recording.

The previous `/de/meditation/` address forwards to the new collection; old `#meditation-01` through `#meditation-12` links forward to the matching numbered page. With JavaScript disabled, the old address falls back to the collection. Do not print production QR codes until the public URL has been deployed and checked.
