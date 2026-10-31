"""Validate keys and connect Sarvam + Fireworks on the Bolna account.
Reads .env. Does not print secret values."""
import json
import sys
import urllib.error
import urllib.request

from _common import call, load_env

FIREWORKS_BASE = "https://api.fireworks.ai/inference/v1"
SARVAM_TTS = "https://api.sarvam.ai/text-to-speech"


def http(method, url, headers, body=None, timeout=30):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            try:
                parsed = json.loads(raw) if raw else {}
            except Exception:
                parsed = {"raw": raw[:200].decode(errors="replace")}
            return r.status, parsed
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"raw": raw[:500]}
        return e.code, parsed
    except urllib.error.URLError as e:
        return 0, {"error": str(e)}


def mask(s):
    s = s or ""
    if len(s) <= 8:
        return "***"
    return s[:4] + "..." + s[-4:]


def check_bolna(key):
    status, resp = call("GET", "/user/me", key)
    ok = status == 200
    who = ""
    if isinstance(resp, dict):
        who = resp.get("email") or resp.get("user_id") or resp.get("id") or ""
    return ok, status, who, resp


def check_fireworks(key):
    status, resp = http(
        "GET",
        FIREWORKS_BASE + "/models",
        {"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    )
    ids = []
    if isinstance(resp, dict):
        for m in resp.get("data") or []:
            mid = m.get("id") if isinstance(m, dict) else None
            if mid:
                ids.append(mid)
    return status == 200, status, ids, resp


def check_sarvam(key):
    # Empty body: valid key should be 4xx validation, not 403 invalid_api_key.
    status, resp = http(
        "POST",
        SARVAM_TTS,
        {"api-subscription-key": key, "Content-Type": "application/json"},
        {},
    )
    code = ""
    if isinstance(resp, dict):
        err = resp.get("error")
        if isinstance(err, dict):
            code = err.get("code") or ""
        code = code or resp.get("code") or ""
    if status == 403 and "invalid_api_key" in str(code):
        return False, status, resp
    if status in (0, 401, 403):
        return False, status, resp
    return True, status, resp


def providers(items):
    if isinstance(items, dict):
        items = items.get("providers") or items.get("data") or []
    return items if isinstance(items, list) else []


def already_has(items, name):
    for p in providers(items):
        if str(p.get("provider_name", "")).upper() == name.upper():
            return p
    return None


def main():
    env = load_env()
    bolna = env.get("BOLNA_API_KEY") or ""
    sarvam = env.get("SARVAM_API_KEY") or ""
    fireworks = env.get("FIREWORKS_API_KEY") or ""
    model = env.get("FIREWORKS_MODEL") or "accounts/fireworks/models/llama-v3p3-70b-instruct"
    family = env.get("LLM_FAMILY") or "llama"
    missing = [k for k, v in (
        ("BOLNA_API_KEY", bolna),
        ("SARVAM_API_KEY", sarvam),
        ("FIREWORKS_API_KEY", fireworks),
    ) if not v]
    if missing:
        sys.exit("Missing in .env: " + ", ".join(missing))

    print("Bolna key", mask(bolna))
    ok, status, who, resp = check_bolna(bolna)
    print("  GET /user/me ->", status, who or "")
    if not ok:
        sys.exit("Bolna key rejected: " + json.dumps(resp)[:500])

    print("Fireworks key", mask(fireworks))
    ok, status, ids, resp = check_fireworks(fireworks)
    print("  GET /models ->", status, "count=%s" % len(ids))
    if not ok:
        sys.exit("Fireworks key rejected: " + json.dumps(resp)[:500])
    if model not in ids:
        print("  warning: %s not in this account's model list (%s listed)" % (model, len(ids)))
        llama = [i for i in ids if "llama" in i.lower()]
        print("  llama models:", ", ".join(llama[:12]) or "(none)")
    else:
        print("  model present:", model)

    print("Sarvam key", mask(sarvam))
    ok, status, resp = check_sarvam(sarvam)
    print("  POST /text-to-speech (empty) ->", status)
    if not ok:
        sys.exit("Sarvam key rejected: " + json.dumps(resp)[:500])

    status, listed = call("GET", "/providers", bolna)
    print("Bolna providers GET ->", status)
    if status != 200:
        sys.exit("Could not list Bolna providers: " + json.dumps(listed)[:500])
    existing = already_has(listed, "SARVAM")
    if existing:
        print("  SARVAM already connected:", existing.get("provider_id"), existing.get("provider_value"))
    else:
        status, resp = call("POST", "/providers", bolna, {
            "provider_name": "SARVAM",
            "provider_value": sarvam,
        })
        print("  POST SARVAM ->", status, json.dumps(resp)[:300])
        if status not in (200, 201):
            sys.exit("Failed to add SARVAM on Bolna")

    status, custom = call("GET", "/user/model/custom", bolna)
    print("Bolna custom models GET ->", status)
    models = []
    if isinstance(custom, dict):
        models = custom.get("models") or []
    elif isinstance(custom, list):
        models = custom
    found = next((m for m in models if m.get("model") == model or m.get("custom_model_name") == model), None)
    if found:
        print("  Fireworks model already registered:", found.get("id"), found.get("model") or found.get("custom_model_name"))
    else:
        status, resp = call("POST", "/user/model/custom", bolna, {
            "custom_model_name": model,
            "custom_model_url": FIREWORKS_BASE,
            "custom_model_key": fireworks,
            "custom_model_family": family,
        })
        print("  POST custom Fireworks model ->", status, json.dumps(resp)[:400])
        if status not in (200, 201):
            sys.exit("Failed to register Fireworks custom LLM on Bolna")

    print("Done. Keys are in .env (gitignored). Next: set PUBLIC_URL, then create agents.")


if __name__ == "__main__":
    main()
