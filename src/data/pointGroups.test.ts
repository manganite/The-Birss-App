/**
 * Drift guard for the GroupKey source (E30, mechanism ii). `GROUP_KEYS` is a hand-maintained literal
 * tuple deriving the `GroupKey` union; it is separate from `POINT_GROUPS` (deriving GroupKey via
 * `POINT_GROUPS as const` would make POINT_GROUPS a rigid 122-tuple that cascades narrowing across the
 * app). This test asserts the two lists stay identical, so a group added/removed/renamed in one but
 * not the other fails loudly instead of silently drifting the type from the data.
 */
import { describe, it, expect } from 'vitest';
import { GROUP_KEYS, POINT_GROUPS } from './pointGroups';

describe('GROUP_KEYS ↔ POINT_GROUPS drift guard', () => {
  it('GROUP_KEYS equals POINT_GROUPS names, in order', () => {
    expect([...GROUP_KEYS]).toEqual(POINT_GROUPS.map((g) => g.name));
  });
});
