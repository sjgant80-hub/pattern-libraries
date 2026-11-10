// tools/cuad.mjs — read CUAD v1 (The Atticus Project, CC BY 4.0) into documents: { id, text, gold: [{ cat, start, end }] }.
// The only file it reads is CUADv1.json from the pinned data.zip (sha256 below); this repo commits no contract text.
import { readFileSync } from 'node:fs';
import E from '../src/extract.mjs';

export const SOURCE = Object.freeze({
  name: 'CUAD v1', by: 'The Atticus Project', licence: 'CC BY 4.0', record: 'https://zenodo.org/records/4595826',
  file: 'data.zip', from: 'https://github.com/TheAtticusProject/cuad/raw/main/data.zip',
  sha256: 'f8161d18bea4e9c05e78fa6dda61c19c846fb8087ea969c172753bc2f45b999a', member: 'CUADv1.json',
});

export function docsOf(json) {
  const out = [];
  for (const d of Array.isArray(json && json.data) ? json.data : []) {
    const p = d && Array.isArray(d.paragraphs) ? d.paragraphs[0] : null;
    if (!p || typeof p.context !== 'string' || typeof d.title !== 'string') continue;
    const gold = [];
    for (const q of Array.isArray(p.qas) ? p.qas : []) {
      const cat = String(q.id || '').split('__')[1];
      for (const a of Array.isArray(q.answers) ? q.answers : []) if (Number.isInteger(a.answer_start) && typeof a.text === 'string') gold.push({ cat, start: a.answer_start, end: a.answer_start + a.text.length });
    }
    out.push({ id: d.title, text: p.context, gold });
  }
  return out;
}

export function load(path) { return docsOf(JSON.parse(readFileSync(path, 'utf8'))); }

/** units(docs) → { [doc id]: { [task]: [unit] } } */
export function units(docs) {
  const u = {};
  for (const d of docs) u[d.id] = E.unitsOf(d);
  return u;
}
export default { SOURCE, docsOf, load, units };
