"""Push runtime secrets from .env to the linked Vercel project.
Does not print values. Skips empty keys and provider API keys."""
import shutil
import subprocess
import sys

from _common import ROOT, load_env

VERCEL = shutil.which("vercel.cmd") or shutil.which("vercel") or "vercel"

KEYS = (
    "TOOL_TOKEN", "WEBHOOK_TOKEN", "ADMIN_KEY", "HMAC_SECRET",
    "PASSPHRASE", "MOTHER_MAIDEN", "LAST4", "TEST_NUMBERS",
    "DOOR1_NUMBER", "DOOR3_NUMBER", "DOOR1_AGENT_ID", "DOOR3_AGENT_ID",
    "PUBLIC_URL",
)
TARGETS = "production,preview,development"


def put(name, value, sensitive=True):
    cmd = [VERCEL, "env", "add", name, TARGETS, "--yes", "--force"]
    cmd.append("--sensitive" if sensitive else "--no-sensitive")
    r = subprocess.run(cmd, input=value + "\n", text=True, capture_output=True, cwd=ROOT)
    if r.returncode != 0:
        sys.stderr.write(r.stdout + r.stderr)
        sys.exit("Failed to set %s" % name)
    print("set", name)


def main():
    env = load_env()
    for k in KEYS:
        v = env.get(k, "")
        if not v or "example" in v.lower():
            print("skip empty", k)
            continue
        put(k, v, sensitive=k != "PUBLIC_URL")
    print("Done. Redeploy for new values to take effect.")


if __name__ == "__main__":
    main()
