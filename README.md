# Userscripts

Small browser scripts for making websites behave the way I want.

| Script | Install | What it does |
|---|---|---|
| [RedFlagDeals Vote Score Colours](rfd-vote-colours/) | [Greasy Fork](https://greasyfork.org/en/scripts/603206-redflagdeals-vote-score-colours) | Tints vote scores on RedFlagDeals forum listings: green for positive, red for negative, darker as the score grows. |
| [Restore Reddit subscriber count](restore-reddit-subscriber-count/) | — | Puts the subscriber count back on Reddit subreddit pages. |

## Layout

Each script lives in its own folder, alongside its README and tests:

```
<script-name>/
  <script-name>.user.js   the script, ready to install
  README.md               what it does, where it applies, how to tune it
  test/                   tests for that script, if it has any
```

The `test/` folder at the top level holds checks that apply to every script, such as the required metadata keys.

Install a script by opening its `.user.js` file and adding it to Tampermonkey or Violentmonkey, or by pasting it into a new script.

## Tests

```sh
node --test
```

No dependencies. Checks that each script's metadata is complete and that the per-script tests pass.

## Licence

MIT, per the metadata in each script.
