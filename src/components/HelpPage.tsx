import { useState } from 'react';
import { TablesHelp } from './helpTables';
import { OverviewHelp } from './help/OverviewHelp';
import { ConventionsHelp } from './help/ConventionsHelp';
import { PhysicsHelp } from './help/PhysicsHelp';
import { SimulationHelp } from './help/SimulationHelp';
import { DeeperHelp } from './help/DeeperHelp';

type HelpTab = 'overview' | 'conventions' | 'physics' | 'simulation' | 'tables' | 'deeper';

const TABS: { id: HelpTab; label: string }[] = [
  { id: 'overview', label: 'Feature Overview' },
  { id: 'conventions', label: 'Notations & Conventions' },
  { id: 'physics', label: 'Physics & Group Theory' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'tables', label: 'Tables' },
  { id: 'deeper', label: 'Deeper Topics' },
];

interface HelpPageProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function HelpPage({ activeTab: externalTab, onTabChange }: HelpPageProps = {}) {
  const [internalTab, setInternalTab] = useState<HelpTab>('overview');
  const activeTab: HelpTab =
    externalTab && TABS.some((t) => t.id === externalTab) ? (externalTab as HelpTab) : internalTab;
  const setActiveTab = (tab: HelpTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-serif italic">Help & Documentation</h1>
        <p className="text-sm text-ink/70 leading-relaxed max-w-2xl">
          An overview of the features, conventions, and physical background used in the Tensor Calculator.
        </p>
      </div>

      <div className="bg-white/50 border border-ink overflow-hidden">
        {/* Tab Menu — desktop only */}
        <div className="hidden md:flex overflow-x-auto border-b border-ink border-opacity-20 bg-white/30 hide-scrollbar">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${i > 0 ? 'border-l border-ink border-opacity-10' : ''} ${
                activeTab === tab.id ? 'bg-ink text-paper' : 'hover:bg-ink/5 text-ink/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile tab selector */}
        <div className="md:hidden flex overflow-x-auto border-b border-ink border-opacity-20 bg-white/30 hide-scrollbar">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${i > 0 ? 'border-l border-ink border-opacity-10' : ''} ${
                activeTab === tab.id ? 'bg-ink text-paper' : 'hover:bg-ink/5 text-ink/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'overview' && <OverviewHelp />}
          {activeTab === 'conventions' && <ConventionsHelp />}
          {activeTab === 'physics' && <PhysicsHelp />}
          {activeTab === 'simulation' && <SimulationHelp />}
          {activeTab === 'tables' && <TablesHelp />}
          {activeTab === 'deeper' && <DeeperHelp />}
        </div>
      </div>
    </div>
  );
}
