/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Info, Layers, Zap, Hexagon, Box, Triangle, Minus, Compass, Github } from 'lucide-react';
import { POINT_GROUPS, PointGroupData } from './data/pointGroups';
import { 
  calculateTensorComponents, 
  TensorTimeReversal, 
  isCentrosymmetric,
  calculateSHGExpressions,
  SHGExpression,
  TensorType,
  getSymmetryOperations,
  formatCoeff
} from './services/tensorCalculator';
import { PointGroupExplorer } from './components/PointGroupExplorer';
import { FormatPointGroup, SymmetryOperation } from './components/MathComponents';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

function AxisOrientationInfo({ crystalSystem }: { crystalSystem: string }) {
  if (crystalSystem === 'Triclinic') return null;

  let content = null;
  switch (crystalSystem) {
    case 'Monoclinic':
      content = (
        <>
          <span className="font-mono font-medium">z</span> is the unique axis (parallel to the 2-fold axis or perpendicular to the mirror plane).
        </>
      );
      break;
    case 'Orthorhombic':
    case 'Tetragonal':
    case 'Cubic':
      content = (
        <>
          <span className="font-mono font-medium">x</span> ∥ <InlineMath math="[100]" />, <span className="font-mono font-medium">y</span> ∥ <InlineMath math="[010]" />, <span className="font-mono font-medium">z</span> ∥ <InlineMath math="[001]" />
        </>
      );
      break;
    case 'Trigonal':
    case 'Hexagonal':
      content = (
        <>
          <span className="font-mono font-medium">z</span> ∥ <InlineMath math="[001]" /> / <InlineMath math="[0001]" /> (c-axis)<br/>
          <span className="font-mono font-medium">x</span> ∥ <InlineMath math="[100]" /> / <InlineMath math="[2\bar{1}\bar{1}0]" /> (a-axis)<br/>
          <span className="font-mono font-medium">y</span> ∥ <InlineMath math="[120]" /> / <InlineMath math="[01\bar{1}0]" />
        </>
      );
      break;
  }

  if (!content) return null;

  return (
    <div className="p-4 border border-[#141414] border-opacity-10 space-y-2 bg-[#141414]/5">
      <p className="text-[10px] uppercase tracking-widest opacity-50 flex items-center gap-1.5">
        <Compass className="w-3 h-3" />
        Axis Orientation
      </p>
      <p className="text-xs leading-relaxed opacity-70">
        {content}
      </p>
    </div>
  );
}

function negateExpression(expr: string): string {
  if (expr === "0") return "0";
  let result = expr.trim();
  if (!result.startsWith('-') && !result.startsWith('+')) {
    result = '+' + result;
  }
  result = result.replace(/\+/g, 'TEMP_PLUS').replace(/-/g, '+').replace(/TEMP_PLUS/g, '-');
  result = result.replace(/^\+\s*/, '');
  result = result.replace(/\s*\+\s*/g, ' + ').replace(/\s*-\s*/g, ' - ');
  result = result.trim().replace(/^-\s*/, '-');
  return result;
}



function getLabFrameVectors(tx: number, ty: number) {
  const cx = Math.cos(tx * Math.PI / 180);
  const sx = Math.sin(tx * Math.PI / 180);
  const cy = Math.cos(ty * Math.PI / 180);
  const sy = Math.sin(ty * Math.PI / 180);

  const formatVec = (v: number[]) => {
    const terms = [];
    const labels = ['X', 'Y', 'Z'];
    for (let i = 0; i < 3; i++) {
      if (Math.abs(v[i]) > 1e-5) {
        const coeff = formatCoeff(v[i]);
        const sign = v[i] < 0 ? "-" : (terms.length > 0 ? "+" : "");
        terms.push(`${sign}${coeff}\\mathbf{${labels[i]}}_{LAB}`);
      }
    }
    return terms.length > 0 ? terms.join(" ") : "0";
  };

  // R maps Crystal to Lab: V_lab = R * V_cryst
  // So V_cryst = R^T * V_lab
  // x_crys = R_00 X_lab + R_10 Y_lab + R_20 Z_lab
  // y_crys = R_01 X_lab + R_11 Y_lab + R_21 Z_lab
  // z_crys = R_02 X_lab + R_12 Y_lab + R_22 Z_lab

  const x_crys = [cy, 0, -sy];
  const y_crys = [sx * sy, cx, sx * cy];
  const z_crys = [cx * sy, -sx, cx * cy];

  return {
    X: formatVec(x_crys),
    Y: formatVec(y_crys),
    Z: formatVec(z_crys)
  };
}

