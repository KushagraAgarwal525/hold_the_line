# Decisions

Today is Tuesday 20 Oct 2026. The build brief's "today is Oct 19" line is stale. G1 is due at the end of 20 Oct and is not passed. No Bolna, telephony, Vercel, or Supabase credentials are in this environment, so none of G1–G6 were executed. Section 4.1 is a prior reading. Where the pages below disagree with it, these notes follow the pages.

## Docs fetched on 20 Oct 2026

Index:

- https://www.bolna.ai/docs/llms.txt
- https://www.bolna.ai/docs/_llms/voice-agents.txt
- https://www.bolna.ai/docs/_llms/api-reference.txt

Pages read for this pass:

- https://www.bolna.ai/docs/quickstarts/api.md
- https://www.bolna.ai/docs/agents-md.md
- https://www.bolna.ai/docs/quickstarts/inbound.md
- https://www.bolna.ai/docs/api-reference/inbound/agent.md
- https://www.bolna.ai/docs/api-reference/inbound/unlink.md
- https://www.bolna.ai/docs/post-call/polling-call-status-webhooks.md
- https://www.bolna.ai/docs/tool-calling/custom-function-calls.md
- https://www.bolna.ai/docs/tool-calling/custom-function-schema.md
- https://www.bolna.ai/docs/tool-calling/custom-function-examples.md
- https://www.bolna.ai/docs/tool-calling/custom-function-variables.md
- https://www.bolna.ai/docs/tool-calling/introduction.md
- https://www.bolna.ai/docs/agent-setup/tools-tab.md
- https://www.bolna.ai/docs/inbound/ivr.md
- https://www.bolna.ai/docs/api-reference/executions/get_execution.md
- https://www.bolna.ai/docs/api-reference/executions/get_executions.md
- https://www.bolna.ai/docs/api-reference/agent/v2/patch_update.md
- https://www.bolna.ai/docs/api-reference/agent/v2/create.md
- https://www.bolna.ai/docs/outbound/hangup-calls.md
- https://www.bolna.ai/docs/get-started/what-it-costs.md
- https://www.bolna.ai/docs/pricing/call-pricing.md
- https://www.bolna.ai/docs/pricing/outbound-calling-concurrency.md

`PUT /v2/agent/{agent_id}` is linked from the patch page and was not fetched. Its body is unverified.

## Where section 4.1 disagrees with these pages

- The brief says the terminal status is `call-disconnected` after post-call processing. The quickstart, AGENTS.md, and the get-execution page say `call-disconnected` fires when the line drops, while `conversation_duration`, `total_cost`, `recording_url`, and `extracted_data` are still null or 0. The completed payload arrives later. Successful calls should be read at `completed`. Hard-failure statuses listed on the quickstart are `no-answer`, `busy`, `failed`, `canceled`, `stopped`, `error`, and `balance-low`.
- The brief says there is no SIP. These pages document SIP trunks (`trunk`) and legacy SIP trunks (`sip-trunk`, deprecated). Inbound quickstart: numbers on a SIP trunk are not listed by `GET /phone-numbers/all` and are not linked with `POST /inbound/setup`. Assign an agent with `PATCH /trunk/numbers/{number_id}`. That patch page was not fetched.
- The brief lists Twilio, Plivo, and Exotel. The create-agent and patch pages also list `vobiz`, `trunk`, `sip-trunk`, and `default`. The executions list filter also includes `web-call` and `websocket`.
- The brief says the platform fee is $0.02 per minute. `what-it-costs.md` and `call-pricing.md` describe a flat per-minute voice rate, separate telephony charges, and a Bolna platform fee. Neither page states $0.02. That number is unverified.
- The IVR guide lives at `/docs/inbound/ivr`, not `/guides/inbound/ivr-inbound-calls`. IVR is Plivo only.
- Custom function docs are at `/docs/tool-calling/custom-function-calls`. The path in the brief matches.

Confirmed from these pages, matching 4.1:

