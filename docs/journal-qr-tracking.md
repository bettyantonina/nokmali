# Printed journal attribution — permanent edition 1 mappings

The printed first-party URLs stay on their visualisation or oracle page:

- `/de/rauhnaechte/01/?qr=v01` through `/de/rauhnaechte/12/?qr=v12`
- `/de/rauhnaechte/orakel/?qr=o01` through `?qr=o12`

**Never reuse or change these tags for another edition.** Assign future editions
new short tags and their own mappings. No QR redirect service is involved.

`journal-analytics.js` expands valid tags using `history.replaceState` before
loading or initializing the existing PostHog project. The pathname, QR tag, other
query parameters and fragment remain intact. No coaching redirect occurs.

| Parameter | Edition 1 value |
| --- | --- |
| utm_source | amazon-kdp |
| utm_medium | book |
| utm_campaign | die-12-naechte-edition-1 |
| utm_content | meditation-01 … meditation-12 for v01 … v12; orakel-01 … orakel-12 for o01 … o12 |

Visualisation tags must match the numbered destination. Oracle tags only apply
on the oracle page. Missing, invalid, mismatched or future-edition tags receive
no new attribution. A shared tagged link counts the same as a physical scan;
analytics cannot prove that the visitor scanned a printed code.

## PostHog and onward journeys

Uses the same project token, EU endpoint and default PostHog persistence as the
coaching pages. Automatic pageview capture is disabled on journal pages; exactly
one manual `$pageview` is sent after registering attribution, plus one
`journal_qr_visit`. No journal session recording or automatic click capture is added.

Registered persistent event properties include the four UTMs above and:

- `journal_source = amazon-kdp`
- `journal_medium = book`
- `journal_campaign = die-12-naechte-edition-1`
- `journal_edition = 1`
- `journal_qr_kind = meditation` or `orakel`
- `journal_qr_content = meditation-01` or `orakel-01`, etc.
- `journal_qr_number = 1` through `12`
- `journal_first_qr_content`: the first tagged content in that browser.

A new valid scan updates the latest content, preserving the first content.
These properties accompany coaching pageviews, `cal_booking_intent`, existing
`cal_booking_successful` events, and thank-you pageviews in the same browser.
They do not require UTM decoration on internal links. The journal properties
retain the referral even if later marketing campaigns supply different UTMs.
Fresh untagged visitors receive no journal label; a previously attributed reader
retains their journal history on subsequent untagged visits by design.

Existing PostHog opt-outs are honored: no registration or event capture occurs
when opted out, and the script never opts anyone in. URL expansion still works
when opted out or analytics is blocked. Attribution requires analytics/storage
availability and the same browser; it does not join different devices or track
activity inside Cal.com's own pages or confirmation emails.

## Measuring the journey

In the existing PostHog project, build a funnel:

1. `journal_qr_visit`, filtered by `journal_campaign = die-12-naechte-edition-1`.
2. `$pageview`, filtered by `$pathname` for the desired coaching page (e.g.
   `/de/index.html`, `/de/creativity-coaching/`, or their English versions).
3. `cal_booking_intent`, optionally followed by `cal_booking_successful`.

Break down by `journal_qr_content` or `journal_first_qr_content`. Use an appropriate
conversion window (for example 30 days). Filtering coaching events by the journal
campaign shows historical readers, which is broader than same-session referrals.

The collection includes an absolute versioned script URL. Running
`python3 scripts/build_rauhnaechte_pages.py` preserves it on all twelve QR pages.

Reference: https://posthog.com/docs/libraries/js/usage#super-properties
