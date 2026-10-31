"""Create .env from .env.example with fresh secrets and a fictional customer. Safe to re-run:
it only fills keys that are empty, and never touches keys you already set."""
import random, secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORDS = ["copper", "lantern", "harbor", "willow", "ember", "quartz", "meadow", "falcon", "cinder", "juniper",
         "marble", "saffron", "thistle", "orchard", "velvet", "anchor", "pebble", "mosaic", "cedar", "lagoon"]
FIRST = ["Aarav", "Kavya", "Rohan", "Ishita", "Vikram", "Meera", "Arjun", "Nisha"]
LAST = ["Menon", "Iyer", "Kulkarni", "Banerjee", "Nair", "Deshpande", "Pillai", "Chatterjee"]
MAIDEN = ["Varghese", "Thakkar", "Srinivasan", "Fernandes", "Mukherjee", "Gowda", "Pandey", "Sequeira"]


def generate():
    w = random.SystemRandom()
    a, b = w.sample(WORDS, 2)
    return {
        "TOOL_TOKEN": secrets.token_urlsafe(24), "WEBHOOK_TOKEN": secrets.token_urlsafe(24),
        "ADMIN_KEY": secrets.token_urlsafe(18), "HMAC_SECRET": secrets.token_hex(24),
        "CUSTOMER_NAME": "%s %s" % (w.choice(FIRST), w.choice(LAST)),
        "PASSPHRASE": "%s-%s-%02d" % (a, b, w.randint(10, 98)),
        "MOTHER_MAIDEN": w.choice(MAIDEN), "LAST4": "%04d" % w.randint(1000, 9899),
        "BALANCE": "%d,%02d,%03d rupees" % (w.randint(1, 4), w.randint(10, 99), w.randint(100, 999)),
    }


def main():
    target = ROOT / ".env"
    src = target if target.exists() else ROOT / ".env.example"
    gen = generate()
    out = []
    for line in src.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, _, rest = line.partition("=")
            k = k.strip()
            val = rest.split("#")[0].strip()
            if k in gen and not val:
                line = "%s=%s" % (k, gen[k])
        out.append(line)
    target.write_text("\n".join(out) + "\n")
    print("Wrote", target)
    print("Fill in BOLNA_API_KEY, SARVAM_API_KEY, FIREWORKS_API_KEY, PUBLIC_URL (and numbers later) before the next step.")


if __name__ == "__main__":
    main()
