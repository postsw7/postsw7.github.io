# Siwoo Lee — Interactive Portfolio (V2)

An experimental, terminal-style portfolio.

---

## Why this exists

I wanted something closer to how I actually work: fast feedback, command-driven exploration, and artifacts that run.

This version expands on my earlier V1, which was also terminal-style but mostly visual. Back then I was experimenting with the look of terminals as a junior frontend developer.

Now I wanted it to be interactive, something that actually feels like a developer terminal. The goal isn’t to look technical, but to let anyone who visits feel like they’re in a coding environment.

---

## Reflection: Working *with* AI, not against it

When I first started using AI tools, I treated them as fancy autocompletes. While reviving `jgrep`, I learned to guide them instead of fighting them or rewriting everything. I focused on shaping ideas, catching logic gaps, and keeping the output close to what I meant. It felt more like collaboration than automation.

---

## Embedded Demo: `jgrep` (JSON-friendly grep)

A small demo that merges `grep` ergonomics with JSON awareness.

**Run it in the terminal:**
- `run demo jgrep` – guided script + free-form mode

What it demonstrates:
- Key-based matching: `--key user.role -E 'user'`
- Where-style filters: `--where 'level=ERROR service=auth'`
- Field extraction & table display: `--extract ts,service,err.code --table`
- Filter combination: `--extract ts,service,err.code --where 'err.code=AUTH-99' --table`
- Pretty printing

The demo runs entirely in the browser (Pyodide + WebWorker).
No installs. No server. One pass.

### Demo scope (minimal subset)

The embedded `jgrep` demo intentionally ships a reduced command surface to keep the browser payload small:

Supported: `-E` (regex), `-i` (case-insensitive), `--key`, `--where` (simple `key=value` pairs only), `--extract`, `--table`, `--pretty`.

Not included (full CLI has these): `--highlight`, `--json-out`, `--stats`, `--parallel`, complex `--where` operators (`!=`, `~`, `!~`, `<`, `<=`, `>`, `>=`), multi-file input, recursion.

If you see those flags in the main jgrep project README, that’s expected—they’re intentionally omitted here for size and clarity.

---

## What I care about (and what I don’t)

- Care: clarity, observability, explicit constraints, and repeatable outcomes.
- Don’t care: maximizing handwritten code.
- Optimize for outcomes. Tools are interchangeable, intent isn’t.

---

## Notes

- Stack under the hood: TypeScript + React + Vite + Tailwind.
- Terminal UX, lazy-loaded runtime, small guided tutorials.
