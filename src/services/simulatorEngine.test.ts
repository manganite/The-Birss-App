/**
 * Smoke/regression pins for buildSimulationData (the Simulator polarimetry sweep).
 * See simulatorEngine.fixtures.ts for provenance (base-replication capture), the reduced-projection
 * rationale, and the coverage map. Byte-level float agreement to 6 decimals; a red pin is a
 * behaviour change to STOP AND REPORT.
 */
import { describe, it, expect } from 'vitest';
import { calculateSHGExpressions } from './tensorCalculator';
import { buildSimulationData, type SimulationData } from './simulatorEngine';
import { SWEEP_ANGLES, SWEEP_CASES } from './simulatorEngine.fixtures';

/** The same reduced projection the fixtures pin (see fixture header). */
function project(out: SimulationData) {
  const fields = (p: SimulationData['data'][number]) => [
    p.parallel,
    p.crossed,
    p.pol_a0,
    p.pol_a90,
    p.ana_p0,
    p.ana_p90,
  ];
  const checksum = out.data.reduce((s, p) => s + fields(p).reduce((a, b) => a + b, 0), 0);
  return {
    dataLength: out.data.length,
    maxIntensity: out.maxIntensity,
    maxParallel: out.maxParallel,
    maxCrossed: out.maxCrossed,
    maxPolA0: out.maxPolA0,
    maxPolA90: out.maxPolA90,
    maxAnaP0: out.maxAnaP0,
    maxAnaP90: out.maxAnaP90,
    checksum,
    p0: fields(out.data[0]),
    p45: fields(out.data[45]),
  };
}

describe('buildSimulationData zero-shape (missing source polynomials)', () => {
  const ZERO_SHAPE = {
    data: [],
    maxIntensity: 0,
    maxParallel: 0,
    maxCrossed: 0,
    maxPolA0: 0,
    maxPolA90: 0,
    maxAnaP0: 0,
    maxAnaP90: 0,
  };
  const nonEmpty = new Map([['\\chi_{zxx}', new Map([['00', 1]])]]);

  it('returns the zero-shape when both polynomials are absent', () => {
    expect(buildSimulationData(undefined, undefined, {}, {})).toEqual(ZERO_SHAPE);
  });
  it('returns the zero-shape when only S_X is absent', () => {
    expect(buildSimulationData(undefined, nonEmpty, {}, {})).toEqual(ZERO_SHAPE);
  });
  it('returns the zero-shape when only S_Y is absent', () => {
    expect(buildSimulationData(nonEmpty, undefined, {}, {})).toEqual(ZERO_SHAPE);
  });
});

describe('buildSimulationData regression pins', () => {
  for (const c of SWEEP_CASES) {
    it(c.name, () => {
      const source = calculateSHGExpressions({
        groupName: c.group,
        tensorType: c.tensorType,
        trType: c.trType,
        ...SWEEP_ANGLES,
        setting: 1,
        labFrameDisplayMode: 'E0_THETA',
      }).source;
      const sXPoly = source.find((t) => t.component === 'S_X')?.rawPoly;
      const sYPoly = source.find((t) => t.component === 'S_Y')?.rawPoly;

      const got = project(buildSimulationData(sXPoly, sYPoly, c.amplitudes, c.phases));
      const exp = c.expected;

      expect(got.dataLength).toBe(exp.dataLength);
      expect(got.maxIntensity).toBeCloseTo(exp.maxIntensity, 6);
      expect(got.maxParallel).toBeCloseTo(exp.maxParallel, 6);
      expect(got.maxCrossed).toBeCloseTo(exp.maxCrossed, 6);
      expect(got.maxPolA0).toBeCloseTo(exp.maxPolA0, 6);
      expect(got.maxPolA90).toBeCloseTo(exp.maxPolA90, 6);
      expect(got.maxAnaP0).toBeCloseTo(exp.maxAnaP0, 6);
      expect(got.maxAnaP90).toBeCloseTo(exp.maxAnaP90, 6);
      expect(got.checksum).toBeCloseTo(exp.checksum, 6);
      got.p0.forEach((v, i) => expect(v).toBeCloseTo(exp.p0[i], 6));
      got.p45.forEach((v, i) => expect(v).toBeCloseTo(exp.p45[i], 6));
    });
  }
});
