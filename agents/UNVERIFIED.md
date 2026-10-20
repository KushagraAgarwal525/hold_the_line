# Unverified agent fields

Fetched 20 Oct 2026. Do not POST these JSON files. They are drafts of fields the docs showed. They are not a live agent.

## What is verified

`tools.json` is a list of custom function objects. Each object uses the fields from the custom function schema reference: `name`, `description`, `pre_call_message`, `parameters`, `key` (`custom_task`), and `value` (`method`, `param`, `url`, `headers`). `api_token` is omitted on purpose. Set it at deploy time from `TOOL_AUTH_TOKEN`. The URLs use `example.invalid` plus `?door=` so a later deploy can point them at this app. `get_account_summary` uses `"param": {}` and `"required": []`. The schema says `param` is required, but every example had at least one key. An empty `param` was not shown.

`config.json` uses the minimal `POST /v2/agent` body from the create-agent page: `agent_config.agent_name`, `agent_welcome_message`, `tasks[].task_type`, `toolchain.execution`, `toolchain.pipelines`, `tools_config.llm_agent`, `synthesizer`, `transcriber`, `input`, `output`, and `task_config.call_terminate` / `hangup_after_silence`. The welcome message is the experiment disclosure. `call_terminate` is 180 seconds (the 3 minute cap from the brief). The model `gpt-4.1-mini` and the ElevenLabs example voice are copied from the API quickstart. Account availability was not checked.

`agent_prompts.task_1.system_prompt` inside `config.json` is a placeholder. The prompt to deploy is `prompt.md`, after substituting the `{{MERIDIAN_*}}` placeholders from the server environment. Door 1 and Door 2 prompts contain those placeholders. Door 3's prompt has no secret placeholders.

## What was not seen

- No `end_call` tool. Hangup in the docs is `task_config.call_terminate`, `hangup_after_silence`, and `hangup_after_LLMCall`. The create-agent page says `hangup_after_LLMCall` will "pretty soon" be replaced by a predefined function. That function's name was not shown.
- `tools_config.api_tools` exists on the create-agent schema. Its `tools` array `oneOf` lists only `TransferCallTools`, and the description says the tools need to be a JSON string. A custom function nested inside `api_tools` was not shown. Do not wrap `tools.json` into `api_tools` until that shape is seen.
- `PUT /v2/agent/{agent_id}` is linked as a full replace. That page was not fetched, so its body is unverified. `PATCH /v2/agent/{agent_id}` was fetched. It can update `agent_prompts.task_1.system_prompt`. That is documentation, not a tested call. Gate G6 is not passed.
- Webhook signing was not shown. Source IPs were. `config.json` leaves `webhook_url` unset until a public HTTPS endpoint exists.
- Hinglish ASR was not configured. The transcriber language in the draft is `en`, from the quickstart example. Gate G4 is open.
- The example voice id was not confirmed against List voices on this account.
