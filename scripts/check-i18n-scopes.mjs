#!/usr/bin/env node
/**
 * Checks that every page sends the translation namespaces its client
 * components use (F094). The locale layout only sends SHELL_NAMESPACES; each
 * route adds its own through PAGE_NAMESPACES (src/i18n/clientMessages.ts),
 * and nested routes inherit their parents' (e.g. /courses/[id] gets /courses').
 *
 * It follows the imports of each page (static and `import()`), marks a file as
 * client code when it has "use client" or is imported from client code, and
 * collects the `useTranslations("ns...")` namespaces of those files.
 *
 * Usage: node scripts/check-i18n-scopes.mjs [--print]
 *   --print  prints the namespaces each route needs (to update the map)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app", "[locale]");
const EXTS = [".tsx", ".ts", "/index.tsx", "/index.ts"];

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTS) if (fs.existsSync(base + ext)) return base + ext;
  return null;
}

const cache = new Map();
function parse(file) {
  if (cache.has(file)) return cache.get(file);
  const src = fs.readFileSync(file, "utf8");
  const isClient = /^\s*["']use client["']/.test(src);
  const imports = [];
  for (const m of src.matchAll(/(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
    const target = resolveImport(file, m[1] ?? m[2]);
    if (target) imports.push(target);
  }
  const namespaces = new Set();
  for (const m of src.matchAll(/useTranslations\(\s*["']([^"']*)["']\s*\)/g)) {
    namespaces.add(m[1].split(".")[0]);
  }
  if (/useTranslations\(\s*\)/.test(src)) namespaces.add("*");
  const info = { isClient, imports, namespaces };
  cache.set(file, info);
  return info;
}

/** Namespaces used by client code reachable from `entry`. */
function clientNamespaces(entry) {
  const out = new Set();
  const seen = new Set();
  const stack = [[entry, false]];
  while (stack.length) {
    const [file, parentClient] = stack.pop();
    const key = `${file}|${parentClient}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const info = parse(file);
    const inClient = parentClient || info.isClient;
    if (inClient) info.namespaces.forEach((ns) => out.add(ns));
    for (const target of info.imports) stack.push([target, inClient]);
  }
  return out;
}

function readScopes() {
  const src = fs.readFileSync(path.join(SRC, "i18n", "clientMessages.ts"), "utf8");
  const shell = new Set([...src.match(/SHELL_NAMESPACES = \[([^\]]*)\]/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
  const pages = {};
  const block = src.match(/PAGE_NAMESPACES[^=]*=\s*\{([\s\S]*?)\n\};/)[1];
  for (const m of block.matchAll(/"([^"]+)":\s*\[([^\]]*)\]/g)) {
    pages[m[1]] = new Set([...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  }
  return { shell, pages };
}

function routeOf(pageFile) {
  const rel = path.relative(APP, path.dirname(pageFile)).split(path.sep).join("/");
  return "/" + rel.replace(/^$/, "");
}

const pageFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name === "page.tsx") pageFiles.push(p);
  }
})(APP);

const layoutNs = new Set();
for (const f of ["layout.tsx", "error.tsx", "not-found.tsx", "loading.tsx"]) {
  const p = path.join(APP, f);
  if (fs.existsSync(p)) clientNamespaces(p).forEach((ns) => layoutNs.add(ns));
}

const print = process.argv.includes("--print");
if (print) console.log(`layout: ${[...layoutNs].sort().join(", ")}`);

const { shell, pages } = fs.existsSync(path.join(SRC, "i18n", "clientMessages.ts"))
  ? readScopes()
  : { shell: new Set(), pages: {} };

let problems = 0;
const known = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "messages", "es.json"), "utf8"))));
for (const ns of [...shell, ...Object.values(pages).flatMap((set) => [...set])]) {
  if (!known.has(ns)) {
    problems++;
    console.error(`"${ns}" is declared in clientMessages.ts but is not a namespace of messages/es.json`);
  }
}
for (const ns of layoutNs) {
  if (!shell.has(ns)) {
    problems++;
    console.error(`layout uses "${ns}" but it is not in SHELL_NAMESPACES`);
  }
}
for (const file of pageFiles.sort()) {
  const route = routeOf(file);
  const needed = [...clientNamespaces(file)].filter((ns) => !shell.has(ns)).sort();
  if (print) console.log(`"${route}": [${needed.map((n) => `"${n}"`).join(", ")}],`);
  // A route's layout adds its namespaces on top of every parent route's.
  const declared = new Set();
  const parts = route.split("/").filter(Boolean);
  for (let i = 1; i <= parts.length; i++) {
    const prefix = "/" + parts.slice(0, i).join("/");
    (pages[prefix] ?? []).forEach((ns) => declared.add(ns));
  }
  for (const ns of needed) {
    if (!declared.has(ns)) {
      problems++;
      console.error(`${route} uses "${ns}" but neither SHELL_NAMESPACES nor PAGE_NAMESPACES for it or a parent route include it`);
    }
  }
}
if (!print) {
  if (problems) process.exit(1);
  console.log(`i18n scopes OK (${pageFiles.length} pages)`);
}
