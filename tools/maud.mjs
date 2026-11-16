// tools/maud.mjs — read MAUD (The Atticus Project, CC BY 4.0; github.com/TheAtticusProject/maud at 4640316, data.zip) into
// merger agreements { id, rows: [{ q, text, label }] }, the `main` rows only. It reads the three CSVs unzipped from the
// pinned data.zip into <dir>/data/, refuses any whose sha256 is not the pinned one, and refuses data whose questions and
// labels are not the kernel's (src/maud-questions.mjs). This repository commits no excerpt. SEAL 9.
//   CI: curl data.zip at the commit, check its sha256, unzip data/MAUD_{train,dev,test}.csv
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { csv } from '../src/csv.mjs';
import R from '../src/router.mjs';
import M from '../src/maud.mjs';

export const SOURCE = Object.freeze({
  name: 'MAUD', by: 'The Atticus Project (Wang, Scardigli, Tang, Chen, Levkin, Chen, Ball, Woodside, Zhang, Hendrycks, 2023)', licence: 'CC BY 4.0',
  repo: 'https://github.com/TheAtticusProject/maud', commit: '4640316078dcd370debb877f350c39a28b181ffe',
  zip: Object.freeze({ path: 'data.zip', bytes: 32893590, sha256: '75af5a33d038e9254864f043da38072490ffe11e8488d58d0a2dd39c8f554519' }),
  files: Object.freeze({
    'data/MAUD_train.csv': 'bac9f2d034ad487d5398ee2ac1c876679afea509ba8e7f1092112955c6180ff9',
    'data/MAUD_dev.csv': 'e977f99abcfd43f785272c23bcf08f8208579a6458d9088d2d5ba64c67e4cc1f',
    'data/MAUD_test.csv': 'afcbc88a4f14e8c14056469446e79f610a6eaf3a1425e61729637bd69251e697',
  }),
});
const sha = (b) => createHash('sha256').update(b).digest('hex');
export const qidOf = (question, subquestion) => R.idOf(question) + (subquestion === '<NONE>' || !subquestion ? '' : '--' + R.idOf(subquestion));

/** load(dir) → [{ id, rows }] sorted by agreement name, after checking every pinned file and the kernel's questions */
export function load(dir) {
  const rows = [];
  for (const [f, want] of Object.entries(SOURCE.files)) {
    const b = readFileSync(join(dir, f));
    if (sha(b) !== want) throw new Error(join(dir, f) + ' is not the pinned ' + f + ' (sha256 ' + sha(b).slice(0, 12) + '…)');
    const t = csv(b.toString('utf8')), h = t[0];
    for (const r of t.slice(1)) { const o = Object.fromEntries(h.map((k, i) => [k, r[i]])); if (o.data_type === 'main') rows.push(o); }
  }
  const seen = new Map();
  for (const r of rows) { const q = qidOf(r.question, r.subquestion); (seen.get(q) || seen.set(q, new Set()).get(q)).add(r.label); }
  const mine = new Map(M.QUESTIONS.map((q) => [q.id, q.labels.map((l) => l.label).join(',')]));
  const theirs = [...seen.entries()].map(([q, s]) => [q, [...s].sort((a, b) => Number(a) - Number(b)).join(',')]);
  if (theirs.length !== mine.size || theirs.some(([q, l]) => mine.get(q) !== l)) throw new Error('the data\'s questions and labels are not the kernel\'s (src/maud-questions.mjs)');
  const by = new Map();
  for (const r of rows) (by.get(r.contract_name) || by.set(r.contract_name, []).get(r.contract_name)).push({ q: qidOf(r.question, r.subquestion), text: String(r.text), label: String(r.label) });
  return [...by.keys()].sort().map((id) => ({ id, rows: by.get(id) }));
}
export const units = (docs) => { const u = {}; for (const d of docs) u[d.id] = M.units(d); return u; };
export default { SOURCE, qidOf, load, units };
