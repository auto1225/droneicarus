// Bulk JSX → ES Module migration for Drone Icarus.
// Reads source files at repo root, writes ES-module versions to src/.
//
// Usage: node scripts/migrate-to-esm.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');

// Names exported by each module we control.
const DATA_EXPORTS = [
  'CATEGORIES', 'CAT_ICONS', 'LOCATIONS', 'VIDEOS', 'TRENDING',
  'CREATORS', 'thumbGradient', 'CURRENT_USER', 'ORDERS',
  'COLLECTIONS', 'PAYOUTS', 'REVIEWS',
];
const COMPONENTS_EXPORTS = [
  'Ic', 'formatViews', 'formatDays',
  'Header', 'CategoryChips', 'VideoCard', 'Footer', 'SearchDropdown',
];
const TOAST_EXPORTS = ['toast', 'ToastStack'];
const COMMENTS_EXPORTS = ['CommentsSection'];

// Globals that stay as window.X (CDN / native)
const KEEP_WINDOW = new Set([
  'L', 'THREE', 'Globe', 'parent', 'location', 'scrollTo',
  'addEventListener', 'removeEventListener', 'innerWidth', 'innerHeight',
  'history', 'navigator', 'document',
]);

function findUsedSymbols(code, pool) {
  const used = new Set();
  for (const name of pool) {
    // Match `window.Name` or bare `Name` as an identifier
    const reWindow = new RegExp(`\\bwindow\\.${name}\\b`, 'g');
    const reBare = new RegExp(`(?<![\\w.$])${name}(?![\\w$])`, 'g');
    if (reWindow.test(code) || reBare.test(code)) used.add(name);
  }
  return [...used];
}

function buildImports({ forPath, code, useData, useComp, useToast, useComments }) {
  const prefix = forPath.startsWith('pages/') ? '..' : '.';
  const lines = [];
  lines.push(`import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';`);
  if (useData.length) {
    lines.push(`import { ${useData.join(', ')} } from '${prefix}/data';`);
  }
  if (useComp.length) {
    lines.push(`import { ${useComp.join(', ')} } from '${prefix}/components';`);
  }
  if (useToast.length) {
    lines.push(`import { ${useToast.join(', ')} } from '${prefix}/toast';`);
  }
  if (useComments.length) {
    lines.push(`import { ${useComments.join(', ')} } from '${prefix}/comments';`);
  }
  return lines.join('\n');
}

