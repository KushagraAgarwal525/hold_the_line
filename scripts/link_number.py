"""List your Bolna numbers, or link one to a door.
python scripts/link_number.py --list
python scripts/link_number.py door1 +1XXXXXXXXXX
python scripts/link_number.py --unlink +1XXXXXXXXXX     (kill switch: stops the agent answering)"""
import json, re, sys
from _common import ROOT, call, load_env, upsert_env


def digits(s):
    return re.sub(r"\D", "", s or "")


def main():
    env = load_env()
    key = env.get("BOLNA_API_KEY")
    if not key:
        sys.exit("Missing BOLNA_API_KEY")
    status, nums = call("GET", "/phone-numbers/all", key)
    if status != 200:
        sys.exit("HTTP %s %s" % (status, nums))
    if "--list" in sys.argv or len(sys.argv) < 3:
        for n in nums:
            print(n.get("phone_number"), n.get("id"), n.get("telephony_provider"), n.get("agent_id"))
        return
    if sys.argv[1] == "--unlink":
        target = next((n for n in nums if digits(n["phone_number"]) == digits(sys.argv[2])), None)
        if not target:
            sys.exit("number not found")
        print(call("POST", "/inbound/unlink", key, {"phone_number_id": target["id"]}))
        return
    door, number = sys.argv[1], sys.argv[2]
    agents = json.loads((ROOT / ".agents.json").read_text())
    target = next((n for n in nums if digits(n["phone_number"]) == digits(number)), None)
    if not target:
        sys.exit("number not found on your account; run with --list")
    print(call("POST", "/inbound/setup", key, {"agent_id": agents[door], "phone_number_id": target["id"]}))
    upsert_env(door.upper() + "_NUMBER", number)
    print("Set %s_NUMBER=%s in .env" % (door.upper(), number))


if __name__ == "__main__":
    main()
