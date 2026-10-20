# Status

20 Oct 2026. Door 1 is not live. G1–G6 are not passed.

## What works

- Leak detector in `lib/leak-detector.ts`. Assistant text only. It lowercases, strips punctuation, collapses spelled-out letters, accepts NATO-alphabet runs of three or more words, and matches number words including "four seven" and "forty-seven". The leak-detector file is 48 tests, including 40 table cases and near-misses (wrong digit, extra digit, plural, swapped words, "punjab", "punes", a caller turn, a non-prefixed transcript line).
- Wilson 95% intervals, rule of three (`3/n`) when there are 0 successes, a human-only filter that drops `source !== "human"`, and a hard stop when rows mix doors or versions. Covered by `tests/stats.test.ts`.
- `data/schema.sql` for the section 6 tables.
- Draft prompts and JSON under `agents/door1/v1`, `agents/door2/v1`, and `agents/door3/v1`. Not deployed. See `agents/UNVERIFIED.md`.
- Next.js App Router. Routes: `POST /api/webhooks/bolna` (idempotent on execution `id`), `POST /api/tools/get_account_summary`, `POST /api/tools/release_funds`. Door 1 and Door 2 execute `release_funds` with no check. Door 3 never executes. Redaction is in `lib/redact.ts`.
- Public pages `/`, `/play`, `/tape`, `/results`, and `/privacy`. The home counter and the results rates call `humanOnly` and `outcomeRate` on an empty call list, so the counter is 0 and each door shows `n = 0` with no interval. Phone slots say the number is not assigned. The claim form does not submit. `/tape` is empty. `/privacy` says the caller number will be stored as an HMAC only, and that retention and the deletion-request channel are not decided. `/admin` fails closed unless `ADMIN_TOKEN` is set. The closed-for-the-night flag defaults to off and is stored in a local file. Unlink is not called without `BOLNA_API_KEY` and a `phone_number_id`. Breach red is unused because there is no leaking turn. `npx vitest run` on 20 Oct 2026: 11 files, 92 tests passed. `npx tsc --noEmit` and `npx next build` succeeded.

## What is broken

- No Bolna API key, no phone numbers, no public HTTPS URL, no Vercel project, no Supabase project. Nothing has been called.
- The webhook does not verify authenticity. The fetched docs show source IPs and do not show a signature. The stub does not enforce the IP list.
- Executions and tool events live in process memory. They disappear on restart. `schema.sql` has not been applied.
- `agents/*/v1/config.json` is not a create-agent request. The system prompt inside it is a placeholder. Custom functions are not nested into `api_tools`, because that nesting was not shown.
- The pages have no phone numbers and no measured chart. `/results` and `/tape` are empty states.
- Section 4.1's $0.02 per minute figure was not on the pricing pages fetched. Do not use it.

## Next 3 actions

1. When a Bolna key and a telephony number exist, run G1: `GET /phone-numbers/all`, then either three `POST /inbound/setup` links or one Plivo number with `ivr_config`. Place one inbound call.
2. Run G2 against `POST /api/tools/get_account_summary` and confirm the live request body. The examples show the `param` object as the JSON body. If a real call uses a wrapper, change the route to match what arrived.
3. Run G3: keep one real webhook body, with phone fields redacted, and only then map `transcript`, caller identity, and `telephony_data.recording_url` into `calls`.
