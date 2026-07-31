/**
 * @vitest-environment jsdom
 *
 * Interaction coverage for the Table-7 book-misprint footnote's "Learn more" affordance, in BOTH
 * views that render it: the breadcrumb (`tables/LookupChain.tsx`) and the expandable diagram
 * (`LookupChainDiagram.tsx`).
 *
 * Both read the same `bookErrorNote` from `getTable7Chain`, so they must offer the same way out of
 * it; before T7-BC the diagram rendered the note without the link. These tests pin the affordance
 * (present, and navigating to the same Help target in both) rather than the note's wording, which
 * lives in `conventionMapping.BOOK_ERROR_WARNING`.
 *
 * Route note: the note is reachable only on the Table-7 c-tensor route of `-6m'2'` -- the one row
 * whose printed A-column contradicts its own Table-6 generator (birss-tables/table-7.md, 2026-07-04
 * findings). It fires on 5 (parity, rank) cells of that group and on no other group, so the negative
 * control below uses another black-and-white group on the same route.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LookupChainDiagram } from './LookupChainDiagram';
import { POINT_GROUPS, type GroupKey } from '../data/pointGroups';
import type { TensorRank } from '../services/tensorForms';

// Explicit cleanup, as in the other interaction suites: this project runs vitest without
// `globals`, so testing-library's automatic afterEach teardown is not registered.
afterEach(cleanup);

const typeOf = (name: string) => POINT_GROUPS.find((p) => p.name === name)!.type;

const renderDiagram = (
  name: GroupKey,
  parity: 'polar' | 'axial',
  rank: TensorRank,
  onNavigate?: (view: string, tab?: string) => void,
) =>
  render(
    <LookupChainDiagram
      groupName={name}
      groupType={typeOf(name)}
      parity={parity}
      rank={rank}
      timeParity="c"
      onNavigate={onNavigate}
    />,
  );

describe("Table-7 misprint footnote — the diagram's Learn-more affordance", () => {
  it("-6m'2' polar rank-3: the footnote renders and its Learn more navigates to Help > Deeper Topics", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderDiagram("-6m'2'", 'polar', 3, onNavigate);

    expect(screen.getByText(/⚠/)).toBeTruthy();
    const link = screen.getByRole('button', { name: /learn more/i });
    await user.click(link);
    // Same target as the breadcrumb's footnote in tables/LookupChain.tsx.
    expect(onNavigate).toHaveBeenCalledWith('help', 'deeper');
  });

  it('renders the note without the affordance when no onNavigate is supplied (Help embed)', () => {
    // helpTables.tsx embeds the diagram without onNavigate; the note must still show, the link must not.
    renderDiagram("-6m'2'", 'polar', 3);
    expect(screen.getByText(/⚠/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /learn more/i })).toBeNull();
  });

  it('negative control: an unaffected black-and-white group on the same route has no footnote at all', () => {
    // -6'2m' is the OTHER 2026-07-04 misprint row, and deliberately carries no note here: its
    // misprint is a bracket omission in the i-cells with no physical consequence, and the Table-7
    // route renders only for c-tensors -- so nothing on this chain is affected by it.
    const onNavigate = vi.fn();
    renderDiagram("-6'2m'", 'polar', 3, onNavigate);
    expect(screen.queryByText(/⚠/)).toBeNull();
    expect(screen.queryByRole('button', { name: /learn more/i })).toBeNull();
  });
});
