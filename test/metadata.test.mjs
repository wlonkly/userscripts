import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Every folder holding a userscript, in the layout described in the README.
function scriptFiles() {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .flatMap((entry) =>
      readdirSync(join(root, entry.name))
        .filter((name) => name.endsWith('.user.js'))
        .map((name) => ({ dir: entry.name, name, path: join(root, entry.name, name) })),
    );
}

function parseMetadata(source) {
  const start = source.indexOf('// ==UserScript==');
  const end = source.indexOf('// ==/UserScript==');
  assert.equal(start, 0, 'metadata block must be the first thing in the file');
  assert.ok(end > start, 'metadata block is not closed');

  const meta = {};
  for (const line of source.slice(start, end).split('\n')) {
    const match = line.match(/^\/\/\s+@(\S+)\s+(.+?)\s*$/);
    if (!match) continue;
    const [, key, value] = match;
    (meta[key] ??= []).push(value);
  }
  return meta;
}

const scripts = scriptFiles().map((file) => ({
  ...file,
  source: readFileSync(file.path, 'utf8'),
  meta: parseMetadata(readFileSync(file.path, 'utf8')),
}));

test('at least one script is present', () => {
  assert.ok(scripts.length > 0, 'no *.user.js files found');
});

for (const { dir, name, source, meta } of scripts) {
  test(`${dir}: file name matches its folder`, () => {
    assert.equal(name, `${dir}.user.js`);
  });

  test(`${dir}: required metadata is present`, () => {
    for (const key of ['name', 'namespace', 'version', 'description', 'license', 'author']) {
      assert.ok(meta[key]?.[0], `missing @${key}`);
    }
    assert.ok(meta.match || meta.include, 'missing @match or @include');
  });

  test(`${dir}: version is a dotted number`, () => {
    assert.match(meta.version[0], /^\d+(\.\d+)+$/);
  });

  test(`${dir}: scripts making cross-origin requests declare @connect`, () => {
    const usesXhr = /\bGM[._]xml[Hh]ttp[Rr]equest\b/.test(source);
    if (!usesXhr) return;
    assert.ok(meta.connect?.length, 'uses GM.xmlHttpRequest but has no @connect');
  });
}
