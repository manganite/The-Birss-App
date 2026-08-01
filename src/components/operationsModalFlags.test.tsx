import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OperationsModal } from './OperationsModal';
import { POINT_GROUPS } from '../data/pointGroups';
import { MODAL_CHIP_IDS, propertyFlag } from './propertyFlagDefs';

/**
 * Behaviour pin for the operations modal's property chips (B27-S).
 *
 * B27-S moved the modal's chip definitions into the shared `propertyFlagDefs` list so the header
 * and the modal cannot disagree about what a flag means. That refactor had to change nothing this
 * surface renders, and "had to" is not evidence -- these are the expected values, captured from the
 * modal by SSR BEFORE the extraction and hard-coded here afterwards.
 *
 * The modal deliberately differs from the header, which is why it needs its own pin: it carries the
 * two piezo flags the header omits, and it draws absent flags struck through where the header omits
 * them. Both differences are recorded as decisions in `propertyFlagDefs.ts`; this file is what stops
 * them eroding by accident.
 *
 * SSR rather than jsdom, following `OperationsModal.polarDirections.test.tsx`: the chips are static
 * output, so rendering to static markup is both sufficient and faster than mounting the dialog.
 */

const group = (name: string) => POINT_GROUPS.find((p) => p.name === name)!;

const markup = (name: string) =>
  renderToStaticMarkup(<OperationsModal group={group(name)} convention="birss" onClose={() => {}} />);

/**
 * The chips as `[label, allowed]`, in render order. `bg-ink` is the filled (admitted) styling.
 *
 * The label is captured directly -- the text node that follows the chip's icon -- rather than by
 * stripping tags out of the chip body. A single-pass `replace(/<[^>]*>/g, '')` is not a correct way
 * to remove markup, and CodeQL rightly flags it (`js/incomplete-multi-character-sanitization`) even
 * though nothing untrusted reaches this function. Capturing what we want beats deleting what we
 * do not.
 */
function chips(html: string): Array<[string, boolean]> {
  const pattern =
    /<span class="inline-flex items-center gap-1 px-2\.5 py-1 text-xs border ([^"]*)"[^>]*>[\s\S]*?<\/svg>([^<]*)</g;
  return [...html.matchAll(pattern)].map(([, cls, label]) => [label.trim(), cls.includes('bg-ink')]);
}

describe('Operations modal — property chips unchanged by the shared-definition extraction', () => {
  it('draws the five chips in their established order', () => {
    expect(chips(markup('1')).map(([label]) => label)).toEqual([
      'Polar',
      'Piezoelectric',
      'Ferromagnetic',
      'Piezomagnetic',
      'Magnetoelectric',
    ]);
    // ...which is the order the shared list declares, not a second ordering maintained here.
    expect(MODAL_CHIP_IDS.map((id) => propertyFlag(id).label)).toEqual([
      'Polar',
      'Piezoelectric',
      'Ferromagnetic',
      'Piezomagnetic',
      'Magnetoelectric',
    ]);
  });

  it.each([
    ['1', ['Polar', 'Piezoelectric', 'Ferromagnetic', 'Piezomagnetic', 'Magnetoelectric']],
    ["2'/m'", ['Ferromagnetic', 'Piezomagnetic']],
    ["-3'm'", ['Magnetoelectric']],
    ['m-3m', []],
  ] as const)('%s admits exactly %j, and the rest render struck through', (name, admitted) => {
    const rendered = chips(markup(name));
    expect(rendered).toHaveLength(5);
    expect(rendered.filter(([, ok]) => ok).map(([label]) => label)).toEqual([...admitted]);
    // The header omits absent flags; this surface keeps all five and marks them. That contrast is
    // the point of having both pins.
    expect(rendered.filter(([, ok]) => !ok)).toHaveLength(5 - admitted.length);
  });

  it('keeps the chiral row, which is not a chip', () => {
    // Chiral is shown as a Yes/No row in the definition list above the chips. The extraction routed
    // its test through the shared list too, so this guards that the row still reads from it.
    expect(markup('1')).toContain('Chiral');
    expect(chips(markup('1')).map(([label]) => label)).not.toContain('Chiral');
  });
});
