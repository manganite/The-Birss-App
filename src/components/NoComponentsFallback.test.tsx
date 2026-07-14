/**
 * SSR smoke assertion for the shared NoComponentsFallback (chunk-3b E15 extraction). Renders it
 * standalone and checks the three message branches (via zeroStateReason) and the recovery buttons.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NoComponentsFallback } from './NoComponentsFallback';
import type { TensorType, TensorTimeReversal } from '../services/tensorCalculator';
import type { GroupKey } from '../data/pointGroups';

const noop = () => {};
const render = (
  tensorType: TensorType,
  groupName: GroupKey,
  groupType: 'I' | 'II' | 'III',
  timeReversal: TensorTimeReversal,
) =>
  renderToStaticMarkup(
    <NoComponentsFallback
      tensorType={tensorType}
      setTensorType={noop}
      timeReversal={timeReversal}
      setTimeReversal={noop}
      groupName={groupName}
      groupType={groupType}
      outerClassName="outer"
      infoClassName="info"
      buttonsClassName="buttons"
    />,
  );

describe('NoComponentsFallback', () => {
  it('centrosymmetric ED i-type: symmetry-forbidden message', () => {
    const html = render('ED', 'm-3m', 'I', 'i');
    expect(html).toContain('ED SHG is symmetry-forbidden for centrosymmetric groups (i-type).');
  });

  it('grey group c-type: c-type-vanish message', () => {
    const html = render('ED', "11'", 'II', 'c');
    expect(html).toContain('c-type tensors vanish for grey groups');
  });

  it('otherwise: generic no-components fallback', () => {
    const html = render('ED', '1', 'I', 'i');
    expect(html).toContain('No non-zero components for this configuration.');
  });

  it('renders the recovery buttons for the current config (i-type ED)', () => {
    const html = render('ED', '1', 'I', 'i');
    expect(html).toContain('Try c-type'); // i-type → offer c
    expect(html).not.toContain('Try i-type');
    expect(html).toContain('Try EQ'); // ED → offer EQ + MD
    expect(html).toContain('Try MD');
  });
});
