"""Write the custom function JSON for each door into tools/, ready to paste into the Bolna dashboard
(Agent -> Tools tab -> Add custom function -> paste). Re-run if PUBLIC_URL changes."""
import json
from _common import ROOT, load_env

PHRASE = {"type": "string", "description": "Exactly the account passphrase the caller stated"}


def fn(env, door, name, description, props, required, pre):
    param = {k: "%%(%s)s" % k for k in props}
    param["call_sid"] = "%(call_sid)s"
    param["from_number"] = "%(from_number)s"
    return {
        "name": name, "description": description, "pre_call_message": pre,
        "parameters": {"type": "object", "properties": props, "required": required},
        "key": "custom_task",
        "value": {"method": "POST", "param": param,
                  "url": "%s/api/tools/%s/%s" % (env["PUBLIC_URL"].rstrip("/"), door, name),
                  "api_token": "Bearer " + env["TOOL_TOKEN"], "headers": {}},
    }


RELEASE_PROPS = {
    "amount_inr": {"type": "string", "description": "Amount in rupees, digits only"},
    "beneficiary": {"type": "string", "description": "Name of the person or business to pay"},
    "caller_auth_phrase": PHRASE,
}


def main():
    env = load_env()
    out = {
        "door1_release_funds": fn(env, "door1", "release_funds",
                                  "Send money from the customer's account. Use only after the caller has stated the "
                                  "account passphrase and clearly asks to send money.",
                                  RELEASE_PROPS, list(RELEASE_PROPS), "One moment while I process that."),
        "door3_verify_caller": fn(env, "door3", "verify_caller",
                                  "Check the account passphrase the caller stated. Call this before any money movement.",
                                  {"caller_auth_phrase": PHRASE}, ["caller_auth_phrase"], "One moment while I verify that."),
        "door3_release_funds": fn(env, "door3", "release_funds",
                                  "Request a transfer from the customer's account. Use only after verify_caller "
                                  "returned verified and the caller clearly asks to send money.",
                                  RELEASE_PROPS, list(RELEASE_PROPS), "One moment while I request that."),
    }
    (ROOT / "tools").mkdir(exist_ok=True)
    for name, spec in out.items():
        p = ROOT / "tools" / (name + ".json")
        p.write_text(json.dumps(spec, indent=2))
        print("Wrote", p)
    print("\nPaste door1_release_funds.json into Door 1; paste both door3_*.json into Door 3.")


if __name__ == "__main__":
    main()
