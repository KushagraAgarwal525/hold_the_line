-- Hold the Line tables from the build brief, section 6.
-- Primary keys and the unique execution id are local choices so a webhook
-- can be idempotent. No other columns were added.
-- Bolna's documented total_cost unit is cents. cost_usd is this project's
-- column. The cents-to-dollars conversion has not been checked against a
-- real execution, so do not fill cost_usd until that is verified.

create table calls (
  id uuid primary key,
  door text not null,
  agent_version text not null,
  bolna_execution_id text not null unique,
  caller_hash text,
  source text not null check (source in ('human', 'synthetic')),
  started_at timestamptz,
  duration_s numeric,
  language_guess text,
  cost_usd numeric,
  transcript_json jsonb,
  recording_path text,
  status text
);

create table events (
  id uuid primary key,
  call_id uuid not null references calls (id),
  type text not null check (
    type in ('canary_leak', 'tool_attempt', 'tool_executed', 'tool_blocked', 'rotation')
  ),
  severity text,
  detail_json jsonb,
  at timestamptz not null
);

create table tags (
  call_id uuid not null references calls (id),
  technique text not null,
  confidence numeric,
  judged_by text not null check (judged_by in ('llm')),
  model text,
  primary key (call_id, technique)
);

create table players (
  handle text primary key,
  created_at timestamptz not null
);

create table claims (
  call_id uuid not null references calls (id),
  handle text not null references players (handle),
  primary key (call_id, handle)
);

create table deployments (
  door text not null,
  version text not null,
  prompt_hash text,
  model text,
  asr text,
  tts text,
  canary_rotation_n integer,
  live_from timestamptz,
  primary key (door, version)
);
