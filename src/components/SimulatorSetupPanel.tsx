import { useState } from 'react';
import { InlineMath } from 'react-katex';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { getPresetsForSystem, KDirectionSelector } from './crystalCut';
import { TensorClassificationControl, TimeReversalControl } from './TensorSetupControls';
import { OrientationSceneView } from './OrientationSceneView';
import { TermInfo } from './TermInfo';
import type { PointGroupData } from '../data/pointGroups';
import type { TensorConfig, OrientationState } from '../types';
import type { useSimulatorState } from '../hooks/useSimulatorState';

interface SimulatorSetupPanelProps {
  selectedGroup: PointGroupData;
  tensorConfig: TensorConfig;
  orientation: OrientationState;
  labFrame: ReturnType<typeof useSimulatorState>['labFrame'];
  onNavigate?: (view: string, tab?: string) => void;
}

export function SimulatorSetupPanel({
  selectedGroup,
  tensorConfig,
  orientation,
  labFrame,
  onNavigate,
}: SimulatorSetupPanelProps) {
  const {
    type: selectedTensorType,
    setType: setSelectedTensorType,
    timeReversal: selectedTimeReversal,
    setTimeReversal: setSelectedTimeReversal,
    setting: selectedSetting,
  } = tensorConfig;
  const { thetaX, setThetaX, thetaY, setThetaY, psi0, setPsi0, phiX, setPhiX, phiY, setPhiY, psi, setPsi } =
    orientation;
  const [mobileSetupExpanded, setMobileSetupExpanded] = useState(false);
  const [showRotation, setShowRotation] = useState(phiX !== 0 || phiY !== 0 || psi !== 0);

  const rotationActive = phiX !== 0 || phiY !== 0 || psi !== 0;
  const activePreset = getPresetsForSystem(selectedGroup.crystalSystem, selectedSetting).find(
    (p) => p.tx === thetaX && p.ty === thetaY && p.psi0 === psi0,
  );

  return (
    // Trimmed bottom padding from md up: the last block there ends in the scene, whose canvas
    // already carries its own margin (it is sized for the rotation envelope, not for the resting
    // pose), so the full symmetric padding read as dead space under the picture.
    <div className="bg-white/50 border border-ink p-6 md:p-8 md:pb-5 space-y-8">
      {/* Mobile compact summary */}
      <button
        type="button"
        aria-expanded={mobileSetupExpanded}
        aria-controls="simulator-setup-controls"
        onClick={() => setMobileSetupExpanded(!mobileSetupExpanded)}
        className="md:hidden flex items-center justify-between w-full"
      >
        <span className="text-sm font-medium">
          <span className="text-xs">
            {selectedTensorType === 'ED' ? 'ED' : selectedTensorType === 'MD' ? 'MD' : 'EQ'}
          </span>
          <span className="opacity-50 mx-1">·</span>
          <span className="text-xs">{selectedTimeReversal}-type</span>
          <span className="opacity-50 mx-1">·</span>
          <span className="text-xs">{activePreset ? activePreset.label : 'Custom'}</span>
        </span>
        {mobileSetupExpanded ? (
          <ChevronUp className="w-4 h-4 opacity-50" />
        ) : (
          <ChevronDown className="w-4 h-4 opacity-50" />
        )}
      </button>

      {/* Full controls — always on desktop, expandable on mobile */}
      <div id="simulator-setup-controls" className={mobileSetupExpanded ? '' : 'hidden md:block'}>
        <div className="flex flex-col md:flex-row gap-8">
          <TensorClassificationControl
            value={selectedTensorType}
            onChange={setSelectedTensorType}
            onNavigate={onNavigate}
          />
          <TimeReversalControl
            value={selectedTimeReversal}
            onChange={setSelectedTimeReversal}
            onNavigate={onNavigate}
          />
        </div>

        <div className="border-t border-ink border-opacity-10 pt-6 mt-8">
          <KDirectionSelector
            crystalSystem={selectedGroup.crystalSystem}
            setting={selectedSetting}
            thetaX={thetaX}
            thetaY={thetaY}
            psi0={psi0}
            setThetaX={setThetaX}
            setThetaY={setThetaY}
            setPsi0={setPsi0}
            labFrame={labFrame}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* Two-column GRID rather than a flex row: the scene spans both rows and starts at the top of
          the header row, so its box is flush with "Crystal Rotation" instead of hanging one row
          lower. The header keeps its own row in column 1, so the collapse button and its info
          affordance are untouched — same element, same handlers, same aria-expanded. Column 2 is
          `auto`, so the scene sits hard against the panel's right edge and the slack lands between
          the two columns instead of dead beside the picture. */}
      <div className="hidden md:block border-t border-ink border-opacity-10 pt-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-7">
          <div className="col-start-1 row-start-1 flex max-w-2xl items-center gap-2">
            <button
              type="button"
              aria-expanded={showRotation}
              onClick={() => setShowRotation(!showRotation)}
              className="flex flex-1 items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/70 hover:text-ink transition-colors"
            >
              {showRotation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>Crystal Rotation</span>
              {rotationActive && !showRotation && (
                <span className="normal-case tracking-normal text-xs ml-2">
                  ({phiX !== 0 ? `φ_X = ${phiX}°` : ''}
                  {phiX !== 0 && (phiY !== 0 || psi !== 0) ? ', ' : ''}
                  {phiY !== 0 ? `φ_Y = ${phiY}°` : ''}
                  {(phiX !== 0 || phiY !== 0) && psi !== 0 ? ', ' : ''}
                  {psi !== 0 ? `ψ = ${psi}°` : ''})
                </span>
              )}
            </button>
            <TermInfo id="crystal-rotation" onNavigate={onNavigate} />
          </div>

          {showRotation && (
            <>
              {/* Capped, so the tracks stop growing rather than running the full column width. */}
              <div className="col-start-1 row-start-2 mt-4 min-w-0 max-w-2xl space-y-3">
                {(
                  [
                    {
                      label: '\\varphi_X',
                      value: phiX,
                      setValue: setPhiX,
                      min: -90,
                      max: 90,
                      desc: 'Tilt about lab-x',
                    },
                    {
                      label: '\\varphi_Y',
                      value: phiY,
                      setValue: setPhiY,
                      min: -90,
                      max: 90,
                      desc: 'Tilt about lab-y',
                    },
                    { label: '\\psi', value: psi, setValue: setPsi, min: -180, max: 180, desc: 'Azimuth about k' },
                  ] as const
                ).map(({ label, value, setValue, min, max, desc }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 shrink-0 text-right">
                      <InlineMath math={label} />
                    </div>
                    <input
                      aria-label={desc}
                      type="range"
                      min={min}
                      max={max}
                      step="1"
                      value={value}
                      onChange={(e) => setValue(parseFloat(e.target.value))}
                      className="flex-1 accent-ink"
                      title={desc}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        aria-label={desc}
                        type="number"
                        min={min}
                        max={max}
                        step="1"
                        value={value}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) setValue(Math.max(min, Math.min(max, v)));
                        }}
                        className="w-16 text-right text-xs font-mono bg-white/50 border border-ink/20 px-2 py-1 rounded-sm focus:border-ink/60"
                      />
                      <span className="text-xs text-ink/70">°</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setPhiX(0);
                    setPhiY(0);
                    setPsi(0);
                  }}
                  disabled={!rotationActive}
                  className="flex items-center gap-1.5 text-xs text-ink/70 hover:text-ink disabled:opacity-20 disabled:cursor-default transition-colors transition-opacity mt-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset rotation
                </button>
              </div>

              {/* The live picture of the same state. Row-spanning and self-start, so its top edge is
                flush with the section header. */}
              <div className="col-start-2 row-start-1 row-span-2 self-start">
                <OrientationSceneView
                  cutLabel={activePreset ? activePreset.label : 'Custom'}
                  thetaX={thetaX}
                  thetaY={thetaY}
                  psi0={psi0}
                  phiX={phiX}
                  phiY={phiY}
                  psi={psi}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
