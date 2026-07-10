/**
 * GENERATED FILE -- DO NOT EDIT BY HAND.
 * Regenerate via `npm run table7data` (birss-tables/tools/generate_table7_data.mjs).
 * Source of record: birss-tables/table-7.md (the 58 black-white / Type III rows).
 *
 * Faithful transcription of Table 7's column 2 (magnetic point group) and columns 3-4 (associated
 * classical groups A/B), each with its printed bracket flag (a parenthesized symbol denotes the
 * rotated / alternate-axis reference setting). Brackets are stripped from the stored symbols; the
 * `*Bracketed` flags carry the parenthesization. The tensor-letter cells (5-12) are intentionally
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
  "-1'": { system: "Triclinic", m: "-1'", mBracketed: false, a: "1", aBracketed: false, b: "-1", bBracketed: false },
  "2'": { system: "Monoclinic", m: "2'", mBracketed: false, a: "m", aBracketed: false, b: "m", bBracketed: false },
  "m'": { system: "Monoclinic", m: "m'", mBracketed: false, a: "2", aBracketed: false, b: "m", bBracketed: false },
  "2'/m'": { system: "Monoclinic", m: "2'/m'", mBracketed: false, a: "2/m", aBracketed: false, b: "m", bBracketed: false },
  "2/m'": { system: "Monoclinic", m: "2/m'", mBracketed: false, a: "2", aBracketed: false, b: "2/m", bBracketed: false },
  "2'/m": { system: "Monoclinic", m: "2'/m", mBracketed: false, a: "m", aBracketed: false, b: "2/m", bBracketed: false },
  "2'2'2": { system: "Orthorhombic", m: "2'2'2", mBracketed: false, a: "mm2", aBracketed: false, b: "mm2", bBracketed: false },
  "m'm'2": { system: "Orthorhombic", m: "m'm'2", mBracketed: false, a: "222", aBracketed: false, b: "mm2", bBracketed: false },
  "2'm'm": { system: "Orthorhombic", m: "2'm'm", mBracketed: true, a: "m2m", aBracketed: true, b: "mm2", bBracketed: false },
  "m'm'm": { system: "Orthorhombic", m: "m'm'm", mBracketed: false, a: "mmm", aBracketed: false, b: "mm2", bBracketed: false },
  "m'm'm'": { system: "Orthorhombic", m: "m'm'm'", mBracketed: false, a: "222", aBracketed: false, b: "mmm", bBracketed: false },
  "mmm'": { system: "Orthorhombic", m: "mmm'", mBracketed: false, a: "mm2", aBracketed: false, b: "mmm", bBracketed: false },
  "4'": { system: "Tetragonal", m: "4'", mBracketed: false, a: "-4", aBracketed: false, b: "-4", bBracketed: false },
  "-4'": { system: "Tetragonal", m: "-4'", mBracketed: false, a: "4", aBracketed: false, b: "-4", bBracketed: false },
  "4'/m": { system: "Tetragonal", m: "4'/m", mBracketed: false, a: "4/m", aBracketed: false, b: "-4", bBracketed: false },
  "4/m'": { system: "Tetragonal", m: "4/m'", mBracketed: false, a: "4", aBracketed: false, b: "4/m", bBracketed: false },
  "4'/m'": { system: "Tetragonal", m: "4'/m'", mBracketed: false, a: "-4", aBracketed: false, b: "4/m", bBracketed: false },
  "4'22'": { system: "Tetragonal", m: "4'22'", mBracketed: false, a: "-42m", aBracketed: false, b: "-42m", bBracketed: false },
  "42'2'": { system: "Tetragonal", m: "42'2'", mBracketed: false, a: "4mm", aBracketed: false, b: "4mm", bBracketed: false },
  "4'mm'": { system: "Tetragonal", m: "4'mm'", mBracketed: false, a: "-4m2", aBracketed: true, b: "-42m", bBracketed: false },
  "4m'm'": { system: "Tetragonal", m: "4m'm'", mBracketed: false, a: "422", aBracketed: false, b: "4mm", bBracketed: false },
  "-4'2m'": { system: "Tetragonal", m: "-4'2m'", mBracketed: false, a: "422", aBracketed: false, b: "-42m", bBracketed: false },
  "-4'm2'": { system: "Tetragonal", m: "-4'm2'", mBracketed: true, a: "4mm", aBracketed: false, b: "-42m", bBracketed: false },
  "-42'm'": { system: "Tetragonal", m: "-42'm'", mBracketed: false, a: "-42m", aBracketed: true, b: "4mm", bBracketed: false },
  "4'/mmm'": { system: "Tetragonal", m: "4'/mmm'", mBracketed: false, a: "4/mmm", aBracketed: false, b: "-42m", bBracketed: false },
  "4/mm'm'": { system: "Tetragonal", m: "4/mm'm'", mBracketed: false, a: "4/mmm", aBracketed: false, b: "4mm", bBracketed: false },
  "4/m'm'm'": { system: "Tetragonal", m: "4/m'm'm'", mBracketed: false, a: "422", aBracketed: false, b: "4/mmm", bBracketed: false },
  "4/m'mm": { system: "Tetragonal", m: "4/m'mm", mBracketed: false, a: "4mm", aBracketed: false, b: "4/mmm", bBracketed: false },
  "4'/m'm'm": { system: "Tetragonal", m: "4'/m'm'm", mBracketed: false, a: "-42m", aBracketed: false, b: "4/mmm", bBracketed: false },
  "-3'": { system: "Trigonal", m: "-3'", mBracketed: false, a: "3", aBracketed: false, b: "-3", bBracketed: false },
  "32'": { system: "Trigonal", m: "32'", mBracketed: false, a: "3m", aBracketed: false, b: "3m", bBracketed: false },
  "3m'": { system: "Trigonal", m: "3m'", mBracketed: false, a: "32", aBracketed: false, b: "3m", bBracketed: false },
  "-3m'": { system: "Trigonal", m: "-3m'", mBracketed: false, a: "-3m", aBracketed: false, b: "3m", bBracketed: false },
  "-3'm'": { system: "Trigonal", m: "-3'm'", mBracketed: false, a: "32", aBracketed: false, b: "-3m", bBracketed: false },
  "-3'm": { system: "Trigonal", m: "-3'm", mBracketed: false, a: "3m", aBracketed: false, b: "-3m", bBracketed: false },
  "6'": { system: "Hexagonal", m: "6'", mBracketed: false, a: "-6", aBracketed: false, b: "-6", bBracketed: false },
  "-6'": { system: "Hexagonal", m: "-6'", mBracketed: false, a: "6", aBracketed: false, b: "-6", bBracketed: false },
  "6'/m'": { system: "Hexagonal", m: "6'/m'", mBracketed: false, a: "6/m", aBracketed: false, b: "-6", bBracketed: false },
  "6/m'": { system: "Hexagonal", m: "6/m'", mBracketed: false, a: "6", aBracketed: false, b: "6/m", bBracketed: false },
  "6'/m": { system: "Hexagonal", m: "6'/m", mBracketed: false, a: "-6", aBracketed: false, b: "6/m", bBracketed: false },
  "6'22'": { system: "Hexagonal", m: "6'22'", mBracketed: false, a: "-62m", aBracketed: true, b: "-62m", bBracketed: true },
  "62'2'": { system: "Hexagonal", m: "62'2'", mBracketed: false, a: "6mm", aBracketed: false, b: "6mm", bBracketed: false },
  "6'mm'": { system: "Hexagonal", m: "6'mm'", mBracketed: false, a: "-6m2", aBracketed: false, b: "-62m", bBracketed: true },
  "6m'm'": { system: "Hexagonal", m: "6m'm'", mBracketed: false, a: "622", aBracketed: false, b: "6mm", bBracketed: false },
  "-6'2m'": { system: "Hexagonal", m: "-6'2m'", mBracketed: true, a: "622", aBracketed: false, b: "-62m", bBracketed: true },
  "-6'm2'": { system: "Hexagonal", m: "-6'm2'", mBracketed: false, a: "6mm", aBracketed: false, b: "-62m", bBracketed: true },
  "-6m'2'": { system: "Hexagonal", m: "-6m'2'", mBracketed: false, a: "-6m2", aBracketed: false, b: "6mm", bBracketed: false },
  "6'/m'mm'": { system: "Hexagonal", m: "6'/m'mm'", mBracketed: false, a: "6/mmm", aBracketed: false, b: "-62m", bBracketed: true },
  "6/mm'm'": { system: "Hexagonal", m: "6/mm'm'", mBracketed: false, a: "6/mmm", aBracketed: false, b: "6mm", bBracketed: false },
  "6/m'm'm'": { system: "Hexagonal", m: "6/m'm'm'", mBracketed: false, a: "622", aBracketed: false, b: "6/mmm", bBracketed: false },
  "6/m'mm": { system: "Hexagonal", m: "6/m'mm", mBracketed: false, a: "6mm", aBracketed: false, b: "6/mmm", bBracketed: false },
  "6'/mm'm": { system: "Hexagonal", m: "6'/mm'm", mBracketed: false, a: "-62m", aBracketed: true, b: "6/mmm", bBracketed: false },
  "m'-3'": { system: "Cubic", m: "m'3", mBracketed: false, a: "23", aBracketed: false, b: "m3", bBracketed: false },
  "4'32'": { system: "Cubic", m: "4'32'", mBracketed: false, a: "-43m", aBracketed: false, b: "-43m", bBracketed: false },
  "-4'3m'": { system: "Cubic", m: "-4'3m'", mBracketed: false, a: "432", aBracketed: false, b: "-43m", bBracketed: false },
  "m-3m'": { system: "Cubic", m: "m3m'", mBracketed: false, a: "m3m", aBracketed: false, b: "-43m", bBracketed: false },
  "m'-3'm'": { system: "Cubic", m: "m'3m'", mBracketed: false, a: "432", aBracketed: false, b: "m3m", bBracketed: false },
  "m'-3'm": { system: "Cubic", m: "m'3m", mBracketed: false, a: "-43m", aBracketed: false, b: "m3m", bBracketed: false },
};
