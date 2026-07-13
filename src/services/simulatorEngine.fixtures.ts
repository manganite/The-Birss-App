/**
 * simulatorEngine.fixtures.ts
 *
 * Smoke/regression pins for `buildSimulationData` (the Simulator's polarimetry sweep, audit M6),
 * which had NO test coverage before this extraction. They freeze the sweep output across the move
 * of the math out of `useSimulatorState` into `services/simulatorEngine`.
 *
 * PROVENANCE (anti-circular): the expected values were captured from the UNREFACTORED base — a
 * faithful standalone replication of the hook's inline sweep (useSimulatorState.ts:176-255), fed by
 * real `calculateSHGExpressions(..., 'E0_THETA')` source polynomials — NOT from the extracted
 * function. The extracted `buildSimulationData` must reproduce them. Regression pins, not literature
 * goldens; a red pin is a behaviour change to STOP AND REPORT.
 *
 * VOLUME: one full sweep serializes to ~37 KB (180 points × 7 fields), far over the ~2 KB budget, so
 * per the E8-retrospective volume rule these pin a REDUCED PROJECTION per case: the point count, the
 * seven maxima, a checksum (sum of all six intensity fields over all 180 points — sensitive to any
 * point-level drift), and two sample points (angle 0° and 90°).
 *
 * COVERAGE: under uniform amplitudes (all 1, phase 0) many groups collapse to the SAME sweep profile
 * (e.g. mm2/4mm/6mm ED coincide; mm2/-43m EQ coincide), so multiplying groups adds no structural
 * coverage. The distinct axes are pinned instead: a rank-3 polar profile (mm2 ED), a different
 * rank-3 structure (3m ED), a rank-4 profile (mm2 EQ, ~two orders smaller), and non-default
 * amplitude/phase (mm2 ED with A≠1, δ≠0 — exercises the chiReal/chiImag path).
 */

export const SWEEP_ANGLES = { thetaX: 20, thetaY: -30, psi0: 40, phiX: 30, phiY: 45, psi: 60 };

export interface SimSweepExpected {
  dataLength: number;
  maxIntensity: number;
  maxParallel: number;
  maxCrossed: number;
  maxPolA0: number;
  maxPolA90: number;
  maxAnaP0: number;
  maxAnaP90: number;
  /** Σ over all 180 points of (parallel + crossed + pol_a0 + pol_a90 + ana_p0 + ana_p90). */
  checksum: number;
  /** [parallel, crossed, pol_a0, pol_a90, ana_p0, ana_p90] at data[0] (angle 0°). */
  p0: number[];
  /** …at data[45] (angle 90°). */
  p45: number[];
}

export interface SimSweepCase {
  name: string;
  group: string;
  tensorType: 'ED' | 'EQ';
  trType: 'i' | 'c';
  amplitudes: Record<string, number>;
  phases: Record<string, number>;
  expected: SimSweepExpected;
}

export const SWEEP_CASES: SimSweepCase[] = [
  {
    name: 'mm2-ED-i',
    group: 'mm2',
    tensorType: 'ED',
    trType: 'i',
    amplitudes: {},
    phases: {},
    expected: {
      dataLength: 180,
      maxIntensity: 1.99996201,
      maxParallel: 1.99996201,
      maxCrossed: 0.995557448,
      maxPolA0: 1.988341389,
      maxPolA90: 1.989533641,
      maxAnaP0: 1.976923554,
      maxAnaP90: 1.979278038,
      checksum: 896.726332661,
      p0: [1.96417661, 0.013002558, 1.96417661, 0.013002558, 1.96417661, 0.008758335],
      p45: [1.970540527, 0.008758335, 0.008758335, 1.970540527, 0.013002558, 1.970540527],
    },
  },
  {
    name: '3m-ED-i',
    group: '3m',
    tensorType: 'ED',
    trType: 'i',
    amplitudes: {},
    phases: {},
    expected: {
      dataLength: 180,
      maxIntensity: 2.873158956,
      maxParallel: 2.873158956,
      maxCrossed: 1.026189253,
      maxPolA0: 1.318821382,
      maxPolA90: 2.697892077,
      maxAnaP0: 1.239990927,
      maxAnaP90: 2.544917984,
      checksum: 924.628318562,
      p0: [1.081949411, 0.158372846, 1.081949411, 0.158372846, 1.081949411, 0.096715584],
      p45: [2.448649645, 0.096715584, 0.096715584, 2.448649645, 0.158372846, 2.448649645],
    },
  },
  {
    name: 'mm2-EQ-i',
    group: 'mm2',
    tensorType: 'EQ',
    trType: 'i',
    amplitudes: {},
    phases: {},
    expected: {
      dataLength: 180,
      maxIntensity: 0.014127453,
      maxParallel: 0.014127453,
      maxCrossed: 0.007647502,
      maxPolA0: 0.00836935,
      maxPolA90: 0.010324168,
      maxAnaP0: 0.005523842,
      maxAnaP90: 0.004242092,
      checksum: 3.346959864,
      p0: [0.001949416, 0.003574758, 0.001949416, 0.003574758, 0.001949416, 0.004242092],
      p45: [6e-8, 0.004242092, 0.004242092, 6e-8, 0.003574758, 6e-8],
    },
  },
  {
    name: 'mm2-ED-i-amp',
    group: 'mm2',
    tensorType: 'ED',
    trType: 'i',
    amplitudes: { '\\chi_{zxx}': 2, '\\chi_{zyy}': 0.5 },
    phases: { '\\chi_{zxx}': 30 },
    expected: {
      dataLength: 180,
      maxIntensity: 2.232182421,
      maxParallel: 2.216619292,
      maxCrossed: 1.448424789,
      maxPolA0: 2.038281155,
      maxPolA90: 2.232182421,
      maxAnaP0: 2.054762944,
      maxAnaP90: 2.176718056,
      checksum: 997.124786062,
      p0: [2.03143501, 0.053212704, 2.03143501, 0.053212704, 2.03143501, 0.025916594],
      p45: [2.176718056, 0.025916594, 0.025916594, 2.176718056, 0.053212704, 2.176718056],
    },
  },
];
