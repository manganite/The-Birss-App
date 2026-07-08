/**
 * groupNotation.ts — supplementary Birss notation for the point-group explorer popup.
 *
 * All data here is transcribed VERBATIM from the vendored, print-verified Birss reference
 * tables; never derive it from the app's own output. Two anti-drift guard tests
 * (`groupNotation.test.ts`) re-parse the source markdown at test time and assert these maps
 * equal the parsed tables entry-for-entry, so the TypeScript can never silently drift.
 *
 * Notation: app group keys keep the inversion bar on the cubic 3 (`m-3`, `m'-3'm'`) where the
 * Birss tables print a bare `m3` — see `birss-tables/table-nomenclature.md` ("App notation
 * conventions"), which is the app's canonical notation reference and reconciles the two.
 */

/**
 * Shubnikov (Birss dot/colon) symbol for each of the 90 groups that carry independent
 * information — the 32 classical (Type I) and 58 black-and-white (Type III) groups. Keyed by
 * the app group key. Grey (Type II) groups are intentionally OMITTED: their Shubnikov symbol
 * arrives with the ITC-1.5.2.3 transcription and must not be derived here by appending a suffix.
 *
 * Source: `birss-tables/table-nomenclature.md` Table A (App key + Shubnikov columns), whose
 * Shubnikov column is transcribed from Birss Table 6 (and Table 3 for the classical groups).
 */
export const SHUBNIKOV: Record<string, string> = {
  // Triclinic
  "1": "1",
  "-1": "-2",
  "-1'": "-2'",
  // Monoclinic
  "2": "2",
  "2'": "2'",
  "m": "m",
  "m'": "m'",
  "2/m": "2:m",
  "2'/m'": "2':m'",
  "2/m'": "2:m'",
  "2'/m": "2':m",
  // Orthorhombic
  "222": "2:2",
  "2'2'2": "2:2'",
  "mm2": "2.m",
  "m'm'2": "2.m'",
  "2'm'm": "2'.m",
  "mmm": "m.2:m",
  "m'm'm": "m'.2:m",
  "m'm'm'": "m'.2:m'",
  "mmm'": "m.2:m'",
  // Tetragonal
  "4": "4",
  "4'": "4'",
  "-4": "-4",
  "-4'": "-4'",
  "4/m": "4:m",
  "4'/m": "4':m",
  "4/m'": "4:m'",
  "4'/m'": "4':m'",
  "422": "4:2",
  "4'22'": "4':2",
  "42'2'": "4:2'",
  "4mm": "4.m",
  "4'mm'": "4'.m",
  "4m'm'": "4.m'",
  "-42m": "-4.m",
  "-4'2m'": "-4'.m'",
  "-4'm2'": "-4'.m",
  "-42'm'": "-4.m'",
  "4/mmm": "m.4:m",
  "4'/mmm'": "m.4':m",
  "4/mm'm'": "m.4:m'",
  "4/m'm'm'": "m'.4:m'",
  "4/m'mm": "m'.4:m",
  "4'/m'm'm": "m'.4':m'",
  // Trigonal
  "3": "3",
  "-3": "-6",
  "-3'": "-6'",
  "32": "3:2",
  "32'": "3:2'",
  "3m": "3.m",
  "3m'": "3.m'",
  "-3m": "-6.m",
  "-3m'": "-6.m'",
  "-3'm'": "-6'.m'",
  "-3'm": "-6'.m",
  // Hexagonal
  "6": "6",
  "6'": "6'",
  "-6": "3:m",
  "-6'": "3:m'",
  "6/m": "6:m",
  "6'/m'": "6':m'",
  "6/m'": "6:m'",
  "6'/m": "6':m",
  "622": "6:2",
  "6'22'": "6':2",
  "62'2'": "6:2'",
  "6mm": "6.m",
  "6'mm'": "6'.m",
  "6m'm'": "6.m'",
  "-6m2": "m.3:m",
  "-6'2m'": "m'.3:m'",
  "-6'm2'": "m.3:m'",
  "-6m'2'": "m'.3:m",
  "6/mmm": "m.6:m",
  "6'/m'mm'": "m'.6':m'",
  "6/mm'm'": "m'.6:m",
  "6/m'm'm'": "m'.6:m'",
  "6/m'mm": "m.6:m'",
  "6'/mm'm": "m.6':m",
  // Cubic
  "23": "3/2",
  "m-3": "-6/2",
  "m'-3'": "-6'/2",
  "432": "3/4",
  "4'32'": "3/4'",
  "-43m": "3/-4",
  "-4'3m'": "3/-4'",
  "m-3m": "-6/4",
  "m-3m'": "-6/4'",
  "m'-3'm'": "-6'/4'",
  "m'-3'm": "-6'/4",
};

