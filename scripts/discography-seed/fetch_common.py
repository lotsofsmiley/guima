"""Shared HTTP helper for the GUIMA discography fetchers (urllib only, no API keys)."""
import json, os, re, sys, urllib.request, urllib.parse, gzip

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
HEADERS = {
    "User-Agent": UA,
    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip",
}

def fetch(url, name=None, extra_headers=None, force=False):
    """GET url, cache to raw/<name>, return text (utf-8)."""
    if name:
        path = os.path.join(RAW, name)
        if os.path.exists(path) and not force:
            return open(path, "r", encoding="utf-8").read()
    h = dict(HEADERS)
    if extra_headers:
        h.update(extra_headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            data = r.read()
            if r.headers.get("Content-Encoding") == "gzip":
                data = gzip.decompress(data)
            txt = data.decode("utf-8", "replace")
            status = r.status
    except urllib.error.HTTPError as e:
        data = e.read()
        try:
            if e.headers.get("Content-Encoding") == "gzip":
                data = gzip.decompress(data)
        except Exception:
            pass
        txt = data.decode("utf-8", "replace")
        status = e.code
        print(f"[fetch] HTTP {status} for {url}", file=sys.stderr)
    print(f"[fetch] {status} {len(txt):>8} bytes  {url}", file=sys.stderr)
    if name:
        with open(os.path.join(RAW, name), "w", encoding="utf-8") as f:
            f.write(txt)
    return txt

def extract_script_json(html, script_id):
    m = re.search(r'<script[^>]*id="%s"[^>]*>(.*?)</script>' % re.escape(script_id), html, re.S)
    if not m:
        return None
    return json.loads(m.group(1))

def extract_yt_initial_data(html):
    m = re.search(r'var ytInitialData = ({.*?});</script>', html, re.S)
    if not m:
        m = re.search(r'ytInitialData"?\]?\s*=\s*({.*?});\s*</script>', html, re.S)
    if not m:
        return None
    return json.loads(m.group(1))

def walk(obj, key):
    """Yield every value under `key` anywhere in a nested JSON structure."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == key:
                yield v
            yield from walk(v, key)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v, key)

def save_json(name, data):
    p = os.path.join(HERE, name)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[save] {p}", file=sys.stderr)
