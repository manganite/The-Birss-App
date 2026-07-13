/**
 * SSR smoke-render net for the two large pages (TablesPage, HelpPage) — the regression net for the
 * E13/E14 sub-component splits. Renders the initial JSX to an HTML string via `renderToStaticMarkup`
 * (the repo's existing component-test pattern — no jsdom, no testing-library; KaTeX/motion are
 * SSR-safe, effects/portals don't run, which is exactly the smoke level we want) and asserts each
 * page/tab renders without throwing AND still contains a distinctive landmark of its content.
 *
 * The splits are pure JSX relocations, so these landmarks must stay present through them; this net is
 * frozen from the split commits on and may only GROW (a per-sub-component assertion), never weaken.
 * It is a smoke net, not an interaction suite (that is E22).
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HelpPage } from './HelpPage';
import { TablesPage } from './TablesPage';
import { POINT_GROUPS } from '../data/pointGroups';
import type { TensorConfig } from '../types';

const noop = () => {};

/** A full TensorConfig stub with no-op setters; TablesPage reads only {setting, setSetting, convention}. */
const stubConfig = (setting = 1): TensorConfig => ({
  type: 'ED',
  setType: noop,
  timeReversal: 'i',
  setTimeReversal: noop,
  setting,
  setSetting: noop,
  convention: 'birss',
  setConvention: noop,
});

const group = (name: string) => POINT_GROUPS.find((p) => p.name === name)!;

describe('HelpPage SSR smoke net (one render per tab)', () => {
  // [tab id, a landmark phrase that appears ONLY in that tab's body]
  const TABS: [string, string][] = [
    ['overview', 'Browse all 122 crystallographic magnetic point groups'],
    ['conventions', 'Coordinate Systems'],
    // apostrophe-free (renderToStaticMarkup escapes ' as &#x27;)
    ['physics', 'fundamental principle underlying this calculator'],
    ['simulation', 'isolates the independent tensor components'],
    ['tables', 'What the Tables page shows'],
    ['deeper', 'crystal structure contribution to SHG'],
  ];

  for (const [tab, landmark] of TABS) {
    it(`${tab} tab renders with its landmark content`, () => {
      let html = '';
      expect(() => {
        html = renderToStaticMarkup(<HelpPage activeTab={tab} />);
      }).not.toThrow();
      expect(html).toContain(landmark);
    });
  }
});

describe('TablesPage SSR smoke net (both modes)', () => {
  const renderType = (name: string) =>
    renderToStaticMarkup(
      <TablesPage selectedGroup={group(name)} tensorConfig={stubConfig()} onNavigate={noop} onSelectGroup={noop} />,
    );
  const renderEffect = (name: string, effectId: string) =>
    renderToStaticMarkup(
      <TablesPage
        selectedGroup={group(name)}
        tensorConfig={stubConfig()}
        onNavigate={noop}
        onSelectGroup={noop}
        effectId={effectId}
      />,
    );

  it('type mode (mm2): mode chips, tensor-form section, and sharing section', () => {
    const html = renderType('mm2');
    expect(html).toContain('By tensor type');
    expect(html).toContain('Tensor form');
    expect(html).toContain('Groups sharing this form');
  });

  it('type mode (m-3m, cubic): tensor-form and sharing sections', () => {
    const html = renderType('m-3m');
    expect(html).toContain('Tensor form');
    expect(html).toContain('Groups sharing this form');
  });

  it('effect mode (3m, piezoelectricity): effect defining block + tensor-form section', () => {
    const html = renderEffect('3m', 'piezoelectricity');
    expect(html).toContain('By effect');
    expect(html).toContain('Piezoelectricity');
    expect(html).toContain('Tensor form');
  });
});