/**
 * Birss orientation of reference axes for each of the 32 classical symmetry classes, keyed by the
 * app classical group key. `//` denotes a parallel axis; `any` means unconstrained.
 *
 * Source: `birss-tables/table-4a.md` ("Orientation of reference axes" column). The two cubic
 * centrosymmetric rows are printed there as `m3`/`m3m`; they are keyed here under the app's
 * `m-3`/`m-3m` per the app notation convention (values are unchanged).
 */
export const REFERENCE_AXES: Record<string, string> = {
  "1": "any",
  "-1": "any",
  "2": "2//z",
  "m": "-2//z",
  "2/m": "2//z",
  "222": "2//x, 2//y",
  "mm2": "-2//x, -2//y",
  "mmm": "2//x, 2//y",
  "4": "4//z",
  "-4": "-4//z",
  "4/m": "4//z",
  "422": "4//z, 2//y",
  "4mm": "4//z, -2//y",
  "-42m": "-4//z, 2//y",
  "4/mmm": "4//z, 2//y",
  "3": "3//z",
  "-3": "-3//z",
  "32": "3//z, 2//y",
  "3m": "3//z, -2//y",
  "-3m": "-3//z, 2//y",
  "6": "6//z",
  "-6": "-3//z",
  "6/m": "6//z",
  "622": "6//z, 2//y",
  "6mm": "6//z, -2//y",
  "-6m2": "3//z, -2//y",
  "6/mmm": "6//z, 2//y",
  "23": "2//x, 2//y",
  "m-3": "2//x, 2//y",
  "432": "4//x, 4//y",
  "-43m": "-4//x, -4//y",
  "m-3m": "4//x, 4//y",
};

/** The 32 classical symmetry-class keys (also the `REFERENCE_AXES` keys). */
const CLASSICAL_CLASSES = new Set(Object.keys(REFERENCE_AXES));

/**
 * The three "bracketed" (rotated-setting) magnetic groups whose primed HM symbol is written in a
 * rotated axis frame, so plain prime-stripping yields a re-ordered string that is not the classical
 * family key. Each maps to its classical family (the Schoenflies parent's app key): `2'm'm` =
 * C₂ᵥ(Cₛ) → `mm2`, `-4'm2'` = D₂d(C₂ᵥ) → `-42m`, `-6'2m'` = D₃ₕ(D₃) → `-6m2`. Flagged as
 * "bracketed: rotated setting" in `birss-tables/table-nomenclature.md`.
 */
const BRACKETED_FAMILY: Record<string, string> = {
  "2mm": "mm2",
  "-4m2": "-42m",
  "-62m": "-6m2",
};

/**
 * The classical symmetry-class family of any of the 122 magnetic point groups — the key into
 * `REFERENCE_AXES`. Type I: the group itself. Type II (grey): the group without its trailing `1'`.
 * Type III (black-and-white): the group with all time-reversal primes stripped (with the three
 * bracketed rotated-setting groups remapped to their classical family).
 */
export function getFamilyClass(name: string): string {
  if (!name.includes("'")) return name; // Type I — classical group is itself
  if (name.endsWith("1'")) {
    const parent = name.slice(0, -2);
    if (CLASSICAL_CLASSES.has(parent)) return parent; // Type II grey — parent + 1'
  }
  const stripped = name.replace(/'/g, ""); // Type III — strip time-reversal primes
  return BRACKETED_FAMILY[stripped] ?? stripped;
}
