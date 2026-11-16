// tools/labelled.mjs — read libraries 6 to 9 (SEAL 10) into messages { id, text, intent, intents? }, each from files
// pinned by sha256: ETHICS commonsense morality (Hendrycks et al., MIT), GoEmotions (Demszky et al., Apache-2.0), MATH
// (Hendrycks et al., MIT; a derived file of its parquet), MMLU (Hendrycks et al., MIT; a manifest over its 171 CSVs).
// It refuses any file that is not the pinned one. This repository commits no text from them.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { csv } from '../src/csv.mjs';
import LB from '../src/labelled.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const pinned = (dir, f, want) => { const b = readFileSync(join(dir, f)); if (sha(b) !== want) throw new Error(join(dir, f) + ' is not the pinned file (sha256 ' + sha(b).slice(0, 12) + '…)'); return b.toString('utf8'); };

export const SOURCES = Object.freeze({
  ethics: Object.freeze({
    name: 'ETHICS, commonsense morality', by: 'Hendrycks, Burns, Basart, Critch, Li, Song, Steinhardt (ICLR 2021)', licence: 'MIT',
    url: 'https://people.eecs.berkeley.edu/~hendrycks/ethics.tar', repo: 'https://github.com/hendrycks/ethics', tar: '40acbf1ac0da79a2aabef394d58889136b8d38b05be09482006de2453fb06333',
    files: Object.freeze({ 'ethics/commonsense/cm_train.csv': '286cb4098a66b71819493f964cf2afe62cdbb6c6b41983b9c0b8fc484650c752', 'ethics/commonsense/cm_test.csv': 'a004f51b8f863d85eb5575d86e8723897f850fcb7fc8de38c1f30105dfb13c4d', 'ethics/commonsense/cm_test_hard.csv': '896f8929284fd7f847413e929e5191e2c56e4f1ab0e5ce22f059541cfa33d494' }),
  }),
  emotions: Object.freeze({
    name: 'GoEmotions', by: 'Demszky, Movshovitz-Attias, Ko, Cowen, Nemade, Ravi (ACL 2020)', licence: 'Apache-2.0',
    repo: 'https://github.com/google-research/google-research/tree/7951440944924ac61b6e2f9a2a3c715834005c40/goemotions', commit: '7951440944924ac61b6e2f9a2a3c715834005c40',
    files: Object.freeze({ 'train.tsv': '1c254a142be5c00e80d819b9ae1bbd36d94b2eeb8f4b1271846508d57e57d9c5', 'dev.tsv': '575489c079c9de1097062a01738f998590d6b7ead66dd1c9fd1d2ba01fd8bc62', 'test.tsv': '0587b2dd8b27b97352adbfc3fb083d46005c8946657fdc2b1ca8b1cc7f1f8be4', 'emotions.txt': '45c3ef86782d2a4d7fedcd6d8c111aa0d0e94720689bd164fac94fefb4495a89' }),
  }),
  maths: Object.freeze({
    name: 'MATH', by: 'Hendrycks, Burns, Kadavath, Arora, Basart, Tang, Song, Steinhardt (NeurIPS 2021)', licence: 'MIT',
    repo: 'https://huggingface.co/datasets/qwedsacf/competition_math (the copy the MATH repository links to), revision e839825f9ec5c6cfa585c654a59610969ec13993',
    parquet: '2325458edc03d786939ee9e1e5795efb9e2480247b6e1ed2c51f41bea7369c6a',
    files: Object.freeze({ 'math.jsonl': 'a249b3c7c53f9131a77c459818a3af7a8524817359a6af0a52a06a1ef9246326' }),
  }),
  subjects: Object.freeze({
    name: 'MMLU', by: 'Hendrycks, Burns, Basart, Zou, Mazeika, Song, Steinhardt (ICLR 2021)', licence: 'MIT',
    url: 'https://people.eecs.berkeley.edu/~hendrycks/data.tar', repo: 'https://github.com/hendrycks/test', tar: 'bec563ba4bac1d6aaf04141cd7d1605d7a5ca833e38f994051e818489592989b',
    manifest: null,
  }),
});

/** mmluManifest(dir) → sha256 over the sorted "path sha256" lines of data/{dev,val,test}/*.csv */
export function mmluManifest(dir) {
  const lines = [];
  for (const split of ['dev', 'val', 'test']) for (const f of readdirSync(join(dir, 'data', split)).filter((x) => x.endsWith('.csv')).sort()) lines.push('data/' + split + '/' + f + ' ' + sha(readFileSync(join(dir, 'data', split, f))));
  return { manifest: sha(lines.sort().join('\n') + '\n'), files: lines.length };
}

export const LOAD = Object.freeze({
  ethics(dir) {
    const out = [];
    for (const [f, want] of Object.entries(SOURCES.ethics.files)) {
      const t = csv(pinned(dir, f, want)), h = t[0], li = h.indexOf('label'), ii = h.indexOf('input'), base = f.split('/').pop().replace(/\.csv$/, '');
      t.slice(1).forEach((r, i) => { if (r[li] === '0' || r[li] === '1') out.push({ id: 'eth-' + base + '-' + String(i).padStart(5, '0'), text: String(r[ii]), intent: r[li] === '1' ? 'wrong' : 'not_wrong' }); });
    }
    return out;
  },
  emotions(dir) {
    const names = pinned(dir, 'emotions.txt', SOURCES.emotions.files['emotions.txt']).split(/\r?\n/).filter(Boolean);
    if (JSON.stringify(names) !== JSON.stringify(LB.LIBRARIES.emotions.intents)) throw new Error('emotions.txt is not the kernel\'s list');
    const out = [];
    for (const f of ['train.tsv', 'dev.tsv', 'test.tsv']) for (const line of pinned(dir, f, SOURCES.emotions.files[f]).split(/\r?\n/)) {
      if (!line) continue;
      const [text, labels, id] = line.split('\t');
      out.push({ id: 'goe-' + id, text: String(text), intent: '', intents: String(labels).split(',').map((k) => names[Number(k)]).filter(Boolean) });
    }
    return out;
  },
  maths(dir) {
    return pinned(dir, 'math.jsonl', SOURCES.maths.files['math.jsonl']).split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return { id: r.id, text: String(r.problem), intent: String(r.type) }; });
  },
  subjects(dir) {
    const m = mmluManifest(dir);
    if (m.manifest !== LB.MMLU_MANIFEST) throw new Error(dir + ' does not hold the pinned MMLU files (manifest ' + m.manifest.slice(0, 12) + '…)');
    const out = [];
    for (const split of ['dev', 'val', 'test']) for (const f of readdirSync(join(dir, 'data', split)).filter((x) => x.endsWith('.csv')).sort()) {
      const subject = f.replace(new RegExp('_' + split + '\\.csv$'), '');
      csv(readFileSync(join(dir, 'data', split, f), 'utf8')).forEach((r, i) => { if (r.length >= 6) out.push({ id: 'mmlu-' + split + '-' + subject + '-' + String(i).padStart(4, '0'), text: String(r[0]), intent: subject }); });
    }
    return out;
  },
});

export const units = (lib, docs) => { const K = LB.KERNELS[lib], u = {}; for (const d of docs) u[d.id] = K.units(d); return u; };
export default { SOURCES, LOAD, mmluManifest, units };