- Base URL `https://api.bolna.ai`. Auth header `Authorization: Bearer <api_key>`. A bad key returns `401 Access denied`.
- `POST /call` and `GET /executions/{execution_id}`.
- `GET /phone-numbers/all`, `POST /inbound/setup`, `POST /inbound/unlink`.
- `webhook_url` inside `agent_config`. Bolna POSTs as the status changes.
- Inbound calls have no concurrency limit and are not queued. Paid outbound concurrency starts at 10. Trial accounts are up to 2 concurrent calls, verified numbers only. Source: the concurrency page.
- `POST /v2/agent` and `POST /batches` return 201, not 200. The agent-create response field is `state`, not `status`. Source: AGENTS.md.

## Endpoints and fields actually seen

### `GET /user/me`

Source: https://www.bolna.ai/docs/quickstarts/api.md

Response fields in the sample: `id`, `name`, `email`, `wallet`, `concurrency.max`, `concurrency.current`.

### `POST /v2/agent`

Sources: quickstart and https://www.bolna.ai/docs/api-reference/agent/v2/create.md

Create returns HTTP 201. The create page's prose says the body is `{ "agent_id", "state": "created", "version_id" }`. The JSON sample on that page, and the quickstart sample, show `agent_id` and `state` only. `version_id` was named in prose and not in the sample. Treat it as unverified until a real response is seen.

Minimal body fields seen:

- `agent_config.agent_name`
- `agent_config.agent_welcome_message`
- `agent_config.tasks[].task_type` (`conversation` in the sample)
- `agent_config.tasks[].toolchain.execution` (`sequential` or `parallel`)
- `agent_config.tasks[].toolchain.pipelines` (array of arrays; sample `[["transcriber","llm","synthesizer"]]`)
- `agent_config.tasks[].tools_config.llm_agent.agent_type` (`simple_llm_agent`, `knowledgebase_agent`, `graph_agent`, `realtime_agent`)
- `agent_config.tasks[].tools_config.llm_agent.agent_flow_type` (`streaming`)
- `agent_config.tasks[].tools_config.llm_agent.llm_config.provider`, `model`, `max_tokens`, `temperature`
- `agent_config.tasks[].tools_config.synthesizer.provider`, `provider_config.voice`, `provider_config.voice_id`, `provider_config.model`, `stream`, `buffer_size`, `audio_format`
- `agent_config.tasks[].tools_config.transcriber.provider`, `model`, `language`, `stream`, `encoding`, `sampling_rate`, `endpointing`
- `agent_config.tasks[].tools_config.input.provider`, `input.format`
- `agent_config.tasks[].tools_config.output.provider`, `output.format`
- `agent_config.tasks[].task_config.call_terminate` (seconds)
- `agent_config.tasks[].task_config.hangup_after_silence` (seconds)
- `agent_prompts.task_1.system_prompt`

`tools_config.api_tools` is on the create schema: `tools` (array) and `tools_params`. The `tools` description says it needs to be a JSON string passed to the LLM. The OpenAPI `oneOf` on that page lists only `TransferCallTools`. A custom function object inside `api_tools.tools` was not shown. See `agents/UNVERIFIED.md`.

`task_config` fields also listed on the create page, not used in the draft: `hangup_after_LLMCall`, `incremental_delay`, `number_of_words_for_interruption`, `call_cancellation_prompt`, `backchanneling`, `backchanneling_message_gap`, `backchanneling_start_delay`, `ambient_noise`, `ambient_noise_track`, `inbound_limit`, `whitelist_phone_numbers`, `disallow_unknown_numbers`, `dtmf_enabled`, `auto_reschedule`, `welcome_message_delay`, `noise_cancellation_level`, `call_hangup_message`, `interruptible_hangup_message`, `check_if_user_online`, `trigger_user_online_message_after`, `voicemail`, `voicemail_detection_duration`, `voicemail_check_interval`, `voicemail_min_transcript_length`.

Quickstart sample model is `gpt-4.1-mini` at temperature `0.2`. The create page's later minimal sample uses `gpt-5.4-mini` at temperature `1`, and says GPT-5-series models require temperature `1`. The draft config uses the quickstart pair. Availability on this account was not checked.

### `POST /call`

Source: quickstart.

Request fields in the sample: `agent_id`, `recipient_phone_number`. Prose says `from_phone_number` may be omitted to use Bolna's default number, or set to a purchased number. The sample does not include it.

