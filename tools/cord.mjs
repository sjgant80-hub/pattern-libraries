// tools/cord.mjs — read CORD v2 (NAVER CLOVA, CC BY 4.0) into receipts: { id, text, gold: [{ cat, key, start, end }] }.
// The only file it reads is cord-v2-ground-truth.jsonl, made by tools/cord_fetch.py from the pinned parquet files (only
// the ground_truth column; no images). Its sha256 is pinned below; this repo commits no receipt text. Sealed: CLAIMS.md
// (SEAL 2): the experts' words are grouped into rows by row_id, rows top to bottom (the smallest y of their words, then
// the row_id), words left to right (the smallest x, then their order in the file), words joined by a space, rows by a newline.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import F from '../src/finance.mjs';

export const SOURCE = Object.freeze({
  name: 'CORD v2', by: 'NAVER CLOVA (Park, Shin, Lee, Lee, Surh, Seo and Lee, 2019)', licence: 'CC BY 4.0',
  record: 'https://huggingface.co/datasets/naver-clova-ix/cord-v2', repo: 'https://github.com/clovaai/cord',
  revision: '7f0115a4b758a71d6473b8d085751692da2fef98', file: 'cord-v2-ground-truth.jsonl', receipts: 1000, bytes: 6198162,
  sha256: '272432829e501edde76ee9457a04c146e4e6e5d7fb40c0c395fc71a93f82c613',
});

const num = (x) => (Number.isFinite(x) ? x : 0);
const minOf = (q, k) => Math.min(...[1, 2, 3, 4].map((i) => num(Number(q && q[k + i]))));

/** receiptOf(line) → one receipt from one line of the derived file */
export function receiptOf(line) {
  const r = JSON.parse(line);
  const g = JSON.parse(r.ground_truth);
  const rows = new Map();
  let order = 0;
  for (const v of Array.isArray(g.valid_line) ? g.valid_line : []) for (const w of Array.isArray(v.words) ? v.words : []) {
    if (typeof w.text !== 'string') continue;
    const row = rows.get(w.row_id) || { id: w.row_id, y: Infinity, words: [] };
    row.y = Math.min(row.y, minOf(w.quad, 'y'));
    row.words.push({ x: minOf(w.quad, 'x'), n: order++, text: w.text, cat: String(v.category), key: w.is_key === 1 });
    rows.set(w.row_id, row);
  }
  const ordered = [...rows.values()].sort((a, b) => a.y - b.y || a.id - b.id);
  let text = '';
  const gold = [];
  ordered.forEach((row, i) => {
    if (i) text += '\n';
    row.words.sort((a, b) => a.x - b.x || a.n - b.n).forEach((w, j) => {
      if (j) text += ' ';
      gold.push({ cat: w.cat, key: w.key, start: text.length, end: text.length + w.text.length });
      text += w.text;
    });
  });
  return { id: r.split + '-' + String(r.row).padStart(3, '0'), text, gold };
}

/** load(path) → every receipt, after checking the file is the pinned one */
export function load(path) {
  const buf = readFileSync(path);
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== SOURCE.sha256) throw new Error(path + ' is not the pinned CORD v2 file (sha256 ' + sha.slice(0, 12) + '…)');
  return buf.toString('utf8').split('\n').filter(Boolean).map(receiptOf);
}

/** units(receipts) → { [receipt id]: { [task]: [unit] } } */
export function units(receipts) {
  const u = {};
  for (const d of receipts) u[d.id] = F.unitsOf(d);
  return u;
}
export default { SOURCE, receiptOf, load, units };
