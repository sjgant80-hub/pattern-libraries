// tools/clinc.mjs — read CLINC150 (Larson et al., EMNLP 2019; github.com/clinc/oos-eval at 828f809, CC BY 3.0) into
// queries { id, text, intent }. It reads only the files tools/clinc_fetch.mjs fetched, refuses any whose sha256 is not
// the pinned one, and refuses a domains.json that is not the kernel's. This repository commits no query. SEAL 8.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import L from '../src/clinc.mjs';

export const SOURCE = Object.freeze({
  name: 'CLINC150', by: 'Larson, Mahendran, Peper, Clarke, Lee, Hill, Kummerfeld, Leach, Laurenzano, Tang and Mars (EMNLP-IJCNLP 2019)', licence: 'CC BY 3.0',
  repo: 'https://github.com/clinc/oos-eval', commit: '828f8093932c8fe6ca7936c3d2e52903b1c523de',
  files: Object.freeze({
    'data/data_full.json': '36923c3705a59e08fe9c3883d8bc2dd966ef93e22cb78ac41171782a698d56e0',
    'data/domains.json': 'b947b579d3b8e74b06f93b01083d8efaff2888b43a3e362533bd88a6e1211b3a',
    LICENSE: 'e6bc9e9c474700b708f568bac9e5a8a9bcb2b1dad53442f5ba449fcb848b8e76',
  }),
});
const sha = (b) => createHash('sha256').update(b).digest('hex');
const base = (f) => f.split('/').pop();

/** load(dir) → [{ id, text, intent }] after checking every file's pinned hash (files kept flat in dir) */
export function load(dir) {
  const bufs = {};
  for (const [f, want] of Object.entries(SOURCE.files)) {
    const b = readFileSync(join(dir, base(f)));
    if (sha(b) !== want) throw new Error(join(dir, base(f)) + ' is not the pinned ' + f + ' (sha256 ' + sha(b).slice(0, 12) + '…)');
    bufs[f] = b;
  }
  if (JSON.stringify(JSON.parse(bufs['data/domains.json'].toString('utf8'))) !== JSON.stringify(L.DOMAINS)) throw new Error('domains.json is not the kernel\'s list of intents');
  const data = JSON.parse(bufs['data/data_full.json'].toString('utf8')), out = [];
  for (const split of Object.keys(data)) data[split].forEach(([text, intent], i) => out.push({ id: 'clinc-' + split + '-' + String(i).padStart(5, '0'), text: String(text), intent: String(intent) }));
  return out;
}
export const units = (docs) => { const u = {}; for (const d of docs) u[d.id] = L.units(d); return u; };
export default { SOURCE, load, units };