Response sample: `message` (`done`), `status` (`queued`), `execution_id`.

`user_data` is mentioned under next steps. Its shape was not on this page. Unverified.

### `GET /executions/{execution_id}`

Source: https://www.bolna.ai/docs/api-reference/executions/get_execution.md and the quickstart sample.

Path param: `execution_id` (uuid).

`AgentExecution` properties on the OpenAPI block:

- `id` (uuid)
- `agent_id` (uuid)
- `batch_id`
- `conversation_duration` (seconds, float)
- `total_cost` (described as cents)
- `status` enum: `scheduled`, `queued`, `rescheduled`, `initiated`, `ringing`, `in-progress`, `call-disconnected`, `completed`, `balance-low`, `busy`, `no-answer`, `canceled`, `failed`, `stopped`, `error`
- `error_message`
- `answered_by_voice_mail`
- `transcript` (string)
- `created_at`, `updated_at`
- `cost_breakdown.llm`, `network`, `platform`, `synthesizer`, `transcriber` (described as cents)
- `telephony_data.duration` (schema says string of digits; the completed example uses a number), `to_number`, `from_number`, `recording_url`, `hosted_telephony`, `provider_call_id`, `call_type` (`outbound` or `inbound`), `provider` (schema enum `twilio`, `plivo`), `hangup_by`, `hangup_reason`, `hangup_provider_code`, `ring_duration`, `post_dial_delay`, `to_number_carrier`
- `transfer_call_data.provider_call_id`, `status`, `duration`, `cost`, `to_number`, `from_number`, `recording_url`, `hangup_by`, `hangup_reason`, `hangup_provider_code`
- `batch_run_details.status`, `created_at`, `updated_at`, `retried`
- `summary` (nullable; only when `call_summary_enabled` is on)
- `extracted_data` (nullable object)
- `node_extracted_data` (nullable; graph agents)
- `context_details` (object; batch rows put CSV columns on `context_details.recipient_data`)

The completed JSON example also shows `user_number`, `agent_number`, and `latency_data.time_to_first_audio`. Those three are not in the OpenAPI property list on that page. The webhook stub redacts `user_number` and `agent_number` if they appear, and does not require them.

The transcript sample is one string: `assistant: ...\nuser: ...\nassistant: ...`. A structured turn array was not in the schema. The parser accepts only lines with an `assistant:` or `user:` prefix.

`telephony_data.provider` on the schema is `twilio` or `plivo`. Other pages list more providers. The example also shows `telephony_data.provider: plivo` and `call_type`.

### `GET /v2/agent/{agent_id}/executions`

Source: https://www.bolna.ai/docs/api-reference/executions/get_executions.md

Query fields: `page_number` (default 1), `page_size` (default 20, max 50), `status`, `call_type` (`inbound` or `outbound`), `provider` (`twilio`, `plivo`, `exotel`, `vobiz`, `trunk`, `sip-trunk`, `web-call`, `websocket`), `answered_by_voice_mail`, `batch_id`, `from` (required), `to` (required). `from` and `to` must be passed together, UTC ISO 8601, maximum span 7 days. The examples use a `Z` suffix. AGENTS.md says `scheduled_at` must use `+00:00` and not `Z`. That note is about `scheduled_at`, not these query params.

Response: `page_number`, `page_size`, `total`, `has_more`, `data[]` of `AgentExecution` as above.

### `GET /phone-numbers/all`

Source: https://www.bolna.ai/docs/quickstarts/inbound.md

Sample item fields: `id`, `phone_number`, `telephony_provider`, `agent_id`.

### `POST /inbound/setup`

Sources: inbound quickstart and https://www.bolna.ai/docs/api-reference/inbound/agent.md

Body fields: `agent_id` (required), `phone_number_id` (required), `allow_multiple` (boolean, default false, Plivo only), `ivr_config` (optional object).

`ivr_config` fields on the API page: `enabled`, `voice`, `welcome_message`, `timeout`, `max_retries`, `steps[]` (`step_id`, `type` `menu` or `collect`, `prompt`, `field_name`, `options`, `next_step`, `conditional_next`), `default_agent_id`.