function transform(code, relPath) {
  // 1. Strip the `const { useState, ... } = React;` line (any alias form).
  //    Common patterns:
  //      const { useState, useEffect } = React;
  //      const { useState: hUseState, useEffect: hUseEffect } = React;
  //      const { useState: tUseState, useEffect: tUseEffect } = React;
  // We detect the aliases and emit `const hUseState = useState;` lines
  // so existing references continue to work.
  let aliasEmit = '';
  code = code.replace(
    /const\s*\{\s*([^}]+?)\s*\}\s*=\s*React\s*;?/g,
    (m, inner) => {
      // Parse "useState, useEffect: hUseEffect, useRef"
      inner.split(',').map(s => s.trim()).filter(Boolean).forEach(item => {
        const match = item.match(/^(\w+)(?:\s*:\s*(\w+))?$/);
        if (!match) return;
        const [, realName, alias] = match;
        if (alias && alias !== realName) {
          aliasEmit += `const ${alias} = ${realName};\n`;
        }
      });
      return ''; // drop the destructure
    }
  );

  // 2. Remove `Object.assign(window, { ... });` (multi-line safe).
  code = code.replace(/Object\.assign\(\s*window\s*,\s*\{[^}]*\}\s*\)\s*;?/g, (m) => {
    // Extract names to add `export` before each top-level declaration later
    return `/* __OBJECT_ASSIGN_WINDOW_REMOVED__: ${m.replace(/\s+/g, ' ')} */`;
  });

  // 3. Find all `window.X` usages, and decide:
  //    - if X is an exported symbol → replace with bare X (and add import)
  //    - if X in KEEP_WINDOW → keep as-is
  //    - if X === 'toast' (function call) → replace with toast
  const winUses = new Set();
  code = code.replace(/\bwindow\.(\w+)/g, (m, name) => {
    if (KEEP_WINDOW.has(name)) return m;
    winUses.add(name);
    return name;
  });

  // 4. Figure out which symbols from our modules are actually used.
  const useData = DATA_EXPORTS.filter(n => winUses.has(n) || new RegExp(`(?<![\\w.$])${n}(?![\\w$])`).test(code));
  const useComp = COMPONENTS_EXPORTS.filter(n => winUses.has(n) || new RegExp(`(?<![\\w.$])${n}(?![\\w$])`).test(code));
  const useToast = TOAST_EXPORTS.filter(n => winUses.has(n) || new RegExp(`(?<![\\w.$])${n}(?![\\w$])`).test(code));
  const useComments = COMMENTS_EXPORTS.filter(n => winUses.has(n) || new RegExp(`(?<![\\w.$])${n}(?![\\w$])`).test(code));

  // But don't self-import — if this file IS components/toast/comments, skip its own.
  const self = path.basename(relPath, '.jsx');
  if (self === 'components') { useComp.length = 0; }
  if (self === 'toast') { useToast.length = 0; }
  if (self === 'comments') { useComments.length = 0; }

  // 5. Extract the names that were in `Object.assign(window, { A, B, C });`
  //    and add `export` before each `function NAME(` or `const NAME =` / `let NAME =` declaration.
  const exportNames = new Set();
  const marker = code.match(/__OBJECT_ASSIGN_WINDOW_REMOVED__: Object\.assign\(\s*window\s*,\s*\{([^}]*)\}/);
  if (marker) {
    marker[1].split(',').map(s => s.trim()).filter(Boolean).forEach(item => {
      const name = item.split(':')[0].trim();
      if (name) exportNames.add(name);
    });
  }
  // Also, any page file: default-export the *Page component (detect `function XxxPage`).
  exportNames.forEach(name => {
    // Add `export` before `function NAME(` or `const NAME =` at line start
    const reFn = new RegExp(`(^|\\n)(function\\s+${name}\\s*\\()`, 'g');
    const reC  = new RegExp(`(^|\\n)((?:const|let|var)\\s+${name}\\s*=)`, 'g');
    code = code.replace(reFn, (m, p1, p2) => `${p1}export ${p2}`);
    code = code.replace(reC,  (m, p1, p2) => `${p1}export ${p2}`);
  });

  // Remove the marker line itself.
  code = code.replace(/\/\*\s*__OBJECT_ASSIGN_WINDOW_REMOVED__:[^*]*\*\//g, '');

  // 6. Build the import header and prepend.
  const imports = buildImports({ forPath: relPath, code, useData, useComp, useToast, useComments });
  // Strip any leading "// xyz.jsx — ..." comment line(s), preserve as-is.
  const headerComment = code.match(/^(\/\/[^\n]*\n)+/);
  let leading = '';
  let rest = code;
  if (headerComment) {
    leading = headerComment[0];
    rest = code.slice(leading.length);
  }

  let out = leading + imports + '\n' + (aliasEmit ? aliasEmit + '\n' : '') + rest;

  // Clean up extra blank lines around our injection.
  out = out.replace(/\n{3,}/g, '\n\n');

  return { code: out, exportNames: [...exportNames] };
}

function migrate(relPath) {
  const inPath = path.join(ROOT, relPath);
  const outPath = path.join(ROOT, 'src', relPath);
  const src = fs.readFileSync(inPath, 'utf8');
  const { code, exportNames } = transform(src, relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, code);
  return exportNames;
}

function main() {
  const targets = [];
  // Root-level modules (skip data.jsx — already manually migrated; skip toast — already migrated)
  for (const f of ['components.jsx', 'comments.jsx']) {
    if (fs.existsSync(path.join(ROOT, f))) targets.push(f);
  }
  // All pages except home.v1.jsx (legacy)
  const pagesDir = path.join(ROOT, 'pages');
  if (fs.existsSync(pagesDir)) {
    for (const f of fs.readdirSync(pagesDir)) {
      if (f.endsWith('.jsx') && f !== 'home.v1.jsx') {
        targets.push(`pages/${f}`);
      }
    }
  }

  const report = {};
  for (const rel of targets) {
    try {
      report[rel] = migrate(rel);
      console.log(`✓ ${rel} → src/${rel} [${report[rel].join(', ') || '(no exports detected)'}]`);
    } catch (e) {
      console.error(`✗ ${rel}: ${e.message}`);
    }
  }
  console.log(`\nMigrated ${Object.keys(report).length} files.`);
}

main();
