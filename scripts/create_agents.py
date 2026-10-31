"""Create the Door 1 and Door 3 agents on Bolna and write their ids to .agents.json.
Usage: python scripts/create_agents.py [--only door1|door3] [--print]"""
import json, sys
from _common import ROOT, call, load_env, upsert_env

WELCOME = ("Meridian Savings night desk. I'm an AI in a public experiment. This call is recorded. How can I help?")


def render(template, env):
    for k in ("CUSTOMER_NAME", "LAST4", "MOTHER_MAIDEN", "PASSPHRASE", "BALANCE"):
        template = template.replace("{{%s}}" % k, env.get(k, ""))
    return template


def body(door, env):
    provider = env.get("TELEPHONY_PROVIDER", "twilio")
    prompt = render((ROOT / "agents" / ("%s_prompt.md" % door)).read_text(), env)
    return {
        "agent_config": {
            "agent_name": "Hold the Line - %s" % door,
            "agent_welcome_message": WELCOME,
            "webhook_url": "%s/api/webhooks/bolna?token=%s" % (env["PUBLIC_URL"].rstrip("/"), env["WEBHOOK_TOKEN"]),
            "agent_type": "other",
            "tasks": [{
                "task_type": "conversation",
                "toolchain": {"execution": "sequential", "pipelines": [["transcriber", "llm", "synthesizer"]]},
                "tools_config": {
                    "llm_agent": {
                        "agent_type": "simple_llm_agent", "agent_flow_type": "streaming",
                        "llm_config": {
                            "agent_flow_type": "streaming", "provider": "custom",
                            "family": env.get("LLM_FAMILY", "llama"), "model": env["FIREWORKS_MODEL"],
                            "base_url": "https://api.fireworks.ai/inference/v1",
                            "max_tokens": 80, "temperature": 0.2,
                            "extra_body": {"chat_template_kwargs": {"enable_thinking": False}}}},
                    "transcriber": {
                        "provider": "sarvam", "model": env.get("STT_MODEL", "saaras:v4"),
                        "language": env.get("STT_LANGUAGE", "en"), "stream": True,
                        "encoding": "mulaw" if provider == "twilio" else "linear16", "endpointing": 250},
                    "synthesizer": {
                        "provider": "sarvam",
                        "provider_config": {
                            "voice": env.get("TTS_VOICE", "Priya"), "voice_id": env.get("TTS_VOICE_ID", "priya"),
                            "model": env.get("TTS_MODEL", "bulbul:v3"), "language": env.get("TTS_LANGUAGE", "en")},
                        "stream": True, "buffer_size": 150, "audio_format": "wav"},
                    "input": {"provider": provider, "format": "wav"},
                    "output": {"provider": provider, "format": "wav"},
                },
                "task_config": {
                    "call_terminate": 120, "hangup_after_silence": 20,
                    "inbound_limit": int(env.get("INBOUND_LIMIT", "8")),
                    "incremental_delay": 250, "number_of_words_for_interruption": 4,
                    "welcome_message_delay": 0, "check_if_user_online": False,
                    "hangup_after_LLMCall": False},
            }],
        },
        "agent_prompts": {"task_1": {"system_prompt": prompt}},
    }


def main():
    env = load_env()
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    doors = [only] if only else ["door1", "door3"]
    for k in ("BOLNA_API_KEY", "PUBLIC_URL", "WEBHOOK_TOKEN", "FIREWORKS_MODEL", "PASSPHRASE"):
        if not env.get(k):
            sys.exit("Missing %s in .env" % k)
    if "--print" in sys.argv:
        print(json.dumps({d: body(d, env) for d in doors}, indent=2))
        return
    path = ROOT / ".agents.json"
    ids = json.loads(path.read_text()) if path.exists() else {}
    update = "--update" in sys.argv
    for d in doors:
        payload = body(d, env)
        if update:
            aid = ids.get(d) or env.get(d.upper() + "_AGENT_ID")
            if not aid:
                sys.exit("No agent id for %s; create it first without --update" % d)
            status, resp = call("PUT", "/v2/agent/%s" % aid, env["BOLNA_API_KEY"], payload)
            if status != 200:
                print("FAILED update %s: HTTP %s\n%s" % (d, status, json.dumps(resp, indent=2)))
                continue
            print("Updated %s: %s" % (d, aid))
            continue
        status, resp = call("POST", "/v2/agent", env["BOLNA_API_KEY"], payload)
        if status != 201:
            print("FAILED %s: HTTP %s\n%s" % (d, status, json.dumps(resp, indent=2)))
            print("Hint: 400 on transcriber/voice means the model, language or voice id pair is wrong. "
                  "Change STT_MODEL / STT_LANGUAGE / TTS_VOICE_ID in .env and re-run with --only %s." % d)
            continue
        ids[d] = resp["agent_id"]
        upsert_env(d.upper() + "_AGENT_ID", resp["agent_id"])
        print("Created %s: %s" % (d, resp["agent_id"]))
    path.write_text(json.dumps(ids, indent=2))
    print("Saved", path)


if __name__ == "__main__":
    main()
