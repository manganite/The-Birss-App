/**
 * Codegen: emit `src/data/table7Data.ts` from `birss-tables/table-7.md`.
 *
 * Faithfully transcribes the 58 black-white (Type III) rows of Table 7 -- system, the magnetic
 * point-group symbol (column 2), and the two associated classical groups A/B (columns 3-4) --
 * together with each symbol's printed bracket flag (a parenthesized symbol denotes the rotated /
 * alternate-axis reference setting; see the header notes of table-7.md). The eight tensor-letter
 * cells are deliberately NOT stored: the runtime derives them via the cross-formula from A/B and
 * TABLE_4A_CLASS_LETTERS (Table 4a is the single source for the letters), and the Part-2 guard
 * verifies the printed cells equal that derivation.
 *
 * Node ESM, no dependencies. Deterministic and idempotent: two runs produce identical bytes.
 * Run via `npm run table7data`.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TABLE7_PATH = path.resolve(__dirname, '../table-7.md');
const OUT_PATH = path.resolve(__dirname, '../../src/data/table7Data.ts');

// App-key mapping for the barless-cubic magnetic symbols (kept in lockstep with the KEYMAP in
// src/services/table7RankThree.audit.test.ts). All other column-2 symbols are already app keys.
const KEYMAP = { "m'3": "m'-3'", "m3m'": "m-3m'", "m'3m'": "m'-3'm'", "m'3m": "m'-3'm" };
const strip = (s) => ({ sym: s.replace(/[()]/g, ''), br: s.includes('(') });

function parseRows() {
  const rows = [];
  for (const line of readFileSync(TABLE7_PATH, 'utf8').split('\n')) {
    if (!line.startsWith('|')) continue;
    const f = line.split('|').map((s) => s.trim());
    // Skip separators, the header row, and the 32 classical rows (A column printed '-').
    if (f.length < 14 || f[2].startsWith('--') || /Magnetic point group/.test(f[2]) || f[3] === '-') continue;
    const M = strip(f[2]), A = strip(f[3]), B = strip(f[4]);
    rows.push({
      key: KEYMAP[M.sym] ?? M.sym,
      system: f[1],
      m: M.sym, mBracketed: M.br,
      a: A.sym, aBracketed: A.br,
      b: B.sym, bBracketed: B.br,
    });
  }
  return rows;
}

const rows = parseRows();
if (rows.length !== 58) {
  console.error(`generate_table7_data: expected 58 black-white rows, parsed ${rows.length}`);
  process.exit(1);
}

const bool = (b) => (b ? 'true' : 'false');
const entry = (r) =>
  `  ${JSON.stringify(r.key)}: { system: ${JSON.stringify(r.system)}, ` +
  `m: ${JSON.stringify(r.m)}, mBracketed: ${bool(r.mBracketed)}, ` +
  `a: ${JSON.stringify(r.a)}, aBracketed: ${bool(r.aBracketed)}, ` +
  `b: ${JSON.stringify(r.b)}, bBracketed: ${bool(r.bBracketed)} },`;

const out = `/**
 * GENERATED FILE -- DO NOT EDIT BY HAND.
 * Regenerate via \`npm run table7data\` (birss-tables/tools/generate_table7_data.mjs).
 * Source of record: birss-tables/table-7.md (the 58 black-white / Type III rows).
 *
 * Faithful transcription of Table 7's column 2 (magnetic point group) and columns 3-4 (associated
 * classical groups A/B), each with its printed bracket flag (a parenthesized symbol denotes the
 * rotated / alternate-axis reference setting). Brackets are stripped from the stored symbols; the
 * \`*Bracketed\` flags carry the parenthesization. The tensor-letter cells (5-12) are intentionally
 * NOT stored -- the runtime re-derives them from A/B via the Table-4a cross-formula.
 */

export interface Table7Row {
  system: string;
  /** magnetic group symbol as printed in column 2 (brackets stripped) */
  m: string;
  mBracketed: boolean;
  a: string; // associated classical group A, brackets stripped
  aBracketed: boolean;
  b: string; // associated classical group B, brackets stripped
  bBracketed: boolean;
}

/** Keyed by APP KEY (barless-cubic symbols remapped per the audit KEYMAP). 58 entries. */
export const TABLE7_BW_ROWS: Record<string, Table7Row> = {
${rows.map(entry).join('\n')}
};
`;

writeFileSync(OUT_PATH, out);
console.log(`generate_table7_data: wrote ${rows.length} rows to ${path.relative(process.cwd(), OUT_PATH)}`);
