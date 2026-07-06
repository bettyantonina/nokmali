# Testimonial A

> Testimonial A — saved approved variant. Use this exact layout when requested.

`Testimonial A` is the approved open client-reflection treatment inside the green “How we begin” CTA section. The English and German versions must remain structurally synchronized, with translated copy.

## Canonical implementation

- English live markup and CSS: `index.html`
- German live markup and CSS: `de/index.html`
- Restoration patch: `patches/testimonial-a.patch`
- Search marker: `Testimonial A — saved approved variant. Use this exact layout when requested.`

The named CSS is `.begin-testimonial`, together with its heading, blockquote, citation, and mobile rules. Its approved composition also depends on the marked `.begin` section rules and the adjacent Topics spacing rule.

## Approved content

English label: `After a coaching session`

English quote: `“Throughout the coaching session, Helene asked very good questions, which made me go deeper and deeper into the topic. I felt comfortable, heard and supported. The session motivated me to step into a bigger, better version of myself.”`

German label: `Nach einer Coaching-Sitzung`

German quote: `„Während der Coaching-Sitzung stellte Helene sehr gute Fragen, die mich immer tiefer in mein Thema geführt haben. Ich habe mich wohl, gehört und unterstützt gefühlt. Die Sitzung hat mich motiviert, mehr in die Person hineinzuwachsen, die ich sein möchte.“`

Attribution in both languages: `— Anja`

## Required visual relationship

- Green `.begin` section.
- Three-step explanation followed by the unchanged gold CTA button.
- Open quote directly below the CTA; no card, border, divider, or shadow.
- Centered 780px testimonial width inside the centered 820px CTA container; testimonial text is left-aligned.
- Desktop quote is 18px/1.6; mobile quote is 16.75px.
- Label is 17px medium weight; attribution is 15px and muted.
- Desktop testimonial top margin is 14px; green-section bottom padding is 8px.
- Beige Topics section follows with 36px top padding on desktop and 28px on mobile.

## Restore

When asked to “Implement Testimonial A,” restore the marked CSS, responsive rules, and localized HTML from `patches/testimonial-a.patch` in both language files. The patch records the variant relative to the repository baseline; if surrounding page code has since changed, use it as the exact source of truth and apply the marked hunks manually rather than overwriting unrelated work.

