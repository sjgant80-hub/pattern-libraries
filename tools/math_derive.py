# tools/math_derive.py — library 8 (SEAL 10): derive math.jsonl (id, problem, level, type) from the pinned MATH parquet, one line per row in file order
import json, sys
import pyarrow.parquet as pq
src, dst = sys.argv[1], sys.argv[2]
rows = pq.read_table(src).to_pylist()
with open(dst, 'w', encoding='utf-8', newline='\n') as f:
    for i, r in enumerate(rows):
        f.write(json.dumps({'id': 'math-%05d' % i, 'problem': r['problem'], 'level': r['level'], 'type': r['type']}, ensure_ascii=False, sort_keys=True) + '\n')
print(len(rows))
