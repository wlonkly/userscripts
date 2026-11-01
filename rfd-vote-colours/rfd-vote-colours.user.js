// ==UserScript==
// @name        RedFlagDeals Vote Score Colours
// @namespace   Violentmonkey Scripts
// @match       https://forums.redflagdeals.com/*
// @grant       none
// @version     1.0.1
// @license     MIT
// @author      https://github.com/wlonkly/
// @description Tints post vote scores on RedFlagDeals forum listings. Green for positive, red for negative, darker as the score grows.
// @run-at      document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  // <<<PURE_LOGIC>>>
  // Score magnitude -> [lightness %, saturation %]. Linear between anchors,
  // clamped beyond the last one. Chosen so 10, 50 and 100 each land on a
  // visibly different shade without hard steps.
  const ANCHORS = [
    [0, 96, 0],
    [1, 93, 45],
    [10, 84, 60],
    [50, 62, 70],
    [100, 28, 80],
  ];

  const DARK_TEXT = [26, 26, 26];
  const LIGHT_TEXT = [255, 255, 255];

  function ramp(absScore) {
    const a = Math.max(Math.abs(absScore), 1);
    for (let i = 0; i < ANCHORS.length - 1; i++) {
      const [s0, l0, sat0] = ANCHORS[i];
      const [s1, l1, sat1] = ANCHORS[i + 1];
      if (a >= s0 && a <= s1) {
        const t = (a - s0) / (s1 - s0);
        return [l0 + (l1 - l0) * t, sat0 + (sat1 - sat0) * t];
      }
    }
    const last = ANCHORS[ANCHORS.length - 1];
    return [last[1], last[2]];
  }

  function hslToRgb(h, s, l) {
    const sat = s / 100;
    const light = l / 100;
    const c = (1 - Math.abs(2 * light - 1)) * sat;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = light - c / 2;
    const seg = Math.floor(h / 60) % 6;
    const rgb = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ][seg];
    return rgb.map((v) => Math.round((v + m) * 255));
  }

  function toHex(rgb) {
    return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  function relativeLuminance(rgb) {
    const channel = (v) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const hi = Math.max(la, lb);
    const lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function textColourFor(background) {
    return contrastRatio(background, DARK_TEXT) >= contrastRatio(background, LIGHT_TEXT)
      ? DARK_TEXT
      : LIGHT_TEXT;
  }

  // "+13" -> 13, " -4 SCORE" -> -4, "" -> null
  function parseScore(raw) {
    if (raw === null || raw === undefined) return null;
    const match = String(raw).match(/[+-]?\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  // Returns null for a score of 0, meaning "leave the site's own styling".
  function styleFor(score) {
    if (score === 0) return null;
    const [lightness, saturation] = ramp(score);
    const background = hslToRgb(score > 0 ? 145 : 0, saturation, lightness);
    return { background: toHex(background), color: toHex(textColourFor(background)) };
  }
  // <<<END_PURE_LOGIC>>>

  // Forum listing pages only: /hot-deals-f9/ and /hot-deals-f9/3/.
  // Thread pages end in /<slug>-<digits>/ and do not match.
  const LISTING_PATH = /^\/[a-z0-9][a-z0-9-]*-f\d+(?:\/\d+)?\/?$/i;
  if (!LISTING_PATH.test(location.pathname)) return;

  const CHIP_SELECTOR = 'li.row.topic .thread-meta-large > dl.post_voting';
  const COMPACT_SELECTOR = 'li.row.topic .thread-meta-small .total_count';
  const SCORE_TEXT_SELECTOR = '.total_count_selector';

  // The wide layout already renders the score as a chip. The narrow layout
  // renders it as bare text, so give it the same shape.
  const style = document.createElement('style');
  style.textContent = '.rfd-vote-chip{display:inline-block;padding:0 5px}';
  document.head.appendChild(style);

  function paintChip(chip) {
    const scoreText = chip.querySelector(SCORE_TEXT_SELECTOR);
    const score = parseScore(chip.dataset.total) ?? parseScore(scoreText && scoreText.textContent);
    const colours = score === null ? null : styleFor(score);
    const key = colours ? colours.background + colours.color : 'none';
    if (chip.dataset.rfdPainted === key) return;
    chip.dataset.rfdPainted = key;

    if (!colours) {
      chip.style.backgroundColor = '';
      if (scoreText) scoreText.style.color = '';
      return;
    }
    chip.style.backgroundColor = colours.background;
    if (scoreText) scoreText.style.color = colours.color;
  }

  function paintCompact(span) {
    const score = parseScore(span.textContent);
    const colours = score === null ? null : styleFor(score);
    const key = colours ? colours.background + colours.color : 'none';
    if (span.dataset.rfdPainted === key) return;
    span.dataset.rfdPainted = key;

    span.classList.toggle('rfd-vote-chip', Boolean(colours));
    span.style.backgroundColor = colours ? colours.background : '';
    span.style.color = colours ? colours.color : '';
  }

  function paintAll() {
    document.querySelectorAll(CHIP_SELECTOR).forEach(paintChip);
    document.querySelectorAll(COMPACT_SELECTOR).forEach(paintCompact);
  }

  paintAll();

  // Votes and inline refreshes rewrite data-total and the score text, so
  // repaint after the listing changes. Debounced: RFD pages mutate often.
  let timer = null;
  const observer = new MutationObserver(() => {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      paintAll();
    }, 200);
  });

  const list = document.querySelector('ul.topiclist.topics');
  observer.observe(list || document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['data-total'],
  });
})();
