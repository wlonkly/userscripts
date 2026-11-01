# RedFlagDeals Vote Score Colours

A userscript that tints the vote score on RedFlagDeals forum listing pages. Positive scores go green, negative scores go red, and the colour deepens as the score grows. Text flips between near-black and white so it stays readable.

Score 0 is left as RedFlagDeals renders it.

## Install

[Install from Greasy Fork](https://greasyfork.org/en/scripts/603206-redflagdeals-vote-score-colours), or manually:

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open the manager's dashboard, choose **Create a new script**, delete the template, and paste in `rfd-vote-colours.user.js`.
3. Save, then reload a forum listing.

## Where it applies

Forum listing pages only, for example:

- `https://forums.redflagdeals.com/hot-deals-f9/`
- `https://forums.redflagdeals.com/hot-deals-f9/3/`

Thread pages, such as `/home-depot-clearance-tools-...-2830461/`, are not touched.

## Preview

Open `preview.html` in a browser. It shows the palette on the scores from a real Hot Deals page, the full ramp, and a mock listing row. Use it to judge colour changes before installing.

The palette is defined once in the userscript and once in the preview page, between `// <<<PURE_LOGIC>>>` and `// <<<END_PURE_LOGIC>>>`. Change both, then run the tests, which fail if the two copies disagree.

## Tests

```sh
node --test
```

No dependencies. `palette.test.mjs` checks the colours and that the preview page matches; `url-gate.test.mjs` checks which URLs the script acts on.

## Tuning

The `ANCHORS` table maps score magnitude to `[score, lightness %, saturation %]`. Lightness and saturation interpolate linearly between anchors and clamp past the last one. Raising the lightness of the final anchor makes the strongest chips paler; lowering it makes them darker.
