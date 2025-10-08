"""
Minimal jgrep engine for the web demo (Pyodide).

This is a deliberately reduced subset of the full jgrep CLI to minimize payload size and
keep the browser runtime simple. It focuses on quick, illustrative filtering & extraction.

Included flags:
    -E <pattern>          Regex search (Python re; no custom engine limitations here)
    -i                    Case-insensitive (prepends (?i) if not present)
    --key <path>          Require JSON key to exist (and if a pattern is provided, key value must match it)
    --where "k=v k2=v2"   Very small subset: only space-separated key=value pairs (logical AND). No operators like !=, ~, !~, <, <=, >, >=.
    --extract <fields>    Comma-separated field names for extraction
    --table               Render extracted rows as a simple table
    --pretty              Pretty-print matching JSON lines

Outputs:
    lines   (raw matched lines)
    tokens  (tokenized JSON with lightweight match segmentation for inline highlighting in React)
    table   (aligned columns from --extract + --table)
    pretty  (pretty-printed JSON blocks)

Explicitly NOT included (present in full CLI): --highlight, --json-out, --stats, --parallel, complex where operators, multi-file / recursive search.

If additional flags are passed they raise an error to keep UX explicit.
"""
from __future__ import annotations
import json, re
from typing import List, Dict, Any, Optional
from pathlib import Path

# Import only required subset from project modules
try:  # Optional: when running inside full repo sync (not required in standalone web build)
    from jgrep.engine import match_pattern as _regex_match  # type: ignore
    from jgrep.jsonmode import try_parse_json, get_nested_value, match_where, extract_fields, pretty_print_json  # type: ignore
except Exception:  # Fallback minimal implementations if import fails (web demo path)
    def _regex_match(line: str, pattern: str) -> bool:
        if not pattern:
            return True
        try:
            return re.search(pattern, line) is not None
        except re.error:
            return False
    def try_parse_json(line: str):
        try: obj = json.loads(line); return obj if isinstance(obj, dict) else None
        except Exception: return None
    def get_nested_value(obj: dict, key_path: str):
        cur = obj
        for k in key_path.split('.'):
            if not isinstance(cur, dict): return None
            cur = cur.get(k)
            if cur is None: return None
        return cur
    def match_where(line: str, cond: str, regex_engine):
        # Very small subset: key=val space separated
        obj = try_parse_json(line)
        if obj is None: return False
        for part in cond.split():
            if '=' not in part: return False
            k, v = part.split('=', 1)
            if str(get_nested_value(obj, k)) != v: return False
        return True
    def extract_fields(line: str, fields: List[str]):
        obj = try_parse_json(line)
        if obj is None: return None
        vals = []
        for f in fields:
            v = get_nested_value(obj, f)
            vals.append('' if v is None else (str(v) if not isinstance(v, str) else v))
        return vals
    def pretty_print_json(line: str, indent: int = 2) -> str:
        obj = try_parse_json(line)
        return json.dumps(obj, indent=indent) if obj else line

SAMPLE_FILES = { 'sample.jsonl': 'sample.jsonl' }
_BASE = Path(__file__).parent
_CACHE: Dict[str, List[str]] = {}

class DemoError(Exception):
    pass

# Token types for syntax highlighting in the browser
# We keep this simple: punctuation, key, string, number, match, value

def _json_line_to_tokens(line: str, pattern: Optional[str]) -> List[Dict[str,str]]:
    """
    Improved JSON tokenizer for web demo.
    - Emits quote punctuation separately (prevents doubled quotes)
    - Splits tokens on regex matches, assigning 'match' token type
    - Highlights value of --highlight key via 'errorHighlight'
    """
    tokens: List[Dict[str,str]] = []
    obj = try_parse_json(line)
    raw = line.rstrip('\n')
    if obj is None:
        return [{'t':'text','v':raw}]
    i = 0
    in_string = False
    esc = False
    buf: List[str] = []
    is_key_ctx = True
    stack: List[str] = []
    def flush_string(is_key: bool):
        if not buf: return
        s = ''.join(buf)
        tokens.append({'t':'key' if is_key else 'string','v':s})
        buf.clear()
    while i < len(raw):
        ch = raw[i]
        if esc:
            buf.append(ch); esc=False; i+=1; continue
        if ch == '\\' and in_string:
            buf.append(ch); esc=True; i+=1; continue
        if ch == '"':
            if in_string:
                in_string=False
                flush_string(is_key_ctx and (stack and stack[-1]=='O'))
            else:
                in_string=True; buf=[]
            tokens.append({'t':'punctuation','v':'"'}); i+=1; continue
        if in_string:
            buf.append(ch); i+=1; continue
        if ch in '{[:]},':
            tokens.append({'t':'punctuation','v':ch})
            if ch == '{': stack.append('O'); is_key_ctx=True
            elif ch == '[': stack.append('A')
            elif ch == '}': stack.pop() if stack else None; is_key_ctx=False
            elif ch == ']': stack.pop() if stack else None; is_key_ctx=False
            elif ch == ':': is_key_ctx=False
            elif ch == ',' and stack and stack[-1]=='O': is_key_ctx=True
            i+=1; continue
        if ch in ' \t': tokens.append({'t':'text','v':ch}); i+=1; continue
        j=i
        while j < len(raw) and raw[j] not in ' \t{},[]': j+=1
        lit = raw[i:j]
        tokens.append({'t':'number' if lit.replace('.','',1).isdigit() else 'value','v':lit})
        i=j
    # Regex splitting
    if pattern:
        try:
            r = re.compile(pattern)
            new_tokens: List[Dict[str,str]] = []
            for t in tokens:
                if t['t'] in ('string','value','number','key'):
                    text = t['v']
                    last=0; any_match=False
                    for m in r.finditer(text):
                        any_match=True
                        if m.start()>last: new_tokens.append({'t':t['t'],'v':text[last:m.start()]})
                        new_tokens.append({'t':'match','v':text[m.start():m.end()]})
                        last=m.end()
                    if any_match and last < len(text):
                        new_tokens.append({'t':t['t'],'v':text[last:]})
                    if not any_match:
                        new_tokens.append(t)
                else:
                    new_tokens.append(t)
            tokens = new_tokens
        except re.error:
            pass
    return tokens

