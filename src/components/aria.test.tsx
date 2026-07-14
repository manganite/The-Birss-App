/**
 * a11y smoke assertions for the chunk-4 E24 ARIA pass: the tab widgets expose tablist/tab/tabpanel
 * and the main nav exposes aria-current. SSR via renderToStaticMarkup (the repo's component-test
 * pattern); this asserts presence of the declarative ARIA, not keyboard behaviour.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../App';
import { HelpPage } from './HelpPage';
import { CalculatorPage } from './CalculatorPage';
import { PolarimetrySection } from './PolarimetrySection';
import { POINT_GROUPS } from '../data/pointGroups';
import type { TensorConfig, PresetAnglesState } from '../types';

const noop = () => {};
const cfg: TensorConfig = {
  type: 'ED',
  setType: noop,
  timeReversal: 'i',
  setTimeReversal: noop,
  setting: 1,
  setSetting: noop,
  convention: 'birss',
  setConvention: noop,
};
const preset: PresetAnglesState = { thetaX: 0, setThetaX: noop, thetaY: 0, setThetaY: noop, psi0: 0, setPsi0: noop };
const simData = {
  data: [],
  maxIntensity: 0,
  maxParallel: 0,
  maxCrossed: 0,
  maxPolA0: 0,
  maxPolA90: 0,
  maxAnaP0: 0,
  maxAnaP90: 0,
};
const g = (n: string) => POINT_GROUPS.find((p) => p.name === n)!;

describe('E24 declarative ARIA', () => {
  it('HelpPage tabs: tablist / tab / tabpanel', () => {
    const html = renderToStaticMarkup(<HelpPage activeTab="overview" />);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-selected="true"'); // the active tab
  });

  it('CalculatorPage result tabs: tablist / tab / tabpanel', () => {
    const html = renderToStaticMarkup(
      <CalculatorPage selectedGroup={g('mm2')} tensorConfig={cfg} presetAngles={preset} onNavigate={noop} />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('id="calc-tab-components"');
    expect(html).toContain('role="tabpanel"');
  });

  it('PolarimetrySection tabs: tablist / tab', () => {
    const html = renderToStaticMarkup(
      <PolarimetrySection
        selectedGroup={g('mm2')}
        tensorConfig={cfg}
        independentComponents={['\\chi_{zxx}']}
        simulationData={simData}
        onNavigate={noop}
      />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('id="polari-tab-anisotropy"');
    expect(html).toContain('role="tabpanel"');
  });

  it('main nav: aria-current on the active view', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('aria-current="page"');
  });
});
