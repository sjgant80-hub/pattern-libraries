// pattern-libraries · src/csv.mjs — reading Banking77's two CSV files into routing queries, the same way in Node (the
// loader, tools/polyai.mjs) and in the browser (the catalogue page re-deriving SEAL 5 in the tab). Moved here from
// tools/polyai.mjs unchanged, so both read the same rows. Pure and total: garbage in never throws.
//
//   csv(text)                    rows of fields (quoted fields may hold commas, quotes and newlines)
//   banking77(trainText, testText)  routing queries { id, text, intent } as the loader numbers them

/** csv(text) → rows of fields (quoted fields may hold commas, quotes and newlines) */
export function csv(s) {
  const rows = [];
  if (typeof s !== 'string') return rows;
  let row = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

/** banking77(trainText, testText) → [{ id, text, intent }]: every two-field row after the header, ids b77-<split>-00000… */
export function banking77(trainText, testText) {
  const routes = [];
  for (const [split, text] of [['train', trainText], ['test', testText]]) {
    csv(text).slice(1).forEach((r, i) => { if (r.length === 2) routes.push({ id: 'b77-' + split + '-' + String(i).padStart(5, '0'), text: r[0], intent: r[1] }); });
  }
  return routes;
}

export default { csv, banking77 };
