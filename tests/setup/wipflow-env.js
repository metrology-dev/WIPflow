/**
 * Vitest global setup: loads WIPflow.html's business-logic script into the
 * Node.js global scope so unit tests can call production code directly.
 *
 * Strategy
 * --------
 * 1. Read WIPflow.html and extract the main <script> (not the data-embedding one).
 * 2. Transform every top-level `const X =` / `let X =` to `var X =` so that vm
 *    promotes them to context properties (unlike `const`, `var` at top level in
 *    a vm script becomes a property of the context object).
 * 3. Strip the DOMContentLoaded boot listener — we don't want App.init() to run.
 * 4. Run the transformed script inside a vm context seeded with lightweight
 *    DOM/browser API stubs (document, localStorage, indexedDB, …).
 * 5. Copy every property the script added to the context onto `globalThis` so
 *    Vitest test files can access WorkCalendar, AppState, etc. without imports.
 */

import { readFileSync } from 'fs';
import { createContext, Script } from 'vm';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath  = resolve(__dirname, '../../WIPflow.html');
const html      = readFileSync(htmlPath, 'utf8');

// ── Extract the main <script> (the one without an `id` attribute) ────────────
const scriptMatches = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const mainEntry     = scriptMatches.find(m => !m[1].includes('id='));
if (!mainEntry) throw new Error('Could not locate main <script> in WIPflow.html');
let code = mainEntry[2];

// ── Transform top-level const/let → var ──────────────────────────────────────
// `^` with the `m` flag matches the start of each line, so only declarations
// at column 0 (i.e. module-level) are transformed.  Indented inner `const`s
// (inside method bodies) are left untouched.
code = code.replace(/^(const|let) /gm, 'var ');

// ── Remove the boot listener so App.init() doesn't run during tests ──────────
code = code.replace(
  /document\.addEventListener\(['"]DOMContentLoaded['"][\s\S]*?\}\);?\s*$/m,
  ''
);

// ── Minimal browser-API stubs ─────────────────────────────────────────────────
// Only the stubs needed for module *definitions* to evaluate without throwing.
// Method bodies that touch real DOM/storage are tested via Playwright E2E tests.

const mockLocalStorage = (() => {
  const store = {};
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear:      () => { Object.keys(store).forEach(k => delete store[k]); },
  };
})();

const mockDocument = {
  addEventListener:    () => {},
  removeEventListener: () => {},
  getElementById:      () => null,
  querySelector:       () => null,
  querySelectorAll:    () => [],
  createElement:       (tag) => ({ tag, style: {}, classList: { add(){}, remove(){}, contains(){ return false; } }, addEventListener(){}, appendChild(){} }),
  body: { classList: { add(){}, remove(){}, contains(){ return false; } }, style: {} },
  documentElement: { style: {} },
};

const mockIndexedDB = {
  open: () => {
    const req = {};
    setTimeout(() => req.onerror && req.onerror({ target: { error: new Error('IDB not available in tests') } }), 0);
    return req;
  },
};

const sandbox = {
  // JS built-ins
  console, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error,
  Set, Map, WeakMap, WeakSet, Promise, JSON, Symbol, Proxy, Reflect,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
  setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
  // Browser globals used by WIPflow module definitions
  addEventListener:    () => {},
  removeEventListener: () => {},
  document:     mockDocument,
  window:       null,          // filled below
  globalThis:   null,          // filled below
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  indexedDB:    mockIndexedDB,
  location:     { href: '', pathname: '/', search: '', hash: '' },
  navigator:    { userAgent: 'node-test' },
  history:      { pushState(){}, replaceState(){} },
  performance:  { now: () => Date.now() },
  // Node.js process (safe to expose in test context)
  process,
};
sandbox.window    = sandbox;
sandbox.globalThis = sandbox;

createContext(sandbox);
new Script(code).runInContext(sandbox);

// ── Promote everything the script defined onto globalThis ────────────────────
// We copy only the keys the script added (i.e., keys not already present in
// the base sandbox).  This avoids polluting globalThis with mock stubs.
const baseKeys = new Set([
  'console', 'Math', 'Date', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'RegExp', 'Error', 'Set', 'Map', 'WeakMap', 'WeakSet', 'Promise', 'JSON',
  'Symbol', 'Proxy', 'Reflect', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'queueMicrotask',
  'addEventListener', 'removeEventListener',
  'document', 'window', 'globalThis', 'localStorage', 'sessionStorage',
  'indexedDB', 'location', 'navigator', 'history', 'performance', 'process',
]);

for (const key of Object.keys(sandbox)) {
  if (!baseKeys.has(key)) {
    globalThis[key] = sandbox[key];
  }
}
