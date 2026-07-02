#!/usr/bin/env npx tsx
/**
 * Audit Phase 3a (WORKORDER-audit-close-out.md Part 1): enumerates all
 * 122 groups x {ED, MD, EQ} x {i, c} and classifies each cell as ZERO, PINNED, or
 * UNPINNED. Emits a Markdown summary (counts + full UNPINNED list) to stdout;
 * the audit doc's Phase 3 section is filled in by hand from this output.
 *
 * ZERO/nonzero is decided by calling the app's own calculateTensorComponents
 * (the exhaustive, authoritative answer -- this is a coverage catalog, not an
 * independence check, so importing app code here is fine). The "reason"
 * column on ZERO cells is a best-effort annotation from the group's operator
 * set (grey rule, unitary/primed inversion parity) -- NOT exhaustive: some
 * cells vanish for purely rotational reasons (e.g. 432 ED-i, m-3m MD-i) with
 * no inversion involved, and are labeled as such.
 *
 * Run: npx tsx scripts/coverage_matrix.mjs
 */
import { calculateTensorComponents } from '../src/services/tensorCalculator.ts';
import { GOLDEN_FIXTURES } from '../src/services/goldenTensors.fixtures.ts';
import { POINT_GROUPS } from '../src/data/pointGroups.ts';
import { GENERATORS, getCachedFullGroup, isSameMatrix, inversion } from '../src/services/symmetryGroups.ts';

const TENSOR_TYPES = ['ED', 'MD', 'EQ'];
const TR_TYPES = ['i', 'c'];

const pinnedKeys = new Set(
  GOLDEN_FIXTURES.filter((f) => !f.setting || f.setting === 1).map((f) => `${f.group}::${f.tensor}::${f.tr}`)
);

function zeroReason(groupName, tensor, tr, isGrey) {
  if (isGrey && tr === 'c') return 'grey group: c ≡ 0 (Table 6 note; Step 5e)';

  const generators = GENERATORS[groupName];
  const group = generators ? getCachedFullGroup(groupName, generators) : [];
  const hasUnitaryInversion = group.some((m) => !m.isAntiUnitary && isSameMatrix(m, inversion));
  const hasPrimedInversion = group.some((m) => m.isAntiUnitary && isSameMatrix({ ...m, isAntiUnitary: false }, inversion));

  if (tensor === 'ED') {
    if (tr === 'i' && (hasUnitaryInversion || hasPrimedInversion)) {
      return 'i-type ignores the antiunitary flag; spatial inversion present forces polar-odd-rank zero (parity)';
    }
    if (tr === 'c' && hasUnitaryInversion) {
      return 'unitary -1 present: kills polar odd-rank c-tensor too (trFactor=+1 regardless of tr-type for unitary elements)';
    }
  }
  return 'vanishes by rotational/point-group selection (no simple parity rule from inversion presence -- see Table 4a/7 symbol class)';
}

const rows = [];
const unpinned = [];

for (const pg of POINT_GROUPS) {
  const isGrey = pg.type === 'II';
  for (const tensor of TENSOR_TYPES) {
    for (const tr of TR_TYPES) {
      const result = calculateTensorComponents(pg.name, tensor, tr);
      const isZero = result.length === 1 && result[0] === 'All components are zero.';
      const key = `${pg.name}::${tensor}::${tr}`;
      let status;
      if (isZero) {
        status = 'ZERO';
      } else if (pinnedKeys.has(key)) {
        status = 'PINNED';
      } else {
        status = 'UNPINNED';
        unpinned.push({ group: pg.name, tensor, tr, form: result });
      }
      rows.push({ group: pg.name, tensor, tr, status, reason: isZero ? zeroReason(pg.name, tensor, tr, isGrey) : null });
    }
  }
}

// --- Summary counts per (tensor, tr) ---
console.log(`Total cells: ${rows.length} (122 groups x 3 tensors x 2 tr-types)\n`);
console.log('| Tensor | tr | ZERO | PINNED | UNPINNED | Total |');
console.log('|---|---|---|---|---|---|');
for (const tensor of TENSOR_TYPES) {
  for (const tr of TR_TYPES) {
    const subset = rows.filter((r) => r.tensor === tensor && r.tr === tr);
    const zero = subset.filter((r) => r.status === 'ZERO').length;
    const pinned = subset.filter((r) => r.status === 'PINNED').length;
    const unp = subset.filter((r) => r.status === 'UNPINNED').length;
    console.log(`| ${tensor} | ${tr} | ${zero} | ${pinned} | ${unp} | ${subset.length} |`);
  }
}
const totalZero = rows.filter((r) => r.status === 'ZERO').length;
const totalPinned = rows.filter((r) => r.status === 'PINNED').length;
const totalUnpinned = rows.filter((r) => r.status === 'UNPINNED').length;
console.log(`| **All** | **both** | **${totalZero}** | **${totalPinned}** | **${totalUnpinned}** | **${rows.length}** |`);

console.log(`\n## UNPINNED cells (${unpinned.length}), grouped by tensor/tr\n`);
console.log('| Tensor | tr | Count | Groups |');
console.log('|---|---|---|---|');
for (const tensor of TENSOR_TYPES) {
  for (const tr of TR_TYPES) {
    const subset = unpinned.filter((u) => u.tensor === tensor && u.tr === tr);
    if (subset.length === 0) continue;
    console.log(`| ${tensor} | ${tr} | ${subset.length} | ${subset.map((u) => `\`${u.group}\``).join(', ')} |`);
  }
}
