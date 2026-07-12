import { POINT_GROUPS } from '../src/data/pointGroups';
import { getCanonicalFormSignature, type TensorSpec } from '../src/services/tensorForms';
import { enumerateUiSpecs, specKeyOf } from '../src/data/uiTensorSpecs';

/**
 * Partition all 122 point groups by frame-canonical form signature for `spec`. Two groups land in
 * the same class iff they share the printed-table "same form" (see getCanonicalFormSignature).
 * Classes are ordered by first appearance of their signature; members within a class stay in
 * POINT_GROUPS order. Fully deterministic, so the generated module is idempotent.
 */
export function buildSharingPartition(spec: TensorSpec): string[][] {
  const bySig = new Map<string, string[]>();
  const order: string[] = [];
  for (const g of POINT_GROUPS) {
    const sig = getCanonicalFormSignature(g.name, spec);
    let cls = bySig.get(sig);
    if (!cls) {
      cls = [];
      bySig.set(sig, cls);
      order.push(sig);
    }
    cls.push(g.name);
  }
  return order.map((sig) => bySig.get(sig)!);
}

/** The sharing partition for every UI-reachable spec, keyed by specKey. */
export function buildAllPartitions(): Record<string, string[][]> {
  const out: Record<string, string[][]> = {};
  for (const spec of enumerateUiSpecs()) {
    out[specKeyOf(spec)] = buildSharingPartition(spec);
  }
  return out;
}