const TensorTerm = ({ term, isNull }: { term?: string; isNull: boolean; key?: any }) => {
  if (!term) return null;
  
  return (
    <span className={isNull ? 'opacity-30' : 'text-[#141414]'}>
      <InlineMath math={term} />
    </span>
  );
};

const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[’‘`´,]/g, "'") // Replace curly quotes, backticks, commas with standard apostrophe
    .replace(/\s+/g, "");     // Remove all spaces
};

type GroupCategory = 'All' | 'Ordinary' | 'Gray' | 'Black & White';

const getGroupCategory = (name: string): GroupCategory => {
  if (name.endsWith("1'")) return 'Gray';
  if (name.includes("'")) return 'Black & White';
  return 'Ordinary';
};

export default function App() {
  const [currentView, setCurrentView] = useState<'calculator' | 'explorer'>('calculator');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<GroupCategory>('All');
  const [selectedGroup, setSelectedGroup] = useState<PointGroupData | null>(null);
  const [selectedTensorType, setSelectedTensorType] = useState<'ED' | 'MD' | 'EQ'>('ED');
  const [selectedTimeReversal, setSelectedTimeReversal] = useState<TensorTimeReversal>('i');

  const filteredGroups = useMemo(() => {
    let groups = POINT_GROUPS;
    
    if (activeCategory !== 'All') {
      groups = groups.filter(pg => getGroupCategory(pg.name) === activeCategory);
    }

    if (searchQuery) {
      const normalizedQuery = normalizeString(searchQuery);
      groups = groups.filter(pg => 
        normalizeString(pg.name).includes(normalizedQuery) ||
        normalizeString(pg.crystalSystem).includes(normalizedQuery)
      );
    }
    
    return groups;
  }, [searchQuery, activeCategory]);

  const handleSelect = (group: PointGroupData) => {
    setSelectedGroup(group);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const getCrystalIcon = (system: string) => {
    switch (system.toLowerCase()) {
      case 'cubic': return <Box className="w-5 h-5" />;
      case 'hexagonal': return <Hexagon className="w-5 h-5" />;
      case 'trigonal': return <Triangle className="w-5 h-5" />;
      case 'tetragonal': return <Box className="w-5 h-5 scale-y-125" />;
      case 'orthorhombic': return <Box className="w-5 h-5 scale-x-125" />;
      case 'monoclinic': return <Box className="w-5 h-5 skew-x-12" />;
      case 'triclinic': return <Box className="w-5 h-5 skew-x-12 skew-y-6" />;
      default: return <Layers className="w-5 h-5" />;
    }
  };

  const currentComponents = useMemo(() => {
    if (!selectedGroup) return [];
    return calculateTensorComponents(selectedGroup.name, selectedTensorType, selectedTimeReversal);
  }, [selectedGroup, selectedTensorType, selectedTimeReversal]);

  const currentOperations = useMemo(() => {
    if (!selectedGroup) return [];
    return getSymmetryOperations(selectedGroup.name);
  }, [selectedGroup]);

  const [thetaX, setThetaX] = useState<number>(0);
  const [thetaY, setThetaY] = useState<number>(0);

  const tensorMeta = {
    ED: { label: 'Electric Dipole', rank: 'RANK 3', type: 'POLAR' },
    MD: { label: 'Magnetic Dipole', rank: 'RANK 3', type: 'AXIAL' },
    EQ: { label: 'Electric Quadrupole', rank: 'RANK 4', type: 'POLAR' },
  };

  const currentExpressions = calculateSHGExpressions(selectedGroup?.name || "", selectedTensorType, selectedTimeReversal, thetaX, thetaY);
  const labFrame = getLabFrameVectors(thetaX, thetaY);

  const sourceTerms = currentExpressions.source;
  const inducedTerms = currentExpressions.induced;

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-8 md:p-12 relative">
        <div className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
          <button 
            onClick={() => setCurrentView('calculator')}
            className={`transition-opacity ${currentView === 'calculator' ? 'opacity-100 font-bold border-b border-[#141414]' : 'opacity-50 hover:opacity-100'}`}
          >
            Calculator
          </button>
          <span className="opacity-30">/</span>
          <button 
            onClick={() => setCurrentView('explorer')}
            className={`transition-opacity ${currentView === 'explorer' ? 'opacity-100 font-bold border-b border-[#141414]' : 'opacity-50 hover:opacity-100'}`}
          >
            Explorer
          </button>
        </div>
        <a 
          href="https://github.com/manganite/birss-app" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="absolute top-8 right-8 md:top-12 md:right-12 opacity-50 hover:opacity-100 transition-opacity"
          title="View source on GitHub"
        >
          <Github className="w-6 h-6" />
        </a>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 mt-16 md:mt-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] opacity-50">
              <Zap className="w-3 h-3" />
              SHG TENSOR CALCULATOR
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tight leading-none">
              The Birss App
            </h1>
            <p className="max-w-xl text-sm opacity-70 leading-relaxed">
              Calculates non-zero susceptibility tensor components (Electric Dipole, Magnetic Dipole, Electric Quadrupole) and induced transverse Second Harmonic Generation (SHG) source terms for all 32 crystallographic and 122 magnetic point groups.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="flex items-center gap-2 border-b border-[#141414] pb-2 focus-within:border-opacity-100 border-opacity-30 transition-all">
              <Search className="w-4 h-4 opacity-50" />
              <input 
                type="text"
                placeholder="Search groups (e.g., 4/m, 4'/m, 11')"
                className="bg-transparent border-none outline-none w-full text-sm placeholder:opacity-30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
            </div>
            <p className="text-[10px] opacity-50 mt-2 leading-tight">
              Use an apostrophe (') for time-reversed elements (Black & White) and append 1' for Gray groups.
            </p>
            
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 w-full bg-[#E4E3E0] border border-[#141414] border-t-0 z-50 shadow-xl flex flex-col max-h-[400px]"
                >
                  <div className="p-2 border-b border-[#141414]/20 flex flex-wrap gap-1 bg-[#E4E3E0] sticky top-0 z-10">
                    {(['All', 'Ordinary', 'Gray', 'Black & White'] as GroupCategory[]).map(cat => (
                      <button
                        key={cat}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full transition-colors ${activeCategory === cat ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-transparent text-[#141414] hover:bg-[#141414]/10'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  
                  <div className="overflow-y-auto flex-1">
                    {filteredGroups.length > 0 ? filteredGroups.map(group => (
                      <button
                        key={group.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(group)}
                        className="w-full text-left p-3 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors flex justify-between items-center group border-b border-[#141414]/5 last:border-0"
                      >
                        <span className="text-lg font-serif italic"><FormatPointGroup name={group.name} /></span>
                        <span className="text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-100">{group.crystalSystem}</span>
                      </button>
                    )) : (
                      <div className="p-4 text-center text-xs opacity-50">No groups found</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 md:p-12">
        {currentView === 'explorer' ? (
          <PointGroupExplorer 
            onSelectGroupForCalculator={(group) => {
              setSelectedGroup(group);
              setCurrentView('calculator');
            }}
          />
        ) : !selectedGroup ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-24 h-24 border border-[#141414] border-dashed rounded-full flex items-center justify-center animate-spin-slow">
              <Layers className="w-8 h-8 opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-serif italic opacity-40">Select a point group to begin analysis</p>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-30">International Notation (Hermann-Mauguin)</p>
            </div>
          </div>
        ) : (
          <motion.div 
            key={selectedGroup.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
          >
            {/* Summary Sidebar */}
            <div className="space-y-12">
              <section className="space-y-6">
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Classification
                </div>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-5xl font-serif italic"><FormatPointGroup name={selectedGroup.name} /></h2>
                    <p className="text-xs uppercase tracking-widest opacity-50 mt-1">
                      {selectedGroup.type === 'I' ? 'Standard' : selectedGroup.type === 'II' ? 'Gray' : 'Magnetic'} Point Group
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-[#141414] border-opacity-10">
                    {getCrystalIcon(selectedGroup.crystalSystem)}
                    <div>
                      <p className="text-sm font-medium">{selectedGroup.crystalSystem}</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">Crystal System</p>
                    </div>
                  </div>
                  <div className={`p-4 border border-[#141414] ${isCentrosymmetric(selectedGroup.name) ? 'bg-[#141414] text-[#E4E3E0]' : 'border-opacity-10'}`}>
                    <p className="text-sm font-medium">
                      {isCentrosymmetric(selectedGroup.name) ? 'Centrosymmetric' : 'Non-Centrosymmetric'}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest opacity-50">Symmetry Type</p>
                  </div>
                  
                  <div className="p-4 border border-[#141414] border-opacity-10 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest opacity-50">Symmetry Operations ({currentOperations.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentOperations.map((op, i) => (
                        <SymmetryOperation key={i} symbol={op} />
                      ))}
                    </div>
                  </div>
                  
                  <AxisOrientationInfo crystalSystem={selectedGroup.crystalSystem} />
                </div>
              </section>
            </div>

            {/* Main Content: Tensor Components */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tensor Type Selector */}
              <div className="flex flex-col gap-6 border-b border-[#141414] border-opacity-10 pb-8">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Tensor Classification</p>
                  <div className="flex flex-wrap gap-3">
                    {(['ED', 'MD', 'EQ'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedTensorType(type)}
                        className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-all border border-[#141414] ${
                          selectedTensorType === type 
                            ? 'bg-[#141414] text-[#E4E3E0]' 
                            : 'hover:bg-[#141414] hover:text-[#E4E3E0] opacity-50 hover:opacity-100 border-opacity-20'
                        }`}
                      >
                        {tensorMeta[type].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Time-Reversal Symmetry</p>
                  <div className="flex gap-3">
                    {(['i', 'c'] as const).map((tr) => (
                      <button
                        key={tr}
                        onClick={() => setSelectedTimeReversal(tr)}
                        className={`px-6 py-2 text-[10px] uppercase tracking-[0.2em] transition-all border border-[#141414] ${
                          selectedTimeReversal === tr 
                            ? 'bg-[#141414] text-[#E4E3E0]' 
                            : 'hover:bg-[#141414] hover:text-[#E4E3E0] opacity-50 hover:opacity-100 border-opacity-20'
                        }`}
                      >
                        {tr === 'i' ? 'i-type (Time-Even)' : 'c-type (Time-Odd)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[10px] uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                {tensorMeta[selectedTensorType].label} Tensor ({tensorMeta[selectedTensorType].type})
              </div>
              
              <div className="bg-white/50 border border-[#141414] p-8 md:p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <h3 className="text-3xl font-serif italic">Non-zero Components</h3>
                  <div className="text-[10px] font-mono opacity-50">{tensorMeta[selectedTensorType].rank}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {currentComponents.map((comp, i) => {
                    const isNull = comp.toLowerCase().includes('zero') || comp.toLowerCase().includes('none') || comp.includes('not supported');
                    if (isNull) {
                      return (
                        <div key={i} className="group border-b border-[#141414] border-opacity-10 pb-4 hover:border-opacity-100 transition-all">
                          <div className="text-lg font-mono tracking-tighter opacity-30">
                            {comp}
                          </div>
                          <div className="text-[9px] uppercase tracking-[0.2em] opacity-30 mt-1 group-hover:opacity-100">
                            Null State
                          </div>
                        </div>
                      );
                    }
                    
                    const parts = comp.split('=').map(p => p.trim());
                    return (
                      <div key={i} className="group border-b border-[#141414] border-opacity-10 pb-4 hover:border-opacity-100 transition-all">
                        <div className="text-lg font-mono tracking-tighter flex flex-wrap items-baseline gap-2">
                          <TensorTerm term={parts[0]} isNull={false} />
                          {parts.length > 1 && parts.slice(1).map((part, pi) => (
                            <div key={pi} className="flex items-baseline gap-2">
                              <span className="text-xs opacity-30"><InlineMath math="=" /></span>
                              <TensorTerm term={part} isNull={false} />
                            </div>
                          ))}
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.2em] opacity-30 mt-1 group-hover:opacity-100">
                          Active Component
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedTensorType === 'ED' && isCentrosymmetric(selectedGroup.name) && (
                  <div className="p-6 border border-[#141414] border-dashed flex items-center gap-4 opacity-50">
                    <Info className="w-5 h-5" />
                    <p className="text-xs leading-relaxed italic">
                      In centrosymmetric point groups, all components of the second-order nonlinear susceptibility 
                      tensor <InlineMath math="\chi^{(2)}" /> (Electric Dipole) vanish under the inversion operation.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[10px] uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                <Compass className="w-3 h-3" />
                {selectedTensorType === 'ED' ? 'Induced Polarization' : selectedTensorType === 'MD' ? 'Induced Magnetization' : 'Induced Quadrupole'} (CRYSTAL FRAME)
              </div>

              <div className="bg-white/50 border border-[#141414] p-8 md:p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <h3 className="text-3xl font-serif italic">Induced Nonlinear Response</h3>
                  <div className="text-[10px] font-mono opacity-50">FULL FIELD COMPONENTS</div>
                </div>

                <div className="space-y-6">
                  {inducedTerms.map((expr, i) => {
                    const isNull = expr.expression === "0";
                    return (
                      <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 border-b border-[#141414] border-opacity-10 pb-4">
                        <div className="w-16 font-mono text-xl">
                          <TensorTerm term={expr.component} isNull={isNull} />
                        </div>
                        <div className="flex-1 font-mono text-xl tracking-tight overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
                          <span className="opacity-30 mr-4"><InlineMath math="=" /></span>
                          <TensorTerm term={expr.expression} isNull={isNull} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border border-[#141414] border-dashed text-[10px] uppercase tracking-widest opacity-60 leading-relaxed">
                  Note: This calculation assumes two identical input fields <InlineMath math="E(\omega)" />. 
                  The full electric field vector is considered for the induced response.
                </div>
              </div>

              <div className="text-[10px] uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                <Compass className="w-3 h-3" />
                Source Term Components S (Lab Frame)
              </div>

              <div className="bg-white/50 border border-[#141414] p-8 md:p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <h3 className="text-3xl font-serif italic">Effective Source Terms</h3>
                  <div className="text-[10px] font-mono opacity-50">
                    {selectedTensorType === 'ED' ? <InlineMath math="S \propto P" /> : selectedTensorType === 'MD' ? <InlineMath math="S \propto \nabla \times M" /> : <InlineMath math="S \propto \nabla \cdot Q" />}
                  </div>
                </div>

                <div className="space-y-6 border-b border-[#141414] border-opacity-10 pb-8">
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">
                      Select the direction of light propagation relative to the crystal axes
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: 'k || z', math: 'k \\parallel z', tx: 0, ty: 0 },
                        { label: 'k || x', math: 'k \\parallel x', tx: 0, ty: -90 },
                        { label: 'k || y', math: 'k \\parallel y', tx: 90, ty: 0 },
                        { label: 'k || xy', math: 'k \\parallel xy', tx: 90, ty: -45 },
                        { label: 'k || xz', math: 'k \\parallel xz', tx: 0, ty: -45 },
                        { label: 'k || yz', math: 'k \\parallel yz', tx: 45, ty: 0 },
                      ].map((ori) => (
                        <button
                          key={ori.label}
                          onClick={() => {
                            setThetaX(ori.tx);
                            setThetaY(ori.ty);
                          }}
                          className={`px-4 py-2 text-[12px] tracking-[0.1em] transition-all border border-[#141414] ${
                            thetaX === ori.tx && thetaY === ori.ty
                              ? 'bg-[#141414] text-[#E4E3E0]' 
                              : 'hover:bg-[#141414] hover:text-[#E4E3E0] opacity-50 hover:opacity-100 border-opacity-20'
                          }`}
                        >
                          <InlineMath math={ori.math} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 items-start mt-6">
                    <div className="flex-1 bg-[#141414]/5 p-4 border border-[#141414]/10 rounded-sm w-full">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-3">Crystal Orientation in Lab Frame</h4>
                      <div className="flex flex-col gap-3 text-sm font-mono">
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <InlineMath math={`\\mathbf{x}_{crys} = ${labFrame.X}`} />
                          <InlineMath math={`\\mathbf{y}_{crys} = ${labFrame.Y}`} />
                          <InlineMath math={`\\mathbf{z}_{crys} = ${labFrame.Z}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {sourceTerms.map((expr, i) => {
                    const isNull = expr.expression === "0";
                    return (
                      <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 border-b border-[#141414] border-opacity-10 pb-4">
                        <div className="w-16 font-mono text-xl">
                          <TensorTerm term={expr.component} isNull={isNull} />
                        </div>
                        <div className="flex-1 font-mono text-xl tracking-tight overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
                          <span className="opacity-30 mr-4"><InlineMath math="\propto" /></span>
                          <span className="opacity-50 mr-4"><TensorTerm term={expr.relation} isNull={isNull} /></span>
                          <span className="opacity-30 mr-4"><InlineMath math="=" /></span>
                          <TensorTerm term={expr.expression} isNull={isNull} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border border-[#141414] border-dashed text-[10px] uppercase tracking-widest opacity-60 leading-relaxed">
                  Note: The incoming light propagates along the Z-axis in the Lab Frame, meaning the electric field is purely transverse: <InlineMath math="\vec{E} = (E_X, E_Y, 0)" />.
                </div>
              </div>

              <div className="p-8 border border-[#141414] border-opacity-10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest">References</h4>
                {(selectedTensorType === 'MD' || selectedTensorType === 'EQ') && (
                  <p className="text-xs opacity-60 leading-relaxed">
                    {selectedTensorType === 'MD' && "Note: Magnetic Dipole (Axial 3rd rank) tensors do not necessarily vanish in centrosymmetric groups."}
                    {selectedTensorType === 'EQ' && "Note: Electric Quadrupole (Polar 4th rank) tensors survive inversion symmetry."}
                  </p>
                )}
                <ul className="text-xs opacity-60 space-y-3 list-disc list-inside mt-4">
                  <li className="pl-2">
                    <a href="https://doi.org/10.1107/97809553602060000114" target="_blank" rel="noreferrer" className="underline hover:opacity-100 font-medium">
                      International Tables for Crystallography
                    </a>
                    <span className="block ml-5 mt-0.5 opacity-80">General crystal symmetry aspects.</span>
                  </li>
                  <li className="pl-2">
                    <a href="https://ethz.ch/content/dam/ethz/special-interest/matl/multi-ferroic-materials-dam/documents/education/Nonlinear%20Optics%20on%20Ferroic%20Materials/Birss%20Symmetry%20&%20Magnetism%20komplett.pdf" target="_blank" rel="noreferrer" className="underline hover:opacity-100 font-medium">
                      Birss, R. R. (1966). Symmetry and Magnetism.
                    </a>
                    <span className="block ml-5 mt-0.5 opacity-80">Magnetic point groups and tensor component calculation.</span>
                  </li>
                  <li className="pl-2">
                    <a href="https://doi.org/10.1103/PhysRev.130.919" target="_blank" rel="noreferrer" className="underline hover:opacity-100 font-medium">
                      Pershan, P. S. (1963). Nonlinear Optical Properties of Solids.
                    </a>
                    <span className="block ml-5 mt-0.5 opacity-80">Nonlinear optical multipole contributions.</span>
                  </li>
                  <li className="pl-2">
                    <a href="https://doi.org/10.1007/s003400050650" target="_blank" rel="noreferrer" className="underline hover:opacity-100 font-medium">
                      Fröhlich, D., et al. (1999). Nonlinear spectroscopy of antiferromagnetics.
                    </a>
                    <span className="block ml-5 mt-0.5 opacity-80">Source term calculation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-[#141414] p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] opacity-30">
          The Birss App &copy; 2026
        </p>
      </footer>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