The IVR guide also lists `invalid_input_message`, `no_input_message`, option fields `digit`, `label`, `agent_id`, `context_label`, and collect fields `num_digits`, `min_digits`, `max_digits`, `finish_on_key`. Voices named there: `Polly.Aditi`, `Polly.Raveena`, `Polly.Joanna`, `Polly.Matthew`, `Polly.Amy`. Collected values are described as landing in `recipient_data`, including `ivr_completed_at` in the example. Source: https://www.bolna.ai/docs/inbound/ivr.md

Quickstart response sample: `url`, `phone_number`, `id`. One IVR example response is `{ "message": "Phone number is already mapped to the given agent. IVR config updated." }`. The OpenAPI response schema lists `url`, `phone_number`, `id` and does not list `message`.

### `POST /inbound/unlink`

Source: https://www.bolna.ai/docs/api-reference/inbound/unlink.md

Body: `phone_number_id` (required uuid).

Response: `url` (null when unlink succeeds), `phone_number`, `id`.

### `PATCH /v2/agent/{agent_id}`

Source: https://www.bolna.ai/docs/api-reference/agent/v2/patch_update.md

Response sample: `{ "message": "success", "state": "updated" }`. HTTP 200.

Body: `agent_config` and/or `agent_prompts`. Patchable `agent_config` attributes listed: `agent_name`, `agent_welcome_message`, `webhook_url` (null removes it), `synthesizer`, `ingest_source_config`, `telephony_provider`, `calling_guardrails` (`call_start_hour`, `call_end_hour`, integers 0–23), `call_summary_enabled`. `agent_prompts.task_1.system_prompt` is the prompt field shown. Any other field in the body is ignored. This is the documented way to rotate a prompt. It has not been called. G6 is not passed.

`telephony_provider` enum: `twilio`, `plivo`, `exotel`, `vobiz`, `trunk`, `sip-trunk`, `default`.

### Webhooks

Source: https://www.bolna.ai/docs/post-call/polling-call-status-webhooks.md and the quickstart.

- Set `webhook_url` on the agent. Bolna POSTs the execution payload on status changes. The payload is the same shape as get-execution.
- The endpoint must be public HTTPS and should return 200 quickly.
- Source IPs: `13.203.39.153`, `13.126.9.249`, `13.202.133.53`. Same IPs are used for custom function calls and pre-call webhooks.
- Dashboard controls named but not specified as API fields: "Trigger on statuses", "Add headers", "Send test". Header names were not shown. No signature, shared secret, or HMAC was shown. Webhook authenticity is unverified. The stub does not check a signature and does not enforce the IP list.

### Custom functions

Sources: the custom-function pages and the tools tab.

Mandatory fields named on the guide: `name`, `description`, `key`, `method`. `key` must be `"custom_task"`.

Schema reference fields:

- `name`, `description`, `parameters` (required)
- `parameters.type`, `parameters.properties`, `parameters.required`
- property `type`: `string`, `integer`, `number`, `boolean`
- `pre_call_message` (optional)
- `key` = `custom_task` (required)
- `value` (required): `method` (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), `url`, `param`, optional `api_token`, optional `headers`, optional `pre_call_webhook_param`, optional `pre_call_webhook_url`
- Format specifiers: `%(name)s` string, `%(name)i` integer, `%(name)f` float

The POST examples show Bolna calling the tool URL with the `param` object as the JSON body and `api_token` as the `Authorization` header. No wrapper field such as `arguments` was in those examples. The tool routes read that body. A live call has not been seen. G2 is not passed.

Auto-injected variables shown: `{{agent_id}}`, `{call_sid}` (single braces in the table), `{{from_number}}`, `{{to_number}}`.

### Hangup

Source: https://www.bolna.ai/docs/outbound/hangup-calls.md and the create-agent `task_config`.

No tool named `end_call` was shown. Hangup controls that were shown: silence timeout, a prompt-based hangup (`hangup_after_LLMCall`), a closing message (`call_hangup_message`), and `call_terminate` in seconds. The draft sets `call_terminate` to 180 and `hangup_after_silence` to 10. It does not invent an `end_call` tool.

## Local decisions

