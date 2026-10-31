import json, os, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_env():
    env = {}
    p = ROOT / ".env"
    if p.exists():
        for line in p.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.split("  #")[0].split(" #")[0].strip()
    for k, v in os.environ.items():
        env.setdefault(k, v)
    return env


def upsert_env(key, value):
    path = ROOT / ".env"
    lines = path.read_text().splitlines() if path.exists() else []
    found = False
    out = []
    prefix = key + "="
    for line in lines:
        if line.startswith(prefix) or line.startswith(key + " ="):
            out.append("%s=%s" % (key, value))
            found = True
        else:
            out.append(line)
    if not found:
        out.append("%s=%s" % (key, value))
    path.write_text("\n".join(out) + "\n")


def call(method, path, key, body=None):
    req = urllib.request.Request(
        "https://api.bolna.ai" + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}
