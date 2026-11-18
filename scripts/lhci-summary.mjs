// Prints the key Lighthouse metrics from .lighthouseci/ so CI logs show *why* a score dropped.
import { readFileSync, readdirSync } from 'node:fs';

const dir = '.lighthouseci';
const reports = readdirSync(dir)
  .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));

for (const r of reports) {
  const a = r.audits;
  const scores = Object.values(r.categories)
    .map((c) => `${c.id}=${Math.round(c.score * 100)}`)
    .join(' ');
  console.log(`\n${r.finalDisplayedUrl}\n  ${scores}`);
  for (const k of [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
  ]) {
    console.log(`  ${k}: ${a[k]?.displayValue} (score ${a[k]?.score})`);
  }
  const lcp = a['lcp-breakdown-insight']?.details?.items?.find((i) => i.type === 'node');
  if (lcp) console.log(`  LCP element: ${lcp.selector}`);
  const shifts = a['layout-shifts']?.details?.items ?? [];
  for (const s of shifts.slice(0, 3)) console.log(`  layout shift ${s.score?.toFixed(3)}: ${s.node?.selector}`);
  console.log(`  benchmarkIndex: ${r.environment?.benchmarkIndex}`);
}
