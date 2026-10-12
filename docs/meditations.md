# Rauhnächte meditation recordings

Page: `https://nokmali.com/de/meditation/`

The twelve entries live in `de/meditation/index.html`. The first is **Ground and Spark**; the other titles are intentionally undecided. An empty `data-audio-src` keeps an entry unavailable without requesting a missing audio file.

To add a recording:

1. Put the finished audio file in `de/meditation/audio/` (create the folder when adding the first recording). MP3 is a suitable default; an externally hosted HTTPS audio URL also works.
2. Set that entry's source, for example `data-audio-src="/de/meditation/audio/ground-and-spark.mp3"`.
3. Update its `.track-title` when the title is known. Remove `lang="en"` if replacing an English title with German.
4. Keep the numbered ID unchanged. The script automatically enables the full row and changes its availability label. Only one recording plays at a time; the player includes native pause, seeking and volume controls where supported.
5. Check playback on a phone, then publish the updated page and audio together using the website's existing deployment process. Bump the stylesheet or script version in the HTML if those files change.

## Stable QR destinations

Use the page URL above for the collection, or these links for individual entries. They remain valid when a title or audio filename changes:

```text
https://nokmali.com/de/meditation/#meditation-01
https://nokmali.com/de/meditation/#meditation-02
https://nokmali.com/de/meditation/#meditation-03
https://nokmali.com/de/meditation/#meditation-04
https://nokmali.com/de/meditation/#meditation-05
https://nokmali.com/de/meditation/#meditation-06
https://nokmali.com/de/meditation/#meditation-07
https://nokmali.com/de/meditation/#meditation-08
https://nokmali.com/de/meditation/#meditation-09
https://nokmali.com/de/meditation/#meditation-10
https://nokmali.com/de/meditation/#meditation-11
https://nokmali.com/de/meditation/#meditation-12
```

A QR destination scrolls to and highlights its entry. Playback starts only after a tap, as required by mobile browsers. Do not print production QR codes until the public URL has been deployed and checked.
