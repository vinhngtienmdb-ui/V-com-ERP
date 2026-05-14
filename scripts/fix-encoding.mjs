#!/usr/bin/env node
/**
 * Fix encoding cho source code VComm ERP:
 *   1. Strip BOM UTF-8 (cả raw EF BB BF lẫn dạng mojibake "ï»¿")
 *   2. Sửa mojibake: chuỗi UTF-8 đã bị decode bằng Windows-1252 rồi re-encode UTF-8.
 *      Cần xử lý ĐỒNG THỜI 2 loại byte:
 *        - 0x80-0x9F mà Win1252 map sang Unicode > U+00FF (vd 0x91 → U+2018)
 *        - 0x80-0x9F mà Win1252 không map (vd 0x90) → giữ làm control char U+0090
 *      Latin-1 thuần KHÔNG đủ vì không reverse được U+2018.
 *
 * Usage:
 *   node scripts/fix-encoding.mjs --dry      # In dry-run, không sửa file
 *   node scripts/fix-encoding.mjs            # Apply
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { argv, cwd } from 'node:process';

const ROOTS = ['src', 'functions/src', 'scripts'];
const EXTRA_FILES = ['index.html', 'server.ts', 'firestore.rules', 'storage.rules', 'README.md', 'security_spec.md'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json', '.md', '.rules']);
const DRY = argv.includes('--dry');
const SELF_PATH = 'scripts/fix-encoding.mjs';

// Map: Win1252 codepoints (> 0xFF) → byte (0x80-0x9F)
const WIN1252_HIGH_TO_BYTE = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
]);

// Probes build từ raw bytes để KHÔNG trigger self-match khi script đọc chính nó.
const MOJIBAKE_PROBES = [
  Buffer.from([0xc3, 0xa1, 0xc2, 0xba]).toString('utf8'),     // 'áº'
  Buffer.from([0xc3, 0xa1, 0xc2, 0xbb]).toString('utf8'),     // 'á»'
  Buffer.from([0xc3, 0x83, 0xc2, 0xa0]).toString('utf8'),     // 'Ã '
  Buffer.from([0xc3, 0x83, 0xc2, 0xa1]).toString('utf8'),     // 'Ã¡'
  Buffer.from([0xc3, 0x83, 0xc2, 0xa9]).toString('utf8'),     // 'Ã©'
  Buffer.from([0xc3, 0x83, 0xc2, 0xb3]).toString('utf8'),     // 'Ã³'
  Buffer.from([0xc3, 0x83, 0xc2, 0xba]).toString('utf8'),     // 'Ãº'
  Buffer.from([0xc3, 0x84, 0xc2, 0x91]).toString('utf8'),     // 'Ä‘'
  Buffer.from([0xc3, 0x86, 0xc2, 0xb0]).toString('utf8'),     // 'Æ°'
  Buffer.from([0xc3, 0x86, 0xc2, 0xa1]).toString('utf8'),     // 'Æ¡'
];

function hasMojibake(text) {
  return MOJIBAKE_PROBES.some((p) => text.includes(p));
}

function stripBomBytes(buf) {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return { buf: buf.slice(3), bomFound: true };
  }
  return { buf, bomFound: false };
}

function stripMojibakeBom(text) {
  if (text.length >= 3 && text.charCodeAt(0) === 0x00ef && text.charCodeAt(1) === 0x00bb && text.charCodeAt(2) === 0x00bf) {
    return { text: text.slice(3), found: true };
  }
  return { text, found: false };
}

/**
 * Reverse Win1252 mojibake: codepoint-by-codepoint, build buffer rồi decode UTF-8.
 * Trả null nếu gặp codepoint > 0xFF không thuộc Win1252 high table (= file mixed).
 */
