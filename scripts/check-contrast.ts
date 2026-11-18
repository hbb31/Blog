/**
 * WCAG 2.2 AA contrast check for the colour tokens in src/styles/tokens.css,
 * in both light and dark themes. Run: npm run check:contrast
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Selector not found: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const vars: Record<string, string> = {};
  for (const m of css.slice(open + 1, close).matchAll(/--(color-[\w-]+):\s*(#[0-9a-f]{6})/gi)) vars[m[1]!] = m[2]!;
  return vars;
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
};

// [foreground, background, minimum ratio] — 4.5 for text, 3 for UI boundaries/focus.
const pairs: [string, string, number][] = [
  ['color-text', 'color-bg', 4.5],
  ['color-text', 'color-surface', 4.5],
  ['color-text-muted', 'color-bg', 4.5],
  ['color-text-muted', 'color-surface', 4.5],
  ['color-accent', 'color-bg', 4.5],
  ['color-accent', 'color-surface', 4.5],
  ['color-accent-hover', 'color-bg', 4.5],
  ['color-accent-contrast', 'color-accent', 4.5],
  ['color-accent-contrast', 'color-accent-hover', 4.5],
  ['color-text', 'color-callout-note', 4.5],
  ['color-text', 'color-callout-tip', 4.5],
  ['color-text', 'color-callout-warning', 4.5],
  ['color-text', 'color-code-bg', 4.5],
  ['color-text-muted', 'color-code-bg', 4.5],
  ['color-code-comment', 'color-code-bg', 4.5], // Shiki high-contrast comment colour
  ['color-success', 'color-bg', 4.5],
  ['color-error', 'color-bg', 4.5],
  ['color-focus', 'color-bg', 3],
  ['color-input-border', 'color-bg', 3], // form field boundaries (WCAG 1.4.11)
  ['color-input-border', 'color-surface', 3],
];

// Shiki theme comment colours (github-*-high-contrast), not tokens but rendered on --color-code-bg.
const light: Record<string, string> = { ...block(':root {'), 'color-code-comment': '#66707b' };
const dark: Record<string, string> = {
  ...light,
  ...block(":root[data-theme='dark']"),
  'color-code-comment': '#bdc4cc',
};

let failed = 0;
for (const [theme, vars] of [
  ['light', light],
  ['dark', dark],
] as const) {
  console.log(`\n${theme}`);
  for (const [fg, bg, min] of pairs) {
    const r = ratio(vars[fg]!, vars[bg]!);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? '✓' : '✗'} ${fg} on ${bg}: ${r.toFixed(2)} (min ${min})`);
  }
}
if (failed) {
  console.error(`\n${failed} pair(s) fail WCAG AA.`);
  process.exit(1);
}
