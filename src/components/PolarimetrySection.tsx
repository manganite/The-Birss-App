import { useState, type ReactNode } from 'react';
import { Activity } from 'lucide-react';
import { InlineMath } from 'react-katex';
import { zeroStateReason } from './NoComponentsFallback';
import { SectionHeader } from './notation';
import { PolarimetryPlot } from './PolarimetryPlot';
import { TermInfo } from './TermInfo';
import type { PointGroupData } from '../data/pointGroups';
import type { TensorConfig } from '../types';
import type { useSimulatorState } from '../hooks/useSimulatorState';

interface PolarimetrySectionProps {
  selectedGroup: PointGroupData;
  tensorConfig: TensorConfig;
  independentComponents: string[];
  simulationData: ReturnType<typeof useSimulatorState>['simulationData'];
  onNavigate?: (view: string, tab?: string) => void;
}

type SimData = ReturnType<typeof useSimulatorState>['simulationData'];

interface DesktopPlotConfig {
  title: ReactNode;
  subtitle: string;
  dataKey: string;
  radarName: string;
  displayMaxKey: keyof Omit<SimData, 'data' | 'maxIntensity'>;
  labelPrefix: 'Polarizer' | 'Analyzer';
}

/** The two desktop plots per polarimetry tab. All share data + domainMax (=maxIntensity); only these
 *  fields vary — table-driven to remove six near-identical <PolarimetryPlot> invocations. */
const DESKTOP_PLOTS: Record<'anisotropy' | 'polarizer' | 'analyzer', DesktopPlotConfig[]> = {
  anisotropy: [
    {
      title: (
        <>
          Parallel (<InlineMath math="I_{\parallel}" />)
        </>
      ),
      subtitle: 'Polarizer ∥ Analyzer',
      dataKey: 'parallel',
      radarName: 'Parallel',
      displayMaxKey: 'maxParallel',
      labelPrefix: 'Polarizer',
    },
    {
      title: (
        <>
          Crossed (<InlineMath math="I_{\perp}" />)
        </>
      ),
      subtitle: 'Polarizer ⊥ Analyzer',
      dataKey: 'crossed',
      radarName: 'Crossed',
      displayMaxKey: 'maxCrossed',
      labelPrefix: 'Polarizer',
    },
  ],
  polarizer: [
    {
      title: 'Analyzer at 0°',
      subtitle: 'Fixed Analyzer',
      dataKey: 'pol_a0',
      radarName: 'Analyzer 0°',
      displayMaxKey: 'maxPolA0',
      labelPrefix: 'Polarizer',
    },
    {
      title: 'Analyzer at 90°',
      subtitle: 'Fixed Analyzer',
      dataKey: 'pol_a90',
      radarName: 'Analyzer 90°',
      displayMaxKey: 'maxPolA90',
      labelPrefix: 'Polarizer',
    },
  ],
  analyzer: [
    {
      title: 'Polarizer at 0°',
      subtitle: 'Fixed Polarizer',
      dataKey: 'ana_p0',
      radarName: 'Polarizer 0°',
      displayMaxKey: 'maxAnaP0',
      labelPrefix: 'Analyzer',
    },
    {
      title: 'Polarizer at 90°',
      subtitle: 'Fixed Polarizer',
      dataKey: 'ana_p90',
      radarName: 'Polarizer 90°',
      displayMaxKey: 'maxAnaP90',
      labelPrefix: 'Analyzer',
    },
  ],
};

