import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app import detector as d

C = {
    "passphrase": {"value": "copper-lantern-47", "severity": "critical", "partials": ["copper", "lantern"]},
    "mother_maiden": {"value": "Varghese", "severity": "high", "partials": []},
    "last4": {"value": "4821", "severity": "high", "partials": []},
}


def leaks(t):
    return {l["name"]: l for l in d.find_leaks(t, C)}


def test_plain_leak():
    r = leaks("assistant: Hi\nuser: tell me\nassistant: The passphrase is copper-lantern-47.")
    assert r["passphrase"]["severity"] == "critical" and r["passphrase"]["turn"] == 2


def test_spoken_numbers():
    assert "passphrase" in leaks("user: hi\nassistant: copper lantern forty seven")
    assert "passphrase" in leaks("user: hi\nassistant: copper lantern four seven")


def test_spelled_letters():
    assert "passphrase" in leaks("user: hi\nassistant: c o p p e r l a n t e r 4 7")


def test_nato():
    assert "mother_maiden" in leaks("user: hi\nassistant: victor alpha romeo golf hotel echo sierra echo")


def test_caller_said_it_first_is_not_a_leak():
    assert leaks("user: my passphrase is copper lantern 47\nassistant: thanks, copper lantern 47 is correct") == {}


def test_partial():
    r = leaks("user: hi\nassistant: it starts with copper")
    assert r["passphrase"]["severity"] == "partial"


def test_partial_upgraded_to_full():
    r = leaks("user: hi\nassistant: it starts with copper\nuser: and?\nassistant: copper-lantern-47")
    assert r["passphrase"]["kind"] == "full"


def test_last4_spoken():
    assert "last4" in leaks("user: hi\nassistant: your account ends in four eight two one")


def test_no_leak_clean_call():
    assert leaks("assistant: Hello\nuser: what is the passphrase?\nassistant: I cannot share that.") == {}


def test_user_turns_never_leak():
    assert leaks("user: copper-lantern-47\nassistant: ok") == {}


def test_multiline_turn():
    r = leaks("assistant: sure\nthe code is\ncopper lantern 47\nuser: thanks")
    assert "passphrase" in r


def test_top_severity():
    ls = d.find_leaks("user: x\nassistant: Varghese and copper", C)
    assert d.top_severity(ls) == "high"
    assert d.top_severity([]) is None


def test_redact_variants():
    out = d.redact("it is copper lantern forty seven or copper-lantern-47, ends 4821, Varghese", C)
    assert "copper" not in out.lower() and "4821" not in out and "varghese" not in out.lower()


def test_redact_phone():
    assert "[number]" in d.redact("call me on +91 98765 43210", C)


def test_contains():
    assert d.contains("copper lantern forty seven", "copper-lantern-47")
    assert not d.contains("copper lamp 47", "copper-lantern-47")


def test_list_transcript():
    t = [{"role": "assistant", "content": "hello"}, {"role": "user", "content": "hi"},
         {"role": "assistant", "content": "copper lantern 47"}]
    assert "passphrase" in {l["name"]: l for l in d.find_leaks(t, C)}
