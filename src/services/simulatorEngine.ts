/**
 * simulatorEngine.ts — the pure SHG-intensity polarimetry sweep behind the Simulator's radar charts.
 *
 * Extracted verbatim from `useSimulatorState`'s `simulationData` useMemo (audit M6): the hook keeps
 * the React memoization and the amplitude/phase state; the math lives here as a plain function with
 * no React dependency. Given the lab-frame source polynomials S_X, S_Y (from
 * `calculateSHGExpressions(..., labFrameDisplayMode: 'E0_THETA').source`) and the per-component
 * amplitude/phase maps, it sweeps the polarizer/analyzer angle 0…360° (2° steps) and returns the
 * per-angle intensities plus their maxima. Behaviour-preserving; pinned by simulatorEngine.fixtures.ts.
 */

type Poly = Map<string, Map<string, number>>;

// A type alias (not an interface) so TypeScript synthesizes an implicit `[key: string]: number`
// index signature — PolarimetryPlot indexes points by a dynamic `dataKey`, so its data prop needs it
// (the pre-extraction inline inferred type had this implicitly).
export type SimulationPoint = {
  angle: number;
  parallel: number;
  crossed: number;
  pol_a0: number;
  pol_a90: number;
  ana_p0: number;
  ana_p90: number;
};

export interface SimulationData {
  data: SimulationPoint[];
  maxIntensity: number;
  maxParallel: number;
  maxCrossed: number;
  maxPolA0: number;
  maxPolA90: number;
  maxAnaP0: number;
  maxAnaP90: number;
}

/**
 * Sweep the polarimetry intensities for the given lab-frame source polynomials and component
 * amplitude/phase maps. Returns the zero-shape (empty data, all maxima 0) when either source
 * polynomial is absent — i.e. the group has no S_X/S_Y source term.
 */
export function buildSimulationData(
  sXPoly: Poly | undefined,
  sYPoly: Poly | undefined,
  amplitudes: Record<string, number>,
  phases: Record<string, number>,
): SimulationData {
  const data: SimulationPoint[] = [];
  let maxIntensity = 0;
  let maxParallel = 0;
  let maxCrossed = 0;
  let maxPolA0 = 0;
  let maxPolA90 = 0;
  let maxAnaP0 = 0;
  let maxAnaP90 = 0;

  if (!sXPoly || !sYPoly)
    return {
      data: [],
      maxIntensity: 0,
      maxParallel: 0,
      maxCrossed: 0,
      maxPolA0: 0,
      maxPolA90: 0,
      maxAnaP0: 0,
      maxAnaP90: 0,
    };

  const evaluatePoly = (poly: Map<string, Map<string, number>>, Ex: number, Ey: number) => {
    let real = 0;
    let imag = 0;

    for (const [chi, pairMap] of poly.entries()) {
      const A = amplitudes[chi] ?? 1;
      const deltaDeg = phases[chi] ?? 0;
      const delta = (deltaDeg * Math.PI) / 180;

      const chiReal = A * Math.cos(delta);
      const chiImag = A * Math.sin(delta);

      let fieldFactor = 0;
      for (const [pair, coeff] of pairMap.entries()) {
        let E_val = 0;
        if (pair === '00') E_val = Ex * Ex;
        else if (pair === '11') E_val = Ey * Ey;
        else if (pair === '22')
          E_val = 0; // Ez = 0
        else if (pair === '01') E_val = Ex * Ey;
        else if (pair === '02') E_val = 0;
        else if (pair === '12') E_val = 0;

        fieldFactor += coeff * E_val;
      }

      real += chiReal * fieldFactor;
      imag += chiImag * fieldFactor;
    }
    return { real, imag };
  };

  const calcIntensity = (polRad: number, anaRad: number) => {
    const Ex = Math.cos(polRad);
    const Ey = Math.sin(polRad);
    const Sx = evaluatePoly(sXPoly, Ex, Ey);
    const Sy = evaluatePoly(sYPoly, Ex, Ey);

    const ax = Math.cos(anaRad);
    const ay = Math.sin(anaRad);
    const E_real = Sx.real * ax + Sy.real * ay;
    const E_imag = Sx.imag * ax + Sy.imag * ay;
    return E_real * E_real + E_imag * E_imag;
  };

  for (let angleDeg = 0; angleDeg < 360; angleDeg += 2) {
    const angleRad = (angleDeg * Math.PI) / 180;

    // 1. Anisotropy (angle = polarizer angle, analyzer = angle or angle + 90)
    const I_par = calcIntensity(angleRad, angleRad);
    const I_perp = calcIntensity(angleRad, angleRad + Math.PI / 2);

    // 2. Polarizer (angle = polarizer angle, analyzer = 0 or 90)
    const I_pol_a0 = calcIntensity(angleRad, 0);
    const I_pol_a90 = calcIntensity(angleRad, Math.PI / 2);

    // 3. Analyzer (angle = analyzer angle, polarizer = 0 or 90)
    const I_ana_p0 = calcIntensity(0, angleRad);
    const I_ana_p90 = calcIntensity(Math.PI / 2, angleRad);

    maxIntensity = Math.max(maxIntensity, I_par, I_perp, I_pol_a0, I_pol_a90, I_ana_p0, I_ana_p90);
    maxParallel = Math.max(maxParallel, I_par);
    maxCrossed = Math.max(maxCrossed, I_perp);
    maxPolA0 = Math.max(maxPolA0, I_pol_a0);
    maxPolA90 = Math.max(maxPolA90, I_pol_a90);
    maxAnaP0 = Math.max(maxAnaP0, I_ana_p0);
    maxAnaP90 = Math.max(maxAnaP90, I_ana_p90);

    data.push({
      angle: angleDeg,
      parallel: I_par,
      crossed: I_perp,
      pol_a0: I_pol_a0,
      pol_a90: I_pol_a90,
      ana_p0: I_ana_p0,
      ana_p90: I_ana_p90,
    });
  }

  return { data, maxIntensity, maxParallel, maxCrossed, maxPolA0, maxPolA90, maxAnaP0, maxAnaP90 };
}
