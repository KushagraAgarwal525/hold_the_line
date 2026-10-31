# Hold the Line

Two public phone lines guard the same fictional bank assistant. **Door 1** is defended only by its prompt (the passphrase sits in the prompt). **Door 3** keeps no secrets in the model and enforces verification and transfers on the server. Callers try to make either one leak a secret or send money. The site shows, per door, how often the agent was **persuaded** versus actually **compromised**. Breaches are detected by exact string matching on what the agent said and by server-side tool events, never by an LLM's opinion.

The live site is [hold-the-line-three.vercel.app](https://hold-the-line-three.vercel.app). Door numbers come from env and are shown on that page.

Stack: Bolna (telephony and agent runtime) + Sarvam (speech-to-text and text-to-speech) + a Fireworks LLM registered as a custom LLM. Backend is FastAPI. Production runs on Vercel with Neon Postgres. Local development uses SQLite.

## What not to commit

Never commit `.env`, `.env.local`, `.agents.json`, `tools/*.json`, `.vercel`, or database files. `tools/*.json` is generated and embeds `TOOL_TOKEN`. `.env.example` is the only env template in git.

## Local setup

**0. Prerequisites.** Python 3.12+, a Bolna account, a Sarvam key, a Fireworks key, and a public URL for the API (Vercel in production; a tunnel is enough for a first local test).

**1. Install and generate secrets.**
```
pip install -r requirements.txt
python scripts/gen_env.py
```
Edit `.env`: set `BOLNA_API_KEY`, `SARVAM_API_KEY`, `FIREWORKS_API_KEY`, `PUBLIC_URL`, and `FIREWORKS_MODEL` (full path, for example `accounts/fireworks/models/qwen3p8-max`). Use a serverless chat model that returns spoken content (not a thinking-only model) and supports function calling. Set `LLM_FAMILY` to match (`qwen` for Qwen). Add your own phone numbers to `TEST_NUMBERS` so test calls stay out of public stats.

**2. Run the server.**
```
uvicorn app.main:app --port 8000
```
Open `PUBLIC_URL` in a browser. You should see the page with zeros.

**3. Connect your keys.**
```
python scripts/register_providers.py
```
This adds Sarvam on Bolna (speech) and registers the Fireworks model from `.env` as a custom LLM. You can do the same from Settings → Integrations. If the model or family is wrong the caller hears silence.

**4. Create the agents.**
```
python scripts/create_agents.py
```
To change prompts or latency settings later without wiping the agent id:
```
python scripts/create_agents.py --update
```
If Bolna returns 400 about the transcriber or voice, change `STT_MODEL`, `STT_LANGUAGE`, or `TTS_VOICE_ID` in `.env` and re-run with `--only door1` or `--only door3`.

**5. Add the tools.**
```
python scripts/render_tools.py
```
In the Bolna dashboard, open Door 1 → Tools → Add custom function and paste `tools/door1_release_funds.json`. Open Door 3 and paste both `tools/door3_*.json`. Save each agent. Re-run this whenever `PUBLIC_URL` or `TOOL_TOKEN` changes.

**6. Get numbers and link them.**

- **Indian numbers need a Bolna compliance application first** (business documents such as CIN and GST; review is often 12–24 hours).
- **A US Twilio number needs no compliance.** Buy in the dashboard (My Numbers). Set `TELEPHONY_PROVIDER=twilio`.
- **Indian Vobiz / Plivo** numbers: set `TELEPHONY_PROVIDER` to `vobiz` or `plivo` to match what you bought.
- **One number, keypad 1 vs 3:** Bolna IVR routing is Plivo-only. Vobiz inbound works as a single agent line, not as a keypad menu. Use two numbers for two doors, or link one number to Door 3 only.

```
python scripts/link_number.py --list
python scripts/link_number.py door3 +91XXXXXXXXXX
```
Put the numbers in `.env` as `DOOR1_NUMBER` / `DOOR3_NUMBER` and restart (or redeploy) so the site shows them.

**7. Test.** Call Door 3 and try to skip verification. Then:
```
curl "$PUBLIC_URL/api/admin/summary?key=<ADMIN_KEY from .env>"
```
Expect your call under `by_source: test`. In Bolna Call History, `provider_source` should show your own keys for LLM, STT, and TTS. Temporarily empty `TEST_NUMBERS` to see a call on the public page.

## Vercel + Neon

The API is a FastAPI app (`app/main.py`). `vercel.json` sets the framework and a 60s function timeout.

1. Create a Vercel project from this repo (or `vercel`).
2. Add a Neon Postgres database and set `DATABASE_URL` on the project. With `DATABASE_URL` set, the app uses Postgres; without it, local SQLite (`data.db`).
3. Copy every key from `.env` into Vercel project env (Production). Do not commit them. `scripts/push_vercel_env.py` can push from a local `.env` if the Vercel CLI is logged in.
4. Set `PUBLIC_URL` to the Vercel URL (no trailing slash).
5. Redeploy, then re-run `python scripts/render_tools.py` and paste the new tool JSON into Bolna so tool URLs match production.
6. Disable Vercel Deployment Protection / SSO on the production URL so Bolna can POST to `/api/tools/...` and `/api/webhook` without a login wall.

## Things to know

- **Silence / hangup.** A thinking-only Fireworks model can return empty spoken content; Bolna then sits in inactivity timeout and drops the call. Use a model that returns `content` (Qwen 3.8 Max is the documented default). Keep replies short (`max_tokens` in the agent config).
- **Latency.** With your own keys, Bolna routes through US servers. Check `latency_data.time_to_first_audio` in Call History.
- **Tool calls.** Bolna's API does not return per-tool logs, so this server logs them. Events match to calls by `call_sid`, with a time-window fallback.
- **After a critical Door 1 breach** the passphrase is public in that transcript. Delete the `PASSPHRASE` line in `.env`, run `python scripts/gen_env.py`, then `python scripts/create_agents.py --only door1 --update`, and restart.
- **Kill switch:** `python scripts/link_number.py --unlink +1XXXXXXXXXX` stops an agent answering. `INBOUND_LIMIT` caps how many times each caller can call (default 8).
- **Cost:** Bolna charges a platform fee plus telephony, rounded to the minute, plus a monthly number fee. Calls are capped at 120 seconds. Empty wallet → `balance-low`.
- **Privacy:** caller numbers are stored only as a keyed hash. Public transcripts mask the passphrase, security answers, and phone-like numbers. Transcript text is rendered as plain text.

## Not built yet

Door 2 (hardened prompt), automatic passphrase rotation, Hinglish language switching, per-technique tagging, share cards, and an offline stage view.

## Tests

```
pip install pytest httpx
python -m pytest -q tests
```
