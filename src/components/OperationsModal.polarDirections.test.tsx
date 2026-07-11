import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OperationsModal } from './OperationsModal';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * Render guard for the Explorer popup's new blocks (polar directions + lattice info), one group per
 * category. Expectations come from the vendored ITC references, not from component output. Rendered
 * without a DOM via renderToStaticMarkup (the dialog a11y/effects and portals are effect-only).
 */

const render = (name: string) => {
  const group = POINT_GROUPS.find((g) => g.name === name)!;
  return renderToStaticMarkup(<OperationsModal group={group} convention="birss" onClose={() => {}} />);
};

describe('OperationsModal -- polar directions + lattice info', () => {
  it('classical noncentro (32): polar axes, nonpolar tertiary set, 30 deg divergence footnote, hP lattice', () => {
    const html = render('32');
    expect(html).toContain('Polar directions');
    expect(html).toContain('120'); // polar axis [120] (312 row, app frame)
    expect(html).toContain('tertiary'); // nonpolar set class label
    expect(html).toContain('rotated 30'); // the divergence footnote
    expect(html).not.toContain('No polar directions');
    expect(html).toContain('hP'); // Bravais lattice (crystalSystems)
    expect(html).toContain('Free parameters');
  });

  it('centrosymmetric (mmm): no polar directions', () => {
    const html = render('mmm');
    expect(html).toContain('No polar directions (centrosymmetric)');
    expect(html).not.toContain('rotated 30');
  });

  it("magnetic (32'): skeleton-derived values with the spatial-action note", () => {
    const html = render("32'");
    expect(html).toContain('primes act spatially');
    expect(html).toContain('120'); // skeleton (32) directions shown
    expect(html).toContain('rotated 30'); // 32 skeleton is frame-divergent
  });

  it('622: the omitted [uv0] primary set is restored with the print-omission footnote', () => {
    const html = render('622');
    expect(html).toContain('uv0'); // restored primary set
    expect(html).toContain('primary');
    expect(html).toContain('Corrected: ITC Table 3.2.2.2'); // print-omission footnote
  });
});