def _load_file(name: str) -> List[str]:
    if name not in SAMPLE_FILES:
        raise DemoError(f"unsupported file: {name}")
    if name in _CACHE: return _CACHE[name]
    path = _BASE / SAMPLE_FILES[name]
    if not path.exists():
        raise DemoError(f"missing sample file: {name}")
    lines = path.read_text().splitlines()
    _CACHE[name] = lines
    return lines

# Arg parsing (very small subset)

def parse_argv(argv: List[str]) -> Dict[str,Any]:
    out: Dict[str,Any] = { 'pattern': None, 'file': None }
    i=0
    while i < len(argv):
        a = argv[i]
        if a == '-E':
            i+=1; out['pattern'] = argv[i] if i < len(argv) else ''
        elif a == '-i':
            out['ignore_case'] = True
        elif a == '--key':
            i+=1; out['key'] = argv[i] if i < len(argv) else ''
        elif a == '--where':
            i+=1; out['where'] = argv[i] if i < len(argv) else ''
        elif a == '--extract':
            i+=1; out['extract'] = [p.strip() for p in (argv[i] if i < len(argv) else '').split(',') if p.strip()]
        elif a == '--table':
            out['table'] = True
        elif a == '--pretty':
            out['pretty'] = True
        elif a.startswith('-'):
            raise DemoError(f"unrecognized option '{a}'")
        else:
            out['file'] = a
        i+=1
    if not out.get('file'):
        raise DemoError('no file specified')
    return out


def run(argv: List[str]) -> Dict[str,Any]:
    # argv includes leading 'jgrep'
    try:
        spec = parse_argv(argv[1:])
    except DemoError as e:
        return { 'type':'error', 'error': f'jgrep: error: {e}' }
    pattern = spec.get('pattern') or ''
    if pattern and spec.get('ignore_case') and not pattern.startswith('(?i)'):
        pattern = '(?i)'+pattern
    key = spec.get('key')
    where = spec.get('where')
    extract = spec.get('extract')
    want_table = spec.get('table')
    want_pretty = spec.get('pretty')
    # json-out removed; keep only lines/tokens/table/pretty outputs
    lines = _load_file(spec['file'])

    matched: List[str] = []
    rows: List[List[str]] = []
    # json_objs removed with json output mode
    tokens_lines: List[List[Dict[str,str]]] = []

    for line in lines:
        ok = True
        if pattern and not _regex_match(line, pattern):
            ok = False
        if ok and key:
            obj = try_parse_json(line)
            if obj is None:
                ok = False
            else:
                val = get_nested_value(obj, key)
                if val is None or not _regex_match(str(val), pattern if pattern else ''):
                    # if pattern provided, use it; else treat key existence as pass
                    if pattern:
                        ok = False
        if ok and where:
            if not match_where(line, where, _regex_match):
                ok = False
        if not ok:
            continue
        matched.append(line)
        if extract:
            vals = extract_fields(line, extract)
            if vals is not None:
                rows.append(vals)
        if not want_table and not want_pretty:
            tokens_lines.append(_json_line_to_tokens(line, pattern))

    # json-out removed
    if want_table and extract:
        return { 'type':'result', 'format':'table', 'header': extract, 'rows': rows }
    if want_pretty:
        pretty_blocks = [pretty_print_json(l) for l in matched]
        return { 'type':'result', 'format':'pretty', 'blocks': pretty_blocks }
    if tokens_lines:
        return { 'type':'result', 'format':'tokens', 'lines': tokens_lines }
    return { 'type':'result', 'format':'lines', 'lines': matched }

# Entry used by worker

def run_demo(argv: List[str]) -> Dict[str,Any]:
    try:
        return run(argv)
    except DemoError as e:
        return { 'type':'error', 'error': f'jgrep: error: {e}' }
    except Exception as e:
        return { 'type':'error', 'error': f'jgrep: error: unexpected: {e}' }
