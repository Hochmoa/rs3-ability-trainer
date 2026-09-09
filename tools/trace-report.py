#!/usr/bin/env python3
"""
Readable timeline of a session trace (src/app/core/trace.ts).

    python tools/trace-report.py trace.json              # a trace saved from the Settings page
    python tools/trace-report.py --latest                # the newest trace on the server (supabase db query --linked)
    python tools/trace-report.py --latest --user PVME    # of one account (display name)
    python tools/trace-report.py --latest --list         # the last traces on the server, no timeline

Every line is one event: the tick, what happened, and the engine's state where the trace carries one:
step index and expected key, adrenaline, GCD end, wield, the held stall, the channel, buffs with stacks, the
cooldowns still running. Feedback lines are what the player saw.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# arrows and middle dots in the output: the Windows console defaults to cp1252
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def query(sql: str) -> list[dict]:
    """runs one read query against the linked project (newlines collapsed: npx.cmd drops the rest of an argument)"""
    sql = " ".join(sql.split())
    cmd = ["npx.cmd" if sys.platform == "win32" else "npx", "supabase", "db", "query", "--linked", "--output-format", "json", sql]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=ROOT)
    out = r.stdout.strip()
    start = out.find("{")
    if start < 0:
        sys.exit("no result: " + out[-500:] + r.stderr[-500:])
    return json.loads(out[start:]).get("rows", [])


def latest(user: str | None, list_only: bool) -> dict | None:
    where = "where p.display_name::text = '" + user.replace("'", "''") + "'" if user else ""
    if list_only:
        rows = query(f"select t.id, p.display_name::text owner, t.started_at, t.rotation_name, t.reason, t.events, t.build from session_traces t join profiles p on p.id = t.user_id {where} order by t.started_at desc limit 20")
        for r in rows:
            print(r["started_at"][:16], "|", r["owner"], "|", r["rotation_name"], "|", r["reason"], "|", r["events"], "events |", r["build"])
        return None
    rows = query(f"select t.trace from session_traces t join profiles p on p.id = t.user_id {where} order by t.started_at desc limit 1")
    if not rows:
        sys.exit("no trace on the server" + (" for " + user if user else ""))
    t = rows[0]["trace"]
    return json.loads(t) if isinstance(t, str) else t


def short(key: str | None) -> str:
    if not key:
        return "-"
    return key.split(":", 1)[1] if ":" in key else key


def state_line(s: dict | None) -> str:
    if not s:
        return ""
    parts = [f"step {s['step']} exp {short(s.get('expected'))}", f"adr {s['adrenaline']}"]
    if s.get("gcdEnd") is not None:
        parts.append(f"gcd→{s['gcdEnd']}")
    if s.get("busyUntil") is not None:
        parts.append(f"busy→{s['busyUntil']}")
    w = s.get("wield") or {}
    parts.append("wield " + (w.get("twoHand") or ((w.get("mainHand") or "-") + "/" + (w.get("offHand") or "-"))))
    if s.get("queued"):
        parts.append("queued " + short(s["queued"]))
    if s.get("inflight"):
        parts.append("inflight " + ",".join(short(k) for k in s["inflight"]))
    if s.get("held"):
        parts.append(f"held {short(s['held']['key'])}@{s['held']['tick']}")
    if s.get("channel"):
        c = s["channel"]
        parts.append(f"channel {short(c['key'])} {c['hitsDone']}/{c['hits']}→{c['endTick']}")
    buffs = s.get("buffs") or []
    if buffs:
        parts.append("buffs " + ",".join(f"{b[0]}" + (f"x{b[1]}" if b[1] and b[1] != 1 else "") + (f"→{b[2]}" if b[2] is not None else "") for b in buffs))
    if s.get("spirits"):
        parts.append("spirits " + ",".join(f"{x[0]}→{x[1]}" for x in s["spirits"]))
    cds = s.get("cooldowns") or []
    if cds:
        parts.append("cd " + ",".join(f"{short(k)}→{r}" for k, r in cds))
    if s.get("prayers"):
        parts.append("pray " + ",".join(s["prayers"]))
    return " | ".join(parts)


def report(t: dict) -> None:
    setup = t.get("setup") or {}
    print("=== " + " · ".join(x for x in [setup.get("boss"), setup.get("name")] if x) + " | " + t["rotation"]["name"] + (" (chained)" if t["rotation"].get("chained") else ""))
    print("build", t.get("build"), "| started", t.get("startedAt"), "| reason", t.get("reason"), "|", len(t.get("events", [])), "events")
    steps = t.get("steps") or []
    print("--- steps")
    for i, s in enumerate(steps):
        flags = [k for k in ("sameTick", "stall", "release", "requiresAction", "phase") if s.get(k)]
        extra = (" (" + s["hint"] + ")" if s.get("hint") else "") + ("  " + " ".join(flags) if flags else "")
        if s.get("offsetTicks") is not None:
            extra += f"  +{s['offsetTicks']}t"
        name = s.get("note") if s.get("kind") == "note" else s.get("kind", "?") + ":" + s.get("id", "")
        print(f"  {i:3d}  {name}{extra}")
    lo = t.get("loadout") or {}
    eq = lo.get("equipment") or {}
    print("--- worn:", ", ".join(f"{k}={v['id']}" for k, v in eq.items() if v))
    print("--- backpack:", ", ".join(f"{r['kind']}:{r['id']}" for r in (lo.get("inventory") or []) if r))
    print("--- events")
    for e in t.get("events", []):
        kind = e["kind"]
        tick = e.get("tick")
        head = f"{e['t']:7d}ms t{tick if tick is not None and tick >= 0 else '-':>5} {kind:16s}"
        body = ""
        if kind == "input":
            body = f"{short(e.get('key'))} via {e.get('source')}"
        elif kind == "feedback":
            body = f"[{e.get('cls')}] {e.get('text')}"
        elif kind == "fired":
            r = e.get("result") or {}
            body = f"{r.get('name')} {r.get('outcome')}" + (f" by {r.get('lateTicks')} ticks" if r.get("lateTicks") else "") + (" auto" if r.get("auto") else "") + (" (auto-attack slipped in before)" if r.get("autoAttackBefore") else "")
        elif kind == "hit":
            body = f"{short(e.get('key'))} {e.get('amount')}" + (" crit" if e.get("crit") else "") + (" miss" if e.get("miss") else "") + (" dot" if e.get("dot") else "")
        elif kind == "gear":
            body = f"{e.get('action')} {e.get('item')}"
        else:
            body = ", ".join(f"{k}={short(v) if isinstance(v, str) and ':' in v else v}" for k, v in e.items() if k not in ("t", "tick", "kind", "state"))
        line = head + " " + body
        st = state_line(e.get("state"))
        print(line + ("\n" + " " * 33 + st if st else ""))
    live = t.get("liveAtEnd")
    if live:
        print("--- backpack at the end:", ", ".join(f"{r['kind']}:{r['id']}" for r in (live.get("inventory") or []) if r))


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file", nargs="?", help="trace JSON saved from the Settings page")
    ap.add_argument("--latest", action="store_true", help="the newest trace on the server")
    ap.add_argument("--user", help="display name, with --latest")
    ap.add_argument("--list", action="store_true", help="list the last traces on the server")
    args = ap.parse_args(argv)
    if args.latest or args.list:
        t = latest(args.user, args.list)
        if t:
            report(t)
        return 0
    if not args.file:
        ap.print_help()
        return 2
    report(json.loads(Path(args.file).read_text(encoding="utf-8")))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
