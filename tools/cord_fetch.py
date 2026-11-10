# tools/cord_fetch.py — read ONLY the ground_truth column of CORD v2's pinned parquet files over HTTP range requests (no
# images), into one JSONL file: one line per receipt, {"split", "row", "ground_truth"}, ASCII, LF. CORD v2 is by NAVER
# CLOVA, licence CC BY 4.0 (github.com/clovaai/cord; huggingface.co/datasets/naver-clova-ix/cord-v2). The revision is in
# every URL. About 1.9 MB goes over the wire; the file it writes must hash to tools/cord.mjs's pin (SEAL 2).
#   pip install pyarrow ; python -I tools/cord_fetch.py <out.jsonl>
import io, json, sys, hashlib, urllib.request
import pyarrow.parquet as pq

REV = '7f0115a4b758a71d6473b8d085751692da2fef98'
FILES = [
    ('train', 'data/train-00000-of-00004-b4aaeceff1d90ecb.parquet', 490224630),
    ('train', 'data/train-00001-of-00004-7dbbe248962764c5.parquet', 441418432),
    ('train', 'data/train-00002-of-00004-688fe1305a55e5cc.parquet', 443802181),
    ('train', 'data/train-00003-of-00004-2d0cd200555ed7fd.parquet', 455555434),
    ('validation', 'data/validation-00000-of-00001-cc3c5779fe22e8ca.parquet', 242080800),
    ('test', 'data/test-00000-of-00001-9c204eb3f4e11791.parquet', 234202795),
]
fetched = 0

class Ranged(io.RawIOBase):
    def __init__(self, url, size):
        self.url, self.size, self.pos = url, size, 0
    def seekable(self): return True
    def readable(self): return True
    def tell(self): return self.pos
    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos
    def read(self, n=-1):
        global fetched
        if n is None or n < 0: n = self.size - self.pos
        n = min(n, self.size - self.pos)
        if n <= 0: return b''
        req = urllib.request.Request(self.url, headers={'Range': 'bytes=%d-%d' % (self.pos, self.pos + n - 1), 'User-Agent': 'pattern-libraries-fetch'})
        with urllib.request.urlopen(req) as r:
            b = r.read()
        if len(b) != n: raise IOError('short read %d of %d' % (len(b), n))
        self.pos += n; fetched += n
        return b
    def readinto(self, buf):
        b = self.read(len(buf)); buf[:len(b)] = b; return len(b)

out = sys.argv[1]
lines, rowno = [], {}
for split, path, size in FILES:
    url = 'https://huggingface.co/datasets/naver-clova-ix/cord-v2/resolve/%s/%s' % (REV, path)
    f = pq.ParquetFile(Ranged(url, size), pre_buffer=False)
    t = f.read(columns=['ground_truth'])
    for gt in t.column('ground_truth').to_pylist():
        i = rowno.get(split, 0); rowno[split] = i + 1
        lines.append(json.dumps({'split': split, 'row': i, 'ground_truth': gt}, ensure_ascii=True, separators=(',', ':')))
    print(split, path, t.num_rows, 'fetched so far', fetched, file=sys.stderr)
body = ('\n'.join(lines) + '\n').encode('ascii')
with open(out, 'wb') as w: w.write(body)
print(len(lines), 'rows', len(body), 'bytes', 'sha256', hashlib.sha256(body).hexdigest(), 'range bytes fetched', fetched)
