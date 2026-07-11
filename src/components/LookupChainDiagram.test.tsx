import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LookupChainDiagram } from './LookupChainDiagram';
import type { TensorRank } from '../services/tensorForms';
import { POINT_GROUPS } from '../data/pointGroups';

/**
 * The diagram is driven live by getTable7Chain / getFamilyClass, so these expectations are pinned to
 * the print-verified worked examples in the Tables help content spec (not to component output):
 *   - m'm'm polar rank-2 c  -> source B = mm2, Axial-even column (crossover), class E, Table 4d E2
 *   - 4'mm' polar rank-3 c  -> source A = -4m2 (rotated Rz(45deg)), Polar-odd, class J, Table 4e J3
 *   - 321' (grey, Type II)  -> c-tensor vanishes identically
 * Rendered without a DOM via renderToStaticMarkup (KaTeX is SSR-safe); onNavigate omitted so the
 * portal tooltips are not exercised here.
 */

const typeOf = (name: string) => POINT_GROUPS.find((p) => p.name === name)!.type;

const render = (name: string, parity: 'polar' | 'axial', rank: TensorRank, timeParity: 'i' | 'c') =>
  renderToStaticMarkup(
    <LookupChainDiagram
      groupName={name}
      groupType={typeOf(name)}
      parity={parity}
      rank={rank}
      timeParity={timeParity}
    />,
  );

describe('LookupChainDiagram', () => {
  it('renders all three variants without throwing', () => {
    expect(() => render("m'm'm", 'polar', 2, 'c')).not.toThrow();
    expect(() => render("4'mm'", 'polar', 3, 'c')).not.toThrow();
    expect(() => render("321'", 'polar', 3, 'c')).not.toThrow();
  });

  it("m'm'm polar rank-2 c: source B = mm2, Axial-even read, class E, Table 4d row E2, crossover", () => {
    const html = render("m'm'm", 'polar', 2, 'c');
    expect(html).toContain('B =');
    expect(html).toContain('mm2'); // KaTeX annotation text for the source symbol
    expect(html).toContain('Axial, even'); // the highlighted Table-4a column
    expect(html).toContain('parity crossover');
    expect(html).toContain('E2'); // class E at rank 2
    expect(html).toContain('Table 4d');
  });

  it("4'mm' polar rank-3 c: rotated badge Rz(45), class J, Table 4e row J3", () => {
    const html = render("4'mm'", 'polar', 3, 'c');
    expect(html).toContain('rotated:');
    expect(html).toContain('Rz(45');
    expect(html).toContain('Polar, odd');
    expect(html).toContain('J3');
    expect(html).toContain('Table 4e');
    expect(html).not.toContain('parity crossover'); // polar-odd reads the polar column: no crossover
  });

  it("321' grey group: c-tensor vanishes identically", () => {
    const html = render("321'", 'polar', 3, 'c');
    expect(html).toContain('vanishes identically');
    expect(html).toContain('time reversal');
  });

  it("classical variant (i-tensor) reads the group's own family class", () => {
    // 32 polar rank-3 i -> class L, Table 4e row L3 (classical chain, no fork).
    const html = render('32', 'polar', 3, 'i');
    expect(html).toContain('L3');
    expect(html).toContain('Table 4e');
    expect(html).not.toContain('Table 7');
  });
});
