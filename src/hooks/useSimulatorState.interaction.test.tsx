/**
 * @vitest-environment jsdom
 *
 * Contract coverage for `useSimulatorState` (T5a), driven through `renderHook`.
 *
 * These tests pin the hook's STRUCTURAL contract only: which fields exist, how the amplitude/phase
 * maps are initialized and preserved across recomputation, that both display modes populate, and
 * that the memo chain is referentially stable. They deliberately assert NO physics VALUES -- the
 * correctness of the source terms and their coefficients is owned by the print-anchored golden and
 * reference suites (tensorCalculator / tensorForms / symbolicProjection). Pinning values here would
 * duplicate that safety net at a weaker anchor.
 *
 * The harness owns the two useState pairs the hook writes through, mirroring the real consumer
 * (SimulatorPage). The fixture group is `3m`: classical, cheap, and -- unlike 4mm -- it yields a
 * NON-EMPTY in-plane source at the harness's normal-incidence base. Every surviving 4mm ED i
 * element carries a z index (chi_xxz/chi_xzx, chi_zxx/chi_zyy, chi_zzz), so at k||z (E_z = 0) it
 * gives S_X = S_Y = 0 and an empty component list; 3m's chi_xxx survives at normal incidence.
 * Tilting to thetaX = 0.3 then makes chi_xxz and chi_zxx appear, which is what lets the
 * preservation test below exercise both preservation and fresh initialization in one rerender.
 *
 * Explicit 30 s timeouts throughout (T1/E29 lesson: survive full-suite contention from day one).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { renderHook, act, cleanup } from '@testing-library/react';
import { POINT_GROUPS, type PointGroupData } from '../data/pointGroups';
import { useSimulatorState } from './useSimulatorState';

afterEach(cleanup);

const TIMEOUT_MS = 30000;

const g = (name: string) => POINT_GROUPS.find((p) => p.name === name)!;

interface HarnessProps {
  group: PointGroupData | null;
  thetaX?: number;
}

function useHarness(props: HarnessProps) {
  const [amplitudes, setAmplitudes] = useState<Record<string, number>>({});
  const [phases, setPhases] = useState<Record<string, number>>({});
  const sim = useSimulatorState(
    props.group,
    'ED',
    'i',
    props.thetaX ?? 0,
    0,
    0,
    0,
    0,
    0,
    1,
    amplitudes,
    setAmplitudes,
    phases,
    setPhases,
  );
  return { sim, amplitudes, phases, setAmplitudes, setPhases };
}

describe('useSimulatorState — state contract (jsdom)', () => {
  it(
    'null group yields the empty state',
    () => {
      const { result } = renderHook(useHarness, { initialProps: { group: null } as HarnessProps });

      expect(result.current.sim.sourceTerms).toEqual([]);
      expect(result.current.sim.sourceTermsExEy).toEqual([]);
      expect(result.current.sim.expandedFormulas).toBeNull();
      expect(result.current.sim.independentComponents).toEqual([]);
    },
    TIMEOUT_MS,
  );

  it(
    '3m ED i exposes a sorted, non-empty independent-component list',
    () => {
      const { result } = renderHook(useHarness, { initialProps: { group: g('3m') } as HarnessProps });

      const components = result.current.sim.independentComponents;
      expect(components.length).toBeGreaterThan(0);
      // Structural sortedness only -- which components appear is pinned by the golden suites.
      expect(components).toEqual([...components].sort());
    },
    TIMEOUT_MS,
  );

  it(
    'amplitudes initialize to 1 and phases to 0 for every independent component',
    () => {
      const { result } = renderHook(useHarness, { initialProps: { group: g('3m') } as HarnessProps });

      const components = result.current.sim.independentComponents;
      expect(components.length).toBeGreaterThan(0);
      for (const name of components) {
        expect(result.current.amplitudes[name], `amplitude for ${name}`).toBe(1);
        expect(result.current.phases[name], `phase for ${name}`).toBe(0);
      }
    },
    TIMEOUT_MS,
  );

  it(
    'existing amplitude and phase values are preserved across recomputation, and new components initialize',
    () => {
      const { result, rerender } = renderHook(useHarness, { initialProps: { group: g('3m') } as HarnessProps });

      const before = result.current.sim.independentComponents;
      const target = before[0];
      expect(target).toBeDefined();

      act(() => {
        result.current.setAmplitudes((prev) => ({ ...prev, [target]: 7 }));
      });
      expect(result.current.amplitudes[target]).toBe(7);

      act(() => {
        result.current.setPhases((prev) => ({ ...prev, [target]: 0.5 }));
      });
      expect(result.current.phases[target]).toBe(0.5);

      // Tilting recomputes the memo chain and re-runs the init effect. For 3m this also makes
      // additional components appear, so one rerender exercises both halves of the contract.
      rerender({ group: g('3m'), thetaX: 0.3 });

      const after = result.current.sim.independentComponents;
      expect(after.length).toBeGreaterThan(before.length);

      // (a) the user-set value survives the recomputation
      expect(result.current.amplitudes[target], 'user-set amplitude survives recomputation').toBe(7);
      expect(result.current.phases[target], 'user-set phase survives recomputation').toBe(0.5);

      // (b) every newly appearing component is freshly initialized
      const fresh = after.filter((name) => !before.includes(name));
      expect(fresh.length).toBeGreaterThan(0);
      for (const name of fresh) {
        expect(result.current.amplitudes[name], `new component ${name} amplitude`).toBe(1);
        expect(result.current.phases[name], `new component ${name} phase`).toBe(0);
      }

      // and the untouched pre-existing components stay initialized
      for (const name of after) {
        if (name === target) continue;
        expect(result.current.amplitudes[name], `amplitude for ${name}`).toBe(1);
      }
    },
    TIMEOUT_MS,
  );

  it(
    'both display modes and the expanded formulas are populated',
    () => {
      const { result } = renderHook(useHarness, { initialProps: { group: g('3m') } as HarnessProps });

      const formulas = result.current.sim.expandedFormulas;
      expect(formulas).not.toBeNull();
      // Presence of all six implies S_X and S_Y source terms exist in BOTH display modes
      // (the hook returns null unless all four raw polynomials are found).
      expect(Object.keys(formulas!).sort()).toEqual(['aniPar', 'aniPerp', 'anaP0', 'anaP90', 'polA0', 'polA90'].sort());
    },
    TIMEOUT_MS,
  );

  it(
    'sourceTerms is referentially stable across an identical rerender',
    () => {
      const { result, rerender } = renderHook(useHarness, { initialProps: { group: g('3m') } as HarnessProps });

      const before = result.current.sim.sourceTerms;
      rerender({ group: g('3m') });

      expect(result.current.sim.sourceTerms).toBe(before);
    },
    TIMEOUT_MS,
  );
});
