import React, { useEffect, useMemo } from 'react';
import { PointGroupData } from '../data/pointGroups';
import {
  TensorType,
  TensorTimeReversal,
  getLabFrameVectors,
  calculateSHGExpressions,
  formatSubstitutedPolySum,
} from '../services/tensorCalculator';
import { buildSimulationData } from '../services/simulatorEngine';

export function useSimulatorState(
  selectedGroup: PointGroupData | null,
  selectedTensorType: TensorType,
  selectedTimeReversal: TensorTimeReversal,
  thetaX: number,
  thetaY: number,
  psi0: number,
  phiX: number,
  phiY: number,
  psi: number,
  selectedSetting: number,
  amplitudes: Record<string, number>,
  setAmplitudes: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  phases: Record<string, number>,
  setPhases: React.Dispatch<React.SetStateAction<Record<string, number>>>,
) {
  const labFrame = useMemo(
    () => getLabFrameVectors({ thetaX, thetaY, psi0, phiX, phiY, psi }),
    [thetaX, thetaY, psi0, phiX, phiY, psi],
  );

  const sourceTerms = useMemo(() => {
    if (!selectedGroup) return [];
    return calculateSHGExpressions({
      groupName: selectedGroup.name,
      tensorType: selectedTensorType,
      trType: selectedTimeReversal,
      thetaX,
      thetaY,
      psi0,
      phiX,
      phiY,
      psi,
      setting: selectedSetting,
      labFrameDisplayMode: 'E0_THETA',
    }).source;
  }, [selectedGroup, selectedTensorType, selectedTimeReversal, thetaX, thetaY, psi0, phiX, phiY, psi, selectedSetting]);

  const sourceTermsExEy = useMemo(() => {
    if (!selectedGroup) return [];
    return calculateSHGExpressions({
      groupName: selectedGroup.name,
      tensorType: selectedTensorType,
      trType: selectedTimeReversal,
      thetaX,
      thetaY,
      psi0,
      phiX,
      phiY,
      psi,
      setting: selectedSetting,
      labFrameDisplayMode: 'EX_EY',
    }).source;
  }, [selectedGroup, selectedTensorType, selectedTimeReversal, thetaX, thetaY, psi0, phiX, phiY, psi, selectedSetting]);

  const expandedFormulas = useMemo(() => {
    const sxTermTheta = sourceTerms.find((t) => t.component === 'S_X')?.rawPoly;
    const syTermTheta = sourceTerms.find((t) => t.component === 'S_Y')?.rawPoly;
    const sxTermExEy = sourceTermsExEy.find((t) => t.component === 'S_X')?.rawPoly;
    const syTermExEy = sourceTermsExEy.find((t) => t.component === 'S_Y')?.rawPoly;

    if (!sxTermTheta || !syTermTheta || !sxTermExEy || !syTermExEy) return null;

    const aniParStr = formatSubstitutedPolySum([
      { poly: sxTermTheta, mode: 'THETA', scale: 1, multiplyTrig: '\\cos\\theta' },
      { poly: syTermTheta, mode: 'THETA', scale: 1, multiplyTrig: '\\sin\\theta' },
    ]);

    const aniPerpStr = formatSubstitutedPolySum([
      { poly: sxTermTheta, mode: 'THETA', scale: -1, multiplyTrig: '\\sin\\theta' },
      { poly: syTermTheta, mode: 'THETA', scale: 1, multiplyTrig: '\\cos\\theta' },
    ]);

    const polA0Str = formatSubstitutedPolySum([{ poly: sxTermTheta, mode: 'THETA' }]);

    const polA90Str = formatSubstitutedPolySum([{ poly: syTermTheta, mode: 'THETA' }]);

    const anaP0Str = formatSubstitutedPolySum([
      { poly: sxTermExEy, mode: 'ZERO', scale: 1, multiplyTrig: '\\cos\\theta' },
      { poly: syTermExEy, mode: 'ZERO', scale: 1, multiplyTrig: '\\sin\\theta' },
    ]);

    const anaP90Str = formatSubstitutedPolySum([
      { poly: sxTermExEy, mode: 'NINETY', scale: 1, multiplyTrig: '\\cos\\theta' },
      { poly: syTermExEy, mode: 'NINETY', scale: 1, multiplyTrig: '\\sin\\theta' },
    ]);

    return {
      aniPar: `I_{\\parallel} = |${aniParStr}|^2`,
      aniPerp: `I_{\\perp} = |${aniPerpStr}|^2`,
      polA0: `I = |${polA0Str}|^2`,
      polA90: `I = |${polA90Str}|^2`,
      anaP0: `I = |${anaP0Str}|^2`,
      anaP90: `I = |${anaP90Str}|^2`,
    };
  }, [sourceTerms, sourceTermsExEy]);

  // Extract unique independent tensor components from the raw polynomials
  const independentComponents = useMemo(() => {
    const components = new Set<string>();
    sourceTerms.forEach((term) => {
      if ((term.component === 'S_X' || term.component === 'S_Y') && term.rawPoly) {
        for (const [chi, pairMap] of term.rawPoly.entries()) {
          let hasNonZero = false;
          for (const coeff of pairMap.values()) {
            if (Math.abs(coeff) > 1e-6) {
              hasNonZero = true;
              break;
            }
          }
          if (hasNonZero) {
            components.add(chi);
          }
        }
      }
    });
    return Array.from(components).sort();
  }, [sourceTerms]);

  // Initialize amplitudes and phases when components change
  useEffect(() => {
    setAmplitudes((prev) => {
      const next = { ...prev };
      independentComponents.forEach((comp) => {
        if (next[comp] === undefined) next[comp] = 1;
      });
      return next;
    });
    setPhases((prev) => {
      const next = { ...prev };
      independentComponents.forEach((comp) => {
        if (next[comp] === undefined) next[comp] = 0;
      });
      return next;
    });
    // setAmplitudes/setPhases are useState dispatchers with stable identity (React guarantees this),
    // so they are intentionally omitted from the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [independentComponents]);

  const simulationData = useMemo(() => {
    const sXPoly = sourceTerms.find((t) => t.component === 'S_X')?.rawPoly;
    const sYPoly = sourceTerms.find((t) => t.component === 'S_Y')?.rawPoly;
    return buildSimulationData(sXPoly, sYPoly, amplitudes, phases);
  }, [sourceTerms, amplitudes, phases]);

  return { labFrame, sourceTerms, sourceTermsExEy, expandedFormulas, independentComponents, simulationData };
}
