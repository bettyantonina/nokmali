# Temporarily paused Tools and Rhythm Check links

The original links, buttons and related Rhythm Check prompts are saved in
[`../patches/paused-tools-rhythm-check.patch`](../patches/paused-tools-rhythm-check.patch).
The patch records this removal; applying it in reverse restores the original HTML.
The original repository version is `1f65e338cf01124ce4d29cc639dfc3003ac9e069`.

The saved markup covers:

- English and German desktop navigation and mobile menus.
- Rhythm Check buttons in the homepages and both blog article versions.
- Tools and Rhythm Check footer links, including the blog index.
- The equivalent navigation and buttons in the colour experiment page.
- The two blog paragraphs that introduced the removed Rhythm Check buttons.

The Tools and Rhythm Check pages and their code remain in `tools/`, `de/tools/`,
`assessment/` and `de/assessment/`. Tool links in article text and inside the tools
themselves remain available. The Rauhnächte exercises are separate from these links.

To restore, run from the repository root:

```sh
git apply --reverse --check patches/paused-tools-rhythm-check.patch
git apply --reverse patches/paused-tools-rhythm-check.patch
```

If later page edits prevent the patch from applying, use its saved HTML and context
to restore the desired links manually. Preview both languages and mobile menus
before publishing the restoration.
