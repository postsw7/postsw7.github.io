// jgrep web demo worker (Pyodide) with instrumentation & multi-CDN fallback
// Posts progress messages so the main thread can debug slow loads.

let pyodideReady = null;
let py = null;
const PY_VERSION = '0.24.1';
const CDN_BASES = [
  `https://cdn.jsdelivr.net/pyodide/v${PY_VERSION}/full/`,
  `https://fastly.jsdelivr.net/pyodide/v${PY_VERSION}/full/`,
  `https://unpkg.com/pyodide@${PY_VERSION}/full/`
];

function post(stage, detail) {
  try { self.postMessage({ type: 'progress', stage, detail, ts: Date.now() }) } catch (_) { /* ignore */ }
}

async function attemptLoad(base) {
  post('attempt', base);
  try {
    importScripts(base + 'pyodide.js');
  } catch (e) {
    post('importScripts_failed', String(e));
    throw e;
  }
  post('script_loaded', base);
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    post('load_timeout', base);
  }, 12000);
  try {
    const pyodide = await self.loadPyodide({ indexURL: base });
    clearTimeout(timeout);
    post('pyodide_loaded', base);
    // Minimal imports only
    await pyodide.runPythonAsync('import sys, json');
    post('python_ready', pyodide.runPython('sys.version'));
    // Load engine + sample files
    const engineCode = await (await fetch('engine_min.py')).text();
    pyodide.FS.writeFile('engine_min.py', engineCode);
    const sampleData = await (await fetch('sample.jsonl')).text();
    pyodide.FS.writeFile('sample.jsonl', sampleData);
    await pyodide.runPythonAsync('import engine_min');
    post('engine_imported', 'ok');
    return pyodide;
  } catch (e) {
    clearTimeout(timeout);
    post('attempt_failed', { base, error: String(e) });
    throw e;
  }
}

async function loadPyodideAndPackages() {
  if (pyodideReady) return pyodideReady;
  pyodideReady = (async () => {
    let lastError = null;
    for (const base of CDN_BASES) {
      try {
        py = await attemptLoad(base);
        post('load_success', base);
        return py;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error('All CDN bases failed');
  })();
  return pyodideReady;
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  if (msg.type === 'run') {
    try {
      await loadPyodideAndPackages();
      const argv = msg.argv;
      const code = `import json, engine_min; json.dumps(engine_min.run_demo(${JSON.stringify(argv)}))`;
      const raw = await py.runPythonAsync(code);
      const result = JSON.parse(raw);
      if (result.type === 'error') {
        self.postMessage({ type:'error', id: msg.id, error: result.error });
      } else {
        self.postMessage({ type:'result', id: msg.id, ...result });
      }
    } catch (e) {
      self.postMessage({ type:'error', id: msg.id, error: 'jgrep: error: runtime failure: ' + (e && e.message || e) });
    }
  }
};

// Kick off load lazily but also notify when ready
loadPyodideAndPackages().then(() => {
  self.postMessage({ type:'ready', pyVersion: py.runPython('import sys; sys.version') });
}).catch(e => {
  self.postMessage({ type:'error', id: 'init', error: 'init failed: ' + (e && e.message || e) });
});
