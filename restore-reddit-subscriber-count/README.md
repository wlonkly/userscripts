# Restore Reddit subscriber count

Reddit no longer shows the subscriber count on subreddit pages. This script reads it from the subreddit's `about.json` and puts it back on the page.

## Install

Not published yet. To install manually:

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open the manager's dashboard, choose **Create a new script**, delete the template, and paste in `restore-reddit-subscriber-count.user.js`.
3. Save, then reload a subreddit.

## Where it applies

Subreddit pages, for example `https://www.reddit.com/r/canada/`. The `@match` covers every `reddit.com` subdomain, so old and new Reddit both work.

## Notes

- The script calls `reddit.com/r/<subreddit>/about.json`, which is why the metadata declares `@connect reddit.com`. Without it, the browser manager asks for permission on every install.
- On new Reddit it inserts the count after the community details. If that element is not on the page it appends to the bottom of the body instead.
- New Reddit is a single-page app. The script runs once per page load, so moving between subreddits without a full reload will not update the count.

## Licence

MIT.