- Prompts for Door 1 and Door 2 keep secrets as `{{MERIDIAN_*}}` placeholders. The filled prompt is not committed. Door 3's prompt has no secret placeholders. The Door 2 / Door 3 diff is the customer-record block versus a block that says the agent does not know those values and must say only what the tools return.
- Door 1 and Door 2 `get_account_summary` returns the full fictional record from the process environment, including the passphrase. Door 3 returns masked fields and none of the canaries. Door 1 and Door 2 `release_funds` records `executed: true` with no check. Door 3 never executes. A matching passphrase still returns "approval requested from the customer's registered device." and logs `tool_blocked`. The phrase itself is not written into the event detail.
- The webhook is idempotent on execution `id`. The same `id` plus the same `status` and the same stored JSON is a no-op. A later status updates that one record. Ignoring every POST after the first would drop `completed`, which is the payload that carries duration, cost, and the recording. The field `execution_id` from `POST /call` is not accepted as the key. The execution object uses `id`.
- Known phone fields `user_number`, `agent_number`, `to_number`, and `from_number` are replaced with `[redacted]` before the body is kept in memory. HMAC of the caller number is not implemented. Which of `from_number` or `to_number` is the caller on an inbound execution was not confirmed with a real payload.
- Public rates use `humanOnly`, which keeps `source === "human"` and drops `synthetic` and any other source. `outcomeRate` throws if the remaining rows mix doors or versions. Zero successes also set `ruleOfThreeUpper` to `3/n`. The Wilson interval uses z = 1.959963984540054. Both numbers are returned; the rule of three is the "about 3/N" figure from the brief, and it is not identical to the Wilson upper bound.
- `data/schema.sql` uses the columns from section 6. Primary keys and a unique `bolna_execution_id` were added so a later webhook can be idempotent. `tags` uses `(call_id, technique)` as its key. `cost_usd` is not filled from `total_cost` yet, because the docs describe that field as cents and no execution has been read.
- The in-memory stores reset when the process stops. There is no Supabase client in this pass.
- Agent JSON under `agents/*/v1/` is a draft of verified fields. `agents/UNVERIFIED.md` says not to POST it. `config.json` does not include `webhook_url` or `api_tools`.
- `/`, `/play`, and `/results` read `publicCallRows()`, which returns no rows. The human-call counter and the results page pass those rows through `humanOnly` and `outcomeRate`. When n is 0, the page says there is no interval and does not draw a rate. Breach red is used only when a harmed count is above zero, so this empty set does not use it. No sample calls, phone numbers, or transcripts are rendered.
- `/tape` reads `publicTapeCalls()`, which returns no rows. A human harmed call would be listed newest first, with the transcript redacted and then rendered as text. A violet bar marks a breach turn. Breached red is applied only to the assistant turn that contains the leak. An audio element is rendered only when the caller opted in and a recording path is stored.
- Retention is open. `/privacy` does not state a number of days for calls, transcripts, or recordings. The deletion-request channel is also open. Nothing is stored yet, so the page says there is nothing to delete and does not invent an address to write to. When calls are stored, the caller number is HMAC(secret, caller number) only. That HMAC is not implemented in this build.
- The closed-for-the-night banner is a local file, `data/local/closed-for-the-night.json`, which is gitignored. A missing or unreadable file means the banner is off. Supabase is not connected, so the flag stays on this machine. `/admin` fails closed unless `ADMIN_TOKEN` is set. There is no default password.
- `POST /inbound/unlink` is sent only when `BOLNA_API_KEY` is set and `BOLNA_PHONE_NUMBER_ID` matches the uuid shape from the unlink docs. The JSON body is `{ "phone_number_id" }` and nothing else. If either value is missing, the request is not sent and the admin page says why. A success line is shown only after an HTTP 200 from that call.

## Gates

| Gate | Result on 20 Oct 2026 |
| --- | --- |
| G1 | Not run. No Bolna key, no phone number, no telephony account. |
| G2 | Not run. No live custom-function call. |
| G3 | Not run. No webhook delivery and no execution fetch. |
| G4 | Not run. |
| G5 | Not run. |
| G6 | Not run. The patch page shows `agent_prompts.task_1.system_prompt`. That is not a tested update. |