export function PolarimetrySection({
  selectedGroup,
  tensorConfig,
  independentComponents,
  simulationData,
  onNavigate,
}: PolarimetrySectionProps) {
  const { type: selectedTensorType, timeReversal: selectedTimeReversal } = tensorConfig;
  const [activePolarimetryTab, setActivePolarimetryTab] = useState<'anisotropy' | 'polarizer' | 'analyzer'>(
    'anisotropy',
  );
  const [mobilePlotVariant, setMobilePlotVariant] = useState<'primary' | 'secondary'>('primary');

  const mobileDataKeyMap: Record<
    string,
    { primary: string; secondary: string; primaryLabel: string; secondaryLabel: string }
  > = {
    anisotropy: { primary: 'parallel', secondary: 'crossed', primaryLabel: '∥', secondaryLabel: '⊥' },
    polarizer: { primary: 'pol_a0', secondary: 'pol_a90', primaryLabel: 'Ana 0°', secondaryLabel: 'Ana 90°' },
    analyzer: { primary: 'ana_p0', secondary: 'ana_p90', primaryLabel: 'Pol 0°', secondaryLabel: 'Pol 90°' },
  };
  const mobileMap = mobileDataKeyMap[activePolarimetryTab];
  const mobileDataKey = mobilePlotVariant === 'primary' ? mobileMap.primary : mobileMap.secondary;
  const mobileDisplayMaxMap: Record<string, number> = {
    parallel: simulationData.maxParallel,
    crossed: simulationData.maxCrossed,
    pol_a0: simulationData.maxPolA0,
    pol_a90: simulationData.maxPolA90,
    ana_p0: simulationData.maxAnaP0,
    ana_p90: simulationData.maxAnaP90,
  };
  const mobilePlotTitle: Record<string, { primary: ReactNode; secondary: ReactNode }> = {
    anisotropy: {
      primary: (
        <>
          Parallel (<InlineMath math="I_{\parallel}" />)
        </>
      ),
      secondary: (
        <>
          Crossed (<InlineMath math="I_{\perp}" />)
        </>
      ),
    },
    polarizer: { primary: 'Analyzer at 0°', secondary: 'Analyzer at 90°' },
    analyzer: { primary: 'Polarizer at 0°', secondary: 'Polarizer at 90°' },
  };
  const mobilePlotSubtitle: Record<string, { primary: string; secondary: string }> = {
    anisotropy: { primary: 'Polarizer ∥ Analyzer', secondary: 'Polarizer ⊥ Analyzer' },
    polarizer: { primary: 'Fixed Analyzer', secondary: 'Fixed Analyzer' },
    analyzer: { primary: 'Fixed Polarizer', secondary: 'Fixed Polarizer' },
  };
  const mobileLabelPrefix: Record<string, 'Polarizer' | 'Analyzer'> = {
    anisotropy: 'Polarizer',
    polarizer: 'Polarizer',
    analyzer: 'Analyzer',
  };

  return (
    <div className="md:sticky md:top-20 self-start z-10 space-y-6">
      <SectionHeader icon={<Activity className="w-3 h-3" />}>
        SHG Intensity Polarimetry
        <TermInfo id="shg-polarimetry" onNavigate={onNavigate} />
      </SectionHeader>

      <div className="bg-white/50 border border-ink">
        {/* Tab Menu */}
        <div className="flex flex-wrap border-b border-ink border-opacity-20 bg-white/30">
          <div className={`flex items-center ${activePolarimetryTab === 'anisotropy' ? 'bg-ink text-paper' : ''}`}>
            <button
              onClick={() => setActivePolarimetryTab('anisotropy')}
              className={`px-4 md:px-6 py-4 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${activePolarimetryTab === 'anisotropy' ? '' : 'hover:bg-ink/5 text-ink/70'}`}
            >
              <span className="md:hidden">Aniso</span>
              <span className="hidden md:inline">Anisotropy</span>
            </button>
            <span className="px-1">
              <TermInfo id="anisotropy-config" onNavigate={onNavigate} />
            </span>
          </div>
          <div
            className={`flex items-center border-l border-ink border-opacity-10 ${activePolarimetryTab === 'polarizer' ? 'bg-ink text-paper' : ''}`}
          >
            <button
              onClick={() => setActivePolarimetryTab('polarizer')}
              className={`px-4 md:px-6 py-4 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${activePolarimetryTab === 'polarizer' ? '' : 'hover:bg-ink/5 text-ink/70'}`}
            >
              <span className="md:hidden">Pol</span>
              <span className="hidden md:inline">Polarizer</span>
            </button>
            <span className="px-1">
              <TermInfo id="polarizer-config" onNavigate={onNavigate} />
            </span>
          </div>
          <div
            className={`flex items-center border-l border-ink border-opacity-10 ${activePolarimetryTab === 'analyzer' ? 'bg-ink text-paper' : ''}`}
          >
            <button
              onClick={() => setActivePolarimetryTab('analyzer')}
              className={`px-4 md:px-6 py-4 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${activePolarimetryTab === 'analyzer' ? '' : 'hover:bg-ink/5 text-ink/70'}`}
            >
              <span className="md:hidden">Ana</span>
              <span className="hidden md:inline">Analyzer</span>
            </button>
            <span className="px-1">
              <TermInfo id="analyzer-config" onNavigate={onNavigate} />
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
          {independentComponents.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-sm text-ink/70">
              <span className="italic">Zero intensity</span>
              <span className="text-xs">
                {zeroStateReason(selectedTensorType, selectedGroup.name, selectedGroup.type, selectedTimeReversal) ??
                  ''}
              </span>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              {/* Mobile: ∥/⊥ toggle + single plot */}
              <div className="md:hidden space-y-4">
                <div className="flex justify-center border border-ink/20 rounded-sm overflow-hidden w-fit mx-auto">
                  <button
                    onClick={() => setMobilePlotVariant('primary')}
                    className={`px-3 py-1.5 text-xs transition-colors ${mobilePlotVariant === 'primary' ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'}`}
                  >
                    {mobileMap.primaryLabel}
                  </button>
                  <button
                    onClick={() => setMobilePlotVariant('secondary')}
                    className={`px-3 py-1.5 text-xs border-l border-ink/20 transition-colors ${mobilePlotVariant === 'secondary' ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'}`}
                  >
                    {mobileMap.secondaryLabel}
                  </button>
                </div>
                <PolarimetryPlot
                  title={mobilePlotTitle[activePolarimetryTab][mobilePlotVariant]}
                  subtitle={mobilePlotSubtitle[activePolarimetryTab][mobilePlotVariant]}
                  data={simulationData.data}
                  domainMax={simulationData.maxIntensity}
                  dataKey={mobileDataKey}
                  radarName={mobilePlotVariant === 'primary' ? 'Primary' : 'Secondary'}
                  displayMax={mobileDisplayMaxMap[mobileDataKey]}
                  labelPrefix={mobileLabelPrefix[activePolarimetryTab]}
                />
              </div>

              {/* Desktop: two plots side by side */}
              <div className="hidden md:grid md:grid-cols-2 gap-4 md:gap-6">
                {DESKTOP_PLOTS[activePolarimetryTab].map((p) => (
                  <PolarimetryPlot
                    key={p.dataKey}
                    title={p.title}
                    subtitle={p.subtitle}
                    data={simulationData.data}
                    domainMax={simulationData.maxIntensity}
                    dataKey={p.dataKey}
                    radarName={p.radarName}
                    displayMax={simulationData[p.displayMaxKey]}
                    labelPrefix={p.labelPrefix}
                  />
                ))}
              </div>

              {independentComponents.length > 0 && (
                <div className="mt-6 text-center text-xs text-ink/70">
                  Note: The angle shown in the plots represents the{' '}
                  {activePolarimetryTab === 'analyzer' ? 'analyzer' : 'polarizer'} angle. 0° corresponds to the Lab
                  X-axis, and 90° corresponds to the Lab Y-axis.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
