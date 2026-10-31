"""SQLite locally, Postgres on Vercel when DATABASE_URL is set."""
import os
import sqlite3
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CALL_COLS = (
    "id,door,agent_id,provider_call_id,caller_hash,source,status,counted,"
    "duration_s,cost_cents,started_at,raw_transcript,transcript,breach_turns,"
    "persuaded,harmed,severity"
)
CALL_PLACE = ",".join("?" for _ in CALL_COLS.split(","))
_lock = threading.Lock()
_conn = None
_kind = "sqlite"


def _postgres():
    return bool(os.getenv("DATABASE_URL"))


def _connect():
    if _postgres():
        import psycopg
        from psycopg.rows import dict_row
        return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row, connect_timeout=10)
    path = os.getenv("DB_PATH", str(ROOT / "data.db"))
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _schema(conn):
    if _kind == "postgres":
        conn.execute("""
CREATE TABLE IF NOT EXISTS calls(
  id TEXT PRIMARY KEY, door TEXT, agent_id TEXT, provider_call_id TEXT, caller_hash TEXT,
  source TEXT, status TEXT, counted INTEGER, duration_s DOUBLE PRECISION, cost_cents DOUBLE PRECISION,
  started_at DOUBLE PRECISION, raw_transcript TEXT, transcript TEXT, breach_turns TEXT,
  persuaded INTEGER, harmed INTEGER, severity TEXT)""")
        conn.execute("""
CREATE TABLE IF NOT EXISTS events(
  id SERIAL PRIMARY KEY, door TEXT, call_key TEXT, type TEXT,
  severity TEXT, detail TEXT, at DOUBLE PRECISION)""")
        conn.commit()
        return
    conn.executescript("""
CREATE TABLE IF NOT EXISTS calls(
  id TEXT PRIMARY KEY, door TEXT, agent_id TEXT, provider_call_id TEXT, caller_hash TEXT,
  source TEXT, status TEXT, counted INTEGER, duration_s REAL, cost_cents REAL, started_at REAL,
  raw_transcript TEXT, transcript TEXT, breach_turns TEXT,
  persuaded INTEGER, harmed INTEGER, severity TEXT);
CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT, door TEXT, call_key TEXT, type TEXT,
  severity TEXT, detail TEXT, at REAL);
""")
    conn.commit()


def init():
    global _conn, _kind
    _kind = "postgres" if _postgres() else "sqlite"
    _conn = _connect()
    _schema(_conn)


def _sql(sql):
    if _kind == "postgres":
        return sql.replace("?", "%s")
    return sql


def _rows(fetched):
    return [dict(r) for r in fetched]


def _reset():
    global _conn
    try:
        if _conn is not None:
            _conn.close()
    except Exception:
        pass
    _conn = _connect()


def q(sql, args=()):
    with _lock:
        try:
            cur = _conn.execute(_sql(sql), args)
            return _rows(cur.fetchall())
        except Exception:
            if _kind != "postgres":
                raise
            _reset()
            cur = _conn.execute(_sql(sql), args)
            return _rows(cur.fetchall())


def run(sql, args=()):
    with _lock:
        try:
            _conn.execute(_sql(sql), args)
            _conn.commit()
        except Exception:
            if _kind != "postgres":
                raise
            _reset()
            _conn.execute(_sql(sql), args)
            _conn.commit()


def upsert_call(values):
    if _kind == "sqlite":
        run("INSERT OR REPLACE INTO calls(%s) VALUES(%s)" % (CALL_COLS, CALL_PLACE), values)
        return
    updates = ",".join("%s=EXCLUDED.%s" % (c, c) for c in CALL_COLS.split(",") if c != "id")
    run("INSERT INTO calls(%s) VALUES(%s) ON CONFLICT (id) DO UPDATE SET %s" % (CALL_COLS, CALL_PLACE, updates), values)
