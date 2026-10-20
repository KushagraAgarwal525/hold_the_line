# Hold the Line

A public red-team range for a fictional banking voice agent. Three doors, one persona: prompt only, a hardened prompt, and tool-layer enforcement. Callers try to make it leak a secret or move money.

This checkout is not live. No phone number is attached. Door 1 is not taking calls. Bolna, telephony, Vercel, and Supabase are not connected. Gates G1–G6 are not passed. See `STATUS.md` and `DECISIONS.md`.

## Tests

```bash
npm install
npx vitest run
npx tsc --noEmit
```

`npx vitest run` on 20 Oct 2026: 6 files, 74 tests passed.

## Layout

- `lib/leak-detector.ts` scans assistant turns for the canaries.
- `lib/stats.ts` computes Wilson 95% intervals from `source = "human"` rows and refuses mixed versions.
- `lib/redact.ts` blocks canaries, emails, and phone-like numbers, then escapes HTML.
- `app/api/webhooks/bolna` stores a redacted execution payload and is idempotent on `id`.
- `app/api/tools/get_account_summary` and `app/api/tools/release_funds` implement the Door 1/2 versus Door 3 behavior against a local env record.
- `agents/door1/v1`, `agents/door2/v1`, `agents/door3/v1` are drafts. Do not POST them. See `agents/UNVERIFIED.md`.
- `data/schema.sql` is the Postgres schema. It has not been applied.

Copy `.env.example` to `.env` locally. Leave the values out of git.
