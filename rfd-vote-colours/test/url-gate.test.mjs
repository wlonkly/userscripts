import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Pull the real gate out of the userscript so the test cannot drift from it.
const source = readFileSync(new URL('../rfd-vote-colours.user.js', import.meta.url), 'utf8');
const line = source.split('\n').find((l) => l.includes('const LISTING_PATH'));
assert.ok(line, 'LISTING_PATH is missing from the userscript');
const expression = line.slice(line.indexOf('=') + 1).trim().replace(/;$/, '');
const LISTING_PATH = new Function(`return ${expression}`)();

const pathOf = (url) => new URL(url).pathname;

test('forum listing paths are accepted', () => {
  const urls = [
    'https://forums.redflagdeals.com/hot-deals-f9/',
    'https://forums.redflagdeals.com/hot-deals-f9/3/',
    'https://forums.redflagdeals.com/hot-deals-f9/?sk=tt&rfd_sk=tt&sd=d',
    'https://forums.redflagdeals.com/hot-deals-f9/3/?sk=tt&rfd_sk=tt',
  ];
  for (const url of urls) {
    assert.ok(LISTING_PATH.test(pathOf(url)), url);
  }
});

test('thread paths are rejected', () => {
  const urls = [
    'https://forums.redflagdeals.com/home-depot-clearance-tools-spotted-st-constant-bosch-milwaukee-ryobi-husky-2830461/',
    'https://forums.redflagdeals.com/home-depot-milwaukee-m18-6-tool-kit-2830660/unread/',
    'https://forums.redflagdeals.com/home-depot-milwaukee-m18-6-tool-kit-2830660/page-2',
    // A thread slug that happens to contain a forum id is still a thread.
    'https://forums.redflagdeals.com/deal-f9-tools-2830461/',
  ];
  for (const url of urls) {
    assert.equal(LISTING_PATH.test(pathOf(url)), false, url);
  }
});

test('other site pages are rejected', () => {
  for (const url of ['https://forums.redflagdeals.com/', 'https://forums.redflagdeals.com/index.php']) {
    assert.equal(LISTING_PATH.test(pathOf(url)), false, url);
  }
});
