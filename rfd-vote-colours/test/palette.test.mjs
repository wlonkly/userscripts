import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const START = '// <<<PURE_LOGIC>>>';
const END = '// <<<END_PURE_LOGIC>>>';

function loadPure(file) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const start = source.indexOf(START);
  const end = source.indexOf(END);
  assert.ok(start !== -1 && end !== -1, `${file} is missing the pure-logic markers`);
  const body = source.slice(start + START.length, end);
  return new Function(
    `${body}
     return { styleFor, parseScore, ramp, toHex, textColourFor };`,
  )();
}

const script = loadPure('../rfd-vote-colours.user.js');

test('score 0 leaves the site styling alone', () => {
  assert.equal(script.styleFor(0), null);
});

test('anchor scores land on the agreed colours', () => {
  const expected = {
    1: ['#e5f5ec', '#1a1a1a'],
    10: ['#beefd2', '#1a1a1a'],
    50: ['#5ae293', '#1a1a1a'],
    100: ['#0e813e', '#ffffff'],
    '-1': ['#f5e5e5', '#1a1a1a'],
    '-10': ['#efbebe', '#1a1a1a'],
    '-50': ['#e25a5a', '#1a1a1a'],
    '-100': ['#810e0e', '#ffffff'],
  };
  for (const [score, [background, color]] of Object.entries(expected)) {
    const got = script.styleFor(Number(score));
    assert.equal(got.background, background, `background for ${score}`);
    assert.equal(got.color, color, `text colour for ${score}`);
  }
});

test('scores beyond 100 are clamped to the same colour', () => {
  assert.deepEqual(script.styleFor(150), script.styleFor(100));
  assert.deepEqual(script.styleFor(-999), script.styleFor(-100));
});

test('text stays readable against every chip', () => {
  const dark = [26, 26, 26];
  const light = [255, 255, 255];
  for (let score = -200; score <= 200; score++) {
    if (score === 0) continue;
    const { background, color } = script.styleFor(score);
    const rgb = [1, 3, 5].map((i) => parseInt(background.slice(i, i + 2), 16));
    const chosen = color === '#1a1a1a' ? dark : light;
    const channel = (v) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    };
    const lum = (c) => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);
    const [hi, lo] = [lum(rgb), lum(chosen)].sort((a, b) => b - a);
    assert.ok((hi + 0.05) / (lo + 0.05) >= 3, `contrast too low at score ${score}`);
  }
});

test('parseScore reads the formats the site uses', () => {
  assert.equal(script.parseScore('+13'), 13);
  assert.equal(script.parseScore('-4'), -4);
  assert.equal(script.parseScore('0'), 0);
  assert.equal(script.parseScore('-116 SCORE'), -116);
  assert.equal(script.parseScore('+105 SCORE'), 105);
  assert.equal(script.parseScore(' SCORE'), null);
  assert.equal(script.parseScore(''), null);
  assert.equal(script.parseScore(undefined), null);
});

test('preview page uses the same palette as the userscript', () => {
  const preview = loadPure('../preview.html');
  for (let score = -200; score <= 200; score++) {
    assert.deepEqual(preview.styleFor(score), script.styleFor(score), `score ${score}`);
  }
});
