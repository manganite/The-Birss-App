import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { getCanonicalFormSignature, type TensorSpec } from './tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * Anchor / correctness proof for the Tables "Groups sharing this form" feature: two groups share a
 * form iff their frame-canonical signature (`getCanonicalFormSignature` -- the min over the group's
 * tabulated settings) agrees. For the linear magnetoelectric tensor {2, axial, c, none} the
 * canonical-signature partition over the 58 groups of ITC Table 1.5.8.1 must EQUAL that table's own
 * F1-F11 form-block partition, and the remaining 64 groups must all share the zero signature.
 * (The plain setting-1 signature only *refines* the blocks -- see the findings §9 addendum for why
 * the canonical signature is the correct "same printed-table form" notion.) Anti-circular: the
 * expected partition is parsed from the vendored reference file, never from the signature.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ref = (name: string) => readFileSync(path.resolve(__dirname, '../../docs/references', name), 'utf-8');
const NOMENCLATURE = readFileSync(path.resolve(__dirname, '../../birss-tables/table-nomenclature.md'), 'utf-8');

const stripBackticks = (s: string) => s.replace(/^`|`$/g, '');
function tableRows(section: string): string[][] {
  return section.split('\n').filter(l => l.trim().startsWith('|'))
    .map(l => l.split('|').slice(1, -1).map(c => c.trim()))
    .filter(cells => !cells.every(c => /^:?-+:?$/.test(c)));
}
function sliceBetween(content: string, start: string, end: string): string {
  const s = content.indexOf(start);
  const rest = content.slice(s + start.length);
  const e = rest.indexOf(end);
  return e === -1 ? rest : rest.slice(0, e);
}

// Schoenflies -> app key (via table-nomenclature; ITC S6 == app/Birss C3i).
const schToKey: Record<string, string> = {};
for (const cells of [
  ...tableRows(sliceBetween(NOMENCLATURE, '## Table A', '## Table B')),
  ...tableRows(sliceBetween(NOMENCLATURE, '## Table C', '## Changelog')),
]) {
  if (cells[1] === 'Schoenflies') continue;
  schToKey[cells[1].replace(/<\/?sub>/g, '').replace(/<\/?sup>/g, '')] = stripBackticks(cells[2]);
}

// ITC 1.5.8.1: app key -> form block (F1..F11).
const groupBlock: Record<string, string> = {};
for (const cells of tableRows(sliceBetween(ref('ITC-table-1.5.8.1-magnetoelectric-groups.md'), '## Group list', '## Matrix forms'))) {
  if (!/^F\d+$/.test(cells[0])) continue;
  const key = schToKey[cells[1].replace(/S6/g, 'C3i')];
  if (key) groupBlock[key] = cells[0];
}

const ME_SPEC: TensorSpec = { rank: 2, parity: 'axial', timeParity: 'c', intrinsic: 'none' };
const ALL = POINT_GROUPS.map(g => g.name);

/** Canonicalize a partition (map from key -> bucket id) into a comparable set of sorted group lists. */
function partitionAsSetOfSets(bucketOf: Map<string, string>): Set<string> {
  const buckets = new Map<string, string[]>();
  for (const [group, bucket] of bucketOf) {
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(group);
  }
  return new Set([...buckets.values()].map(gs => gs.slice().sort().join(',')));
}

describe('getFormSignature partition == ITC 1.5.8.1 form blocks (magnetoelectric)', () => {
  it('maps 58 ME groups to blocks', () => {
    expect(Object.keys(groupBlock)).toHaveLength(58);
  });

  it('the canonical-signature partition of the 58 ME groups equals their F1-F11 block partition', () => {
    const meGroups = Object.keys(groupBlock);
    const byBlock = new Map<string, string>(meGroups.map(g => [g, groupBlock[g]]));
    const bySignature = new Map<string, string>(meGroups.map(g => [g, getCanonicalFormSignature(g, ME_SPEC)]));
    expect(partitionAsSetOfSets(bySignature)).toEqual(partitionAsSetOfSets(byBlock));
  });

  it('the other 64 (non-ME) groups all share the zero signature', () => {
    const nonME = ALL.filter(g => !(g in groupBlock));
    expect(nonME).toHaveLength(64);
    for (const g of nonME) {
      expect(getCanonicalFormSignature(g, ME_SPEC), g).toBe('r2:zero');
    }
  });
});