function unmojibake(text) {
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.charCodeAt(i);
    if (cp <= 0xff) {
      bytes.push(cp);
    } else if (WIN1252_HIGH_TO_BYTE.has(cp)) {
      bytes.push(WIN1252_HIGH_TO_BYTE.get(cp));
    } else {
      // Codepoint khác > 0xFF — có thể là Vietnamese đã đúng UTF-8 mixed với mojibake.
      // Để chắc, ta bỏ qua file này.
      return null;
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

function verifyFixed(text) {
  if (hasMojibake(text)) return false;
  if (text.includes('�')) return false;
  return true;
}

function listFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'lib', 'dist', '_archive'].includes(e.name)) continue;
      listFiles(p, out);
    } else {
      const ext = e.name.includes('.') ? '.' + e.name.split('.').pop() : '';
      if (EXTS.has(ext)) out.push(p);
    }
  }
  return out;
}

function main() {
  const root = cwd();
  const candidates = [];
  for (const r of ROOTS) candidates.push(...listFiles(join(root, r)));
  for (const f of EXTRA_FILES) {
    try {
      if (statSync(join(root, f)).isFile()) candidates.push(join(root, f));
    } catch {/* skip */}
  }

  const stats = { scanned: 0, bomStripped: [], mojibakeFixed: [], skipped: [], errors: [] };

  for (const file of candidates) {
    stats.scanned++;
    const rel = relative(root, file).replaceAll(sep, '/');
    if (rel === SELF_PATH) continue;

    let raw;
    try { raw = readFileSync(file); }
    catch { continue; }

    const { buf: noBomBuf, bomFound: rawBom } = stripBomBytes(raw);
    let text = noBomBuf.toString('utf8');

    let changed = rawBom;
    let bomFound = rawBom;
    let hadMojibake = false;

    const { text: t2, found: mojBom } = stripMojibakeBom(text);
    if (mojBom) { text = t2; changed = true; bomFound = true; }

    if (hasMojibake(text)) {
      hadMojibake = true;
      const fixed = unmojibake(text);
      if (fixed === null) {
        stats.skipped.push({ file: rel, reason: 'mixed encoding (UTF-8 codepoint > 0xFF không phải Win1252)' });
        continue;
      }
      let final = fixed;
      if (final.charCodeAt(0) === 0xfeff) final = final.slice(1);
      if (verifyFixed(final)) {
        text = final;
        changed = true;
      } else {
        stats.skipped.push({ file: rel, reason: 'verify failed sau fix' });
        continue;
      }
    }

    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
      bomFound = true;
      changed = true;
    }

    if (changed) {
      if (bomFound) stats.bomStripped.push(rel);
      if (hadMojibake) stats.mojibakeFixed.push(rel);
      if (!DRY) {
        try { writeFileSync(file, text, { encoding: 'utf8' }); }
        catch (err) { stats.errors.push({ file: rel, err: String(err) }); }
      }
    }
  }

  console.log('━━━ fix-encoding ' + (DRY ? '(DRY RUN)' : '(APPLY)') + ' ━━━');
  console.log('Scanned:', stats.scanned, 'files');
  console.log('');
  console.log('BOM stripped:', stats.bomStripped.length);
  if (stats.bomStripped.length) stats.bomStripped.forEach((f) => console.log('  ✓ ' + f));
  console.log('');
  console.log('Mojibake fixed:', stats.mojibakeFixed.length);
  if (stats.mojibakeFixed.length) stats.mojibakeFixed.forEach((f) => console.log('  ✓ ' + f));
  console.log('');
  if (stats.skipped.length) {
    console.log('Skipped:', stats.skipped.length);
    stats.skipped.forEach((s) => console.log('  ⚠  ' + s.file + ' — ' + s.reason));
  }
  if (stats.errors.length) {
    console.log('Errors:', stats.errors.length);
    stats.errors.forEach((s) => console.log('  ✗ ' + s.file + ' — ' + s.err));
  }
  if (DRY) console.log('\nDRY RUN. Bỏ --dry để apply.');
}

main();
