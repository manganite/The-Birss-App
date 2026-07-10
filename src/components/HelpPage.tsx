import React, { useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { BookOpen, Compass, Layers, Zap, Info, Activity, Table2, LucideIcon } from 'lucide-react';

const FEATURES: { icon: LucideIcon; title: string; description: string; extra?: React.ReactNode }[] = [
  {
    icon: Layers,
    title: 'Explorer',
    description: 'Browse all 122 crystallographic magnetic point groups. Filter by crystal system, group type (Ordinary, Gray, Black & White), and view their symmetry operations and properties. Each crystal system shows an info panel with lattice conditions, defining symmetry, and convention notes.',
  },
  {
    icon: Zap,
    title: 'Calculator',
    description: 'Calculate non-zero tensor components for various physical properties (Electric Dipole, Magnetic Dipole, Electric Quadrupole) under different point group symmetries. Supports time-reversal symmetry toggles for magnetic groups. A global BIRSS | ITC toggle in the header switches the symbol convention app-wide; a setting selector in the group header switches between alternate crystal settings.',
  },
  {
    icon: Activity,
    title: 'Simulator',
    description: 'Visualize expected SHG intensity polarimetry patterns. Adjust crystal orientation, tensor component amplitudes, and phases to simulate various polarization configurations.',
    extra: (
      <ul className="text-sm opacity-70 list-disc list-inside space-y-1 ml-4">
        <li><strong>Anisotropy:</strong> Parallel and Crossed configurations as a function of polarizer angle.</li>
        <li><strong>Polarizer:</strong> Fixed analyzer at 0° and 90°, as a function of polarizer angle.</li>
        <li><strong>Analyzer:</strong> Fixed polarizer at 0° and 90°, as a function of analyzer angle.</li>
      </ul>
    ),
  },
  {
    icon: Table2,
    title: 'Tables',
    description: 'Interactive lookup in the Birss tables: choose any tensor by rank (0–4), spatial parity (polar/axial) and time parity (i/c), plus intrinsic index symmetry where meaningful, and see its symmetry-reduced form for the selected group. Effects like piezoelectricity or the linear magnetoelectric effect can be selected directly, with their defining equations. The lookup chain (family class, reference axes, table row) mirrors the manual two-step lookup in the book.',
  },
];

const TENSOR_TYPES: { title: string; description: React.ReactNode }[] = [
  {
    title: 'Polar Tensors',
    description: <>Transform like standard vectors under spatial inversion (<InlineMath math="\vec{r} \to -\vec{r}" />). Examples include electric dipole moments and polarization. Odd-rank polar tensors strictly vanish in centrosymmetric point groups.</>,
  },
  {
    title: 'Axial Tensors',
    description: <>Also known as pseudotensors. They do not change sign under spatial inversion (e.g., magnetic moments, angular momentum). Odd-rank axial tensors can survive in centrosymmetric groups.</>,
  },
  {
    title: 'Time Reversal',
    description: <>Tensors can be symmetric (i-type) or anti-symmetric (c-type) under time reversal (<InlineMath math="t \to -t" />). Magnetic properties are typically c-type, while electric properties are i-type.<br/><span className="italic">Deep dive: i-type vs. c-type tensors → Deeper Topics.</span></>,
  },
];

const GROUP_TYPES: { title: string; description: React.ReactNode }[] = [
  {
    title: 'Type I — Ordinary',
    description: <>No time reversal in the group: the 32 classical (colourless) point groups.</>,
  },
  {
    title: 'Type II — Gray',
    description: <>Time reversal <InlineMath math="1'" /> is itself a symmetry element (<InlineMath math="G + G1'" />): all c-type (time-odd) tensors vanish; paramagnetic/diamagnetic phases.</>,
  },
  {
    title: 'Type III — Black & White',
    description: <>Time reversal appears only combined with rotations/mirrors (primed operations): magnetically ordered phases; time-odd tensor components can survive.</>,
  },
];

const SHG_MULTIPOLES: { title: string; description: React.ReactNode }[] = [
  {
    title: 'Electric Dipole (ED)',
    description: <>The leading-order contribution. It is a polar 3rd-rank tensor (<InlineMath math="\chi^{(2)}_{ijk}" />). Because it is odd under spatial inversion, ED SHG strictly vanishes in centrosymmetric materials, making it a powerful probe for broken inversion symmetry.</>,
  },
  {
    title: 'Magnetic Dipole (MD)',
    description: <>A higher-order axial 3rd-rank tensor. Unlike ED, MD contributions do not necessarily vanish in centrosymmetric point groups — odd-rank axial tensors pick up an extra sign under inversion relative to polar ones, a parity effect independent of whether time-reversal symmetry is broken. This is what makes MD SHG a useful, if weaker, probe in centrosymmetric antiferromagnets such as NiO and CoO.</>,
  },
  {
    title: 'Electric Quadrupole (EQ)',
    description: <>A higher-order polar 4th-rank tensor (<InlineMath math="\chi^{(2)}_{ijkl}" />). Because it is an even-rank tensor, EQ SHG survives inversion symmetry and can generate bulk SHG signals even in centrosymmetric crystals.</>,
  },
];

const REFERENCES: { href: string; title: string; description: string; openAccess?: boolean }[] = [
  {
    href: 'https://doi.org/10.1107/97809553602060000114',
    title: 'International Tables for Crystallography',
    description: 'Volume A: Space-group symmetry. General crystal symmetry aspects and point group definitions.',
  },
  {
    href: 'https://ethz.ch/content/dam/ethz/special-interest/matl/multi-ferroic-materials-dam/documents/education/Nonlinear%20Optics%20on%20Ferroic%20Materials/Birss%20Symmetry%20&%20Magnetism%20komplett.pdf',
    title: 'Symmetry and Magnetism',
    description: 'Birss, R. R. (1966). Comprehensive derivation of magnetic point groups and tensor properties. The tables used by this app are transcribed and included in the project repository (birss-tables/); most are print-verified.',
    openAccess: true,
  },
  {
    href: 'https://archive.org/details/yu.-i.-sirotin-m.-p.-shaskolskaya-fundamentals-of-crystal-physics-mir-1982',
    title: 'Fundamentals of Crystal Physics',
    description: "Sirotin, Yu. I. & Shaskol'skaya, M. P. (1982). Standard reference tables for tensor properties of crystals under point-group symmetry.",
    openAccess: true,
  },
  {
    href: 'https://doi.org/10.1002/9783527621156',
    title: 'Physical Properties of Crystals: An Introduction',
    description: 'Haussuehl, S. (2007, Wiley-VCH; German original: Kristallphysik, 1983). Source of the Cartesian axis convention for the triclinic and monoclinic systems (IRE 1949 standard).',
  },
  {
    href: 'https://www.sciencedirect.com/book/9780123694706/nonlinear-optics',
    title: 'Nonlinear Optics',
    description: 'Boyd, R. W. (2008). 3rd ed. Appendix tables of nonvanishing d-tensor components by point-group symmetry.',
  },
  {
    href: 'https://doi.org/10.1103/PhysRev.130.919',
    title: 'Nonlinear Optical Properties of Solids',
    description: 'Pershan, P. S. (1963). Nonlinear optical multipole contributions.',
  },
  {
    href: 'https://doi.org/10.1007/s003400050650',
    title: 'Nonlinear spectroscopy of antiferromagnetics',
    description: 'Fröhlich, D., et al. (1999). Source term calculation.',
  },
  {
    href: 'https://doi.org/10.1070/PU1966v009n02ABEH002879',
    title: 'Macroscopic Symmetry and Properties of Crystals',
    description: 'V. A. Koptsik (1966). Shubnikov groups and their physical applications.',
  },
  {
    href: 'https://www.cryst.ehu.es/',
    title: 'Bilbao Crystallographic Server',
    description: 'Online tools for crystallography, magnetic symmetry, and group theory.',
    openAccess: true,
  },
  {
    href: 'https://doi.org/10.1364/JOSAB.22.000096',
    title: 'SHG as a Tool for Studying Electronic and Magnetic Structures of Crystals',
    description: 'Fiebig, M., Pavlov, V. V., & Pisarev, R. V. (2005). Review of magnetic SHG, including the Cr2O3 magnetoelectric tensor and its symmetry derivation. J. Opt. Soc. Am. B 22, 96.',
  },
];

type HelpTab = 'overview' | 'conventions' | 'physics' | 'simulation' | 'deeper';

const TABS: { id: HelpTab; label: string }[] = [
  { id: 'overview', label: 'Feature Overview' },
  { id: 'conventions', label: 'Notations & Conventions' },
  { id: 'physics', label: 'Physics & Group Theory' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'deeper', label: 'Deeper Topics' },
];

interface HelpPageProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function HelpPage({ activeTab: externalTab, onTabChange }: HelpPageProps = {}) {
  const [internalTab, setInternalTab] = useState<HelpTab>('overview');
  const activeTab: HelpTab = (externalTab && TABS.some(t => t.id === externalTab) ? externalTab as HelpTab : internalTab);
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
          {/* Feature Overview */}
          {activeTab === 'overview' && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {FEATURES.map((feature) => (
                  <div key={feature.title} className="p-6 border border-ink border-opacity-10 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                      <feature.icon className="w-4 h-4" />
                      {feature.title}
                    </div>
                    <p className="text-sm opacity-70 leading-relaxed">
                      {feature.description}
                    </p>
                    {feature.extra}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Conventions & Notations */}
          {activeTab === 'conventions' && (
            <section className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  Coordinate Systems
                </h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  The calculator uses the standard Cartesian coordinate system (x, y, z) for tensor components. The orientation of these axes relative to the crystallographic axes (a, b, c) depends on the crystal system:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium">Triclinic</h4>
                    <p className="text-xs opacity-70 leading-relaxed">
                      <InlineMath math="z \parallel c" />, <InlineMath math="y \parallel (c \times a) \parallel b^*" />, <InlineMath math="x = y \times z" /> (projection of <InlineMath math="a" /> onto the plane ⊥ <InlineMath math="c" />).
                    </p>
                  </div>
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium">Monoclinic</h4>
                    <p className="text-xs opacity-70 leading-relaxed">
                      Two frames, following the selected setting.<br/>
                      <strong>c-unique:</strong> <InlineMath math="z \parallel c" /> (unique axis), <InlineMath math="x \parallel a" />, <InlineMath math="y \parallel b^*" />.<br/>
                      <strong>b-unique:</strong> <InlineMath math="y \parallel b" /> (unique axis), <InlineMath math="z \parallel c" />, <InlineMath math="x \parallel a^*" />.
                    </p>
                  </div>
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium">Orthorhombic, Tetragonal, Cubic</h4>
                    <p className="text-xs opacity-70 leading-relaxed">
                      <InlineMath math="x \parallel [100]" />, <InlineMath math="y \parallel [010]" />, <InlineMath math="z \parallel [001]" />.
                    </p>
                  </div>
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium">Trigonal & Hexagonal</h4>
                    <p className="text-xs opacity-70 leading-relaxed">
                      The Cartesian axes are orthogonal, while the crystallographic axes (<InlineMath math="a_1, a_2" />) are separated by 120°.
                    </p>
                    <ul className="text-xs opacity-70 list-[circle] list-inside space-y-1">
                      <li><InlineMath math="z \parallel [001]" /> / <InlineMath math="[0001]" /> (c-axis)</li>
                      <li><InlineMath math="x \parallel [100]" /> / <InlineMath math="[2\bar{1}\bar{1}0]" /> (a-axis)</li>
                      <li><InlineMath math="y \parallel [120]" /> / <InlineMath math="[01\bar{1}0]" /> (orthogonal to x)</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm opacity-70 leading-relaxed mt-4">
                  The triclinic and monoclinic conventions follow the standard crystal-physics prescription (Haussuehl 1983, based on IRE 1949): <InlineMath math="z \parallel c" />, <InlineMath math="y \parallel (c \times a)" />, <InlineMath math="x = y \times z" />. The set of independent and zero tensor components does <strong>not</strong> depend on this choice, but the numeric component values — and therefore the orientation of simulated polarimetry patterns — <strong>do</strong>.
                </p>
                <p className="text-sm opacity-70 leading-relaxed mt-2">
                  <strong>Why there is no monoclinic-angle control:</strong> The angle <InlineMath math="\beta" /> does not enter the symmetry calculation directly. A crystal with a different <InlineMath math="\beta" /> is a different material with different tensor values, so it is represented by adjusting the relevant in-plane component values — not by a separate geometric control. Linear-optical effects such as birefringence, which do depend on <InlineMath math="\beta" />, are outside the scope of this symmetry calculator.
                </p>
                <p className="text-xs opacity-70 leading-relaxed italic">
                  For lattice conditions and defining symmetry per system, see the Explorer's per-crystal-system info panel.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Settings</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  Some magnetic point groups admit more than one valid orientation of their symmetry elements relative to the Cartesian axes; each valid choice is a <strong>setting</strong>. A different setting never changes which tensor components are independent or zero — only which axis labels they carry. Matching the setting of your reference data matters when comparing component values; it never changes whether an effect is allowed. Example: <InlineMath math="6'mm'" /> and <InlineMath math="6'm'm" /> are two settings of the same group, 30° apart.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  The app implements all settings via the similarity transform <InlineMath math="G' = S \cdot G \cdot S^{-1}" /> applied to the base generators. A setting selector appears in the group info header, shared by the Calculator and the Simulator, whenever a group has multiple settings, and the choice persists between the two views. No group has more than 3 settings.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  Buttons are labelled with the distinct HM symbol wherever the setting changes it (tetragonal/trigonal/hexagonal pairs, e.g. <InlineMath math="\bar{4}2m/\bar{4}m2" /> or <InlineMath math="6'mm'/6'm'm" />); where the short symbol is identical for every setting (orthorhombic, monoclinic), buttons instead read an axis word — c-unique, a-unique, or b-unique — plus that shared symbol.
                </p>
                <p className="text-xs opacity-70 leading-relaxed italic">
                  Deep dive: the three mechanisms behind these settings → Deeper Topics.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Symbol Conventions: Birss vs ITC</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  <strong>Convention</strong> is a separate choice from <strong>setting</strong> above: setting picks <em>which</em> physical frame is selected; convention only picks <em>which naming rule</em> labels that frame. Switching convention never changes the selected frame or any computed tensor value — only which symbol is displayed.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  The convention is a single global toggle (<strong>BIRSS | ITC</strong>) in the app header. It relabels group names app-wide — Explorer, search, Calculator, and Simulator — and opens newly selected groups on the active convention's standard frame. Toggling it while a group is already open keeps the current physical frame; it only relabels it.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  The two rules disagree on one point: for trigonal/hexagonal groups, Birss reads HM position 2 from the <InlineMath math="y" />-axis family, while ITC reads it from the <InlineMath math="x" /> (a-axis) family — the two families are 30° apart. This has three distinct effects:
                </p>
                <ul className="text-sm opacity-70 list-disc list-inside space-y-2 ml-4">
                  <li><strong>Mechanism-B trigonal/hexagonal pairs swap names:</strong> for a group like <InlineMath math="6'mm'" />, the app's default frame is Birss's <InlineMath math="6'mm'" /> and ITC's <InlineMath math="6'm'm" />; the alternate setting is Birss's <InlineMath math="6'm'm" /> and ITC's <InlineMath math="6'mm'" />. The physics is identical (labels swap; ITC mode opens the group on the setting ITC would call by the group's key); this covers the trigonal <InlineMath math="32/3m/\bar{3}m" /> family and the seven affected hexagonal groups.</li>
                  <li><strong>Tetragonal Mechanism-A pairs are convention-neutral:</strong> for groups like <InlineMath math="\bar{4}2m" />, the 4-fold makes the <InlineMath math="x" /> and <InlineMath math="y" /> secondary families equivalent, so Birss's and ITC's position-2 readings always agree — no label change in either mode.</li>
                  <li><InlineMath math="m'm'm" />: <strong>orthorhombic frame symbols are convention-independent</strong> (the c-unique frame is always <InlineMath math="m'm'm" />, the a-unique frame always <InlineMath math="mm'm'" />). The conventions differ only in which frame is the standard — Birss: c-unique (<InlineMath math="m'm'm" />); ITC: a-unique (<InlineMath math="mm'm'" />) — so the displayed group name follows the mode without relabelling any frame.</li>
                  <li><InlineMath math="6'/mm'm" />: <strong>the names swap exactly like the Mechanism-B pairs</strong> (setting 1 is Birss's <InlineMath math="6'/mm'm" /> and ITC's <InlineMath math="6'/mmm'" />), but this group opens on setting 1 in both conventions: both tabulated standards are the same physical frame.</li>
                </ul>
                <p className="text-sm opacity-70 leading-relaxed">
                  Monoclinic groups keep the same short symbol in both conventions (settings are labelled First/Second, i.e. c-unique/b-unique); only which setting opens by default differs — ITC mode opens on the b-unique (Second) setting.
                </p>
                <p className="text-xs opacity-70 leading-relaxed italic">
                  Deep dive: reading Birss's parentheses → Deeper Topics.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">The Birss lookup chain</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  Birss's tables answer tensor-form questions in two steps: a group is first mapped to its classical family class with fixed reference-axis orientations (Table 4a), and that class selects a row in the rank-specific form tables (4b–4f). The Tables page shows this chain as a breadcrumb above each result, so the app lookup and the manual book lookup stay recognizably the same procedure.
                </p>
                <p className="text-xs opacity-70 leading-relaxed italic">
                  Forms for every rank are verified against the printed tables — see Deeper Topics → References.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Symmetry Operations
                </h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  Symmetry operations are denoted using standard Hermann-Mauguin notation:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium"><InlineMath math="\bar{1}, \bar{4}" /> — Overbar</h4>
                    <p className="text-xs opacity-70 leading-relaxed">Indicates a roto-inversion axis (a rotation combined with spatial inversion).</p>
                  </div>
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium"><InlineMath math="2', m'" /> — Prime</h4>
                    <p className="text-xs opacity-70 leading-relaxed">Indicates an operation combined with time-reversal (anti-symmetry).</p>
                  </div>
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium"><InlineMath math="3_z^+, m_y" /> — Subscript</h4>
                    <p className="text-xs opacity-70 leading-relaxed">The operation's characteristic direction: the rotation axis for rotations and roto-inversions, the mirror normal for <InlineMath math="m" />. Cardinal directions are x, y, z; in-plane directions are given as the azimuth from +x in degrees (0–180°), e.g. <InlineMath math="m_{150^\circ}" /> is the mirror whose normal lies in the basal plane at 150° from x.</p>
                  </div>
                  <div className="p-4 border border-ink border-opacity-10 space-y-2">
                    <h4 className="font-medium"><InlineMath math="3^+ / 3^-" /> — Superscript</h4>
                    <p className="text-xs opacity-70 leading-relaxed">The rotation sense about the axis (right-hand rule: + counter-clockwise, − clockwise). Shown for rotations of order 3 and higher, where the two senses are distinct operations.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Physics Background */}
          {activeTab === 'physics' && (
            <section className="space-y-6">
              <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">Neumann's Principle</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  The fundamental principle underlying this calculator is Neumann's Principle, which states that the symmetry elements of any physical property of a crystal must include the symmetry elements of the point group of the crystal.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  Mathematically, if a crystal has a symmetry operation represented by a transformation matrix <InlineMath math="R" />, a property tensor <InlineMath math="T" /> must be invariant under this transformation:
                </p>
                <div className="text-center overflow-x-auto py-2">
                  <BlockMath math="T_{ijk\dots} = \varepsilon \cdot [\det(R)]^p \cdot R_{ia} R_{jb} R_{kc} \dots T_{abc\dots}" />
                </div>
                <p className="text-sm opacity-70 leading-relaxed">
                  The <InlineMath math="[\det(R)]^p" /> factor is the polar/axial distinction: <InlineMath math="p = 1" /> for axial (pseudo-)tensors, where it flips sign under improper operations (<InlineMath math="\det(R) = -1" />); <InlineMath math="p = 0" /> for polar tensors, where it has no effect. The <InlineMath math="\varepsilon" /> factor is the i-/c-type distinction: <InlineMath math="\varepsilon = -1" /> for c-type tensors when <InlineMath math="R" /> is combined with time reversal, and <InlineMath math="+1" /> otherwise. By applying this equation for all symmetry operations in a point group, we obtain a system of linear equations that constrains the tensor components, forcing some to be zero and others to be equal or related by signs.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">Tensor Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {TENSOR_TYPES.map((tensorType) => (
                    <div key={tensorType.title} className="p-4 border border-ink border-opacity-10 space-y-2">
                      <h4 className="font-medium">{tensorType.title}</h4>
                      <p className="text-xs opacity-70 leading-relaxed">
                        {tensorType.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">Group Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {GROUP_TYPES.map((groupType) => (
                    <div key={groupType.title} className="p-4 border border-ink border-opacity-10 space-y-2">
                      <h4 className="font-medium">{groupType.title}</h4>
                      <p className="text-xs opacity-70 leading-relaxed">
                        {groupType.description}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs opacity-70 leading-relaxed italic">
                  App numbering follows Bradley-Cracknell; colour names are the primary identifier.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Nonlinear Optics & SHG</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  <strong>Second Harmonic Generation (SHG)</strong> is a nonlinear optical process where two photons of frequency <InlineMath math="\omega" /> interact within a material to generate a single photon at twice the frequency (<InlineMath math="2\omega" />). The calculator focuses on three multipole contributions to this process:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SHG_MULTIPOLES.map((multipole) => (
                    <div key={multipole.title} className="p-4 border border-ink border-opacity-10 space-y-2">
                      <h4 className="font-medium">{multipole.title}</h4>
                      <p className="text-xs opacity-70 leading-relaxed">
                        {multipole.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">Source Terms & Transverse Fields</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  The incident light field induces multipole moments in the material. These induced moments act as the <strong>source terms</strong> (<InlineMath math="S_i" />) that radiate the SHG signal. The effective nonlinear source term (or effective polarization) is a combination of these different multipole contributions:
                </p>
                <div className="space-y-3 pl-4 border-l-2 border-ink border-opacity-20 my-4">
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Electric Dipole:</strong> Contributes directly (linearly) to the source term.<br/>
                    <span className="inline-block mt-1"><InlineMath math="S_i^{\text{ED}} \propto P_i" /></span>
                  </p>
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Magnetic Dipole:</strong> Contributes via the curl (rotation) of the induced magnetization.<br/>
                    <span className="inline-block mt-1"><InlineMath math="S_i^{\text{MD}} \propto (\nabla \times \vec{M})_i" /></span>
                  </p>
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Electric Quadrupole:</strong> Contributes via the divergence (spatial gradient) of the quadrupole tensor.<br/>
                    <span className="inline-block mt-1"><InlineMath math="S_i^{\text{EQ}} \propto -\nabla_j Q_{ij}" /></span>
                  </p>
                </div>
                <p className="text-sm opacity-70 leading-relaxed">
                  The calculator displays how the incoming electric field components (<InlineMath math="E_j, E_k" />) couple through the non-zero tensor components to generate these induced source terms.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  <strong>Longitudinal vs. Transverse:</strong> For light propagating along the Z-axis in the laboratory frame, the incoming electric field is purely <strong>transverse</strong> (<InlineMath math="E_X, E_Y \neq 0" />, <InlineMath math="E_Z = 0" />). The material may generate an induced polarization with a <strong>longitudinal</strong> component (<InlineMath math="S_Z \neq 0" />). However, an oscillating dipole does not radiate along its axis of oscillation. Therefore, only the transverse source components (<InlineMath math="S_X, S_Y" />) will emit SHG light in the forward (Z) direction.
                </p>
              </div>
            </section>
          )}

          {/* Simulation */}
          {activeTab === 'simulation' && (
            <section className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Workflow
                </h3>
                <ol className="text-sm opacity-70 list-decimal list-inside space-y-2 ml-4">
                  <li>Select the point group, tensor type, and time-reversal symmetry from the main controls.</li>
                  <li>Adjust the crystal tilt (<InlineMath math="\varphi_X, \varphi_Y" />) to set the incidence angle of the light, and the azimuth (<InlineMath math="\psi" />) to rotate the crystal about its surface normal.</li>
                  <li>The simulator automatically isolates the independent tensor components (<InlineMath math="\chi_{ijk\dots}" />) that contribute to the transverse source terms (<InlineMath math="S_X, S_Y" />).</li>
                  <li>Adjust the relative amplitude and phase of each independent tensor component using the sliders.</li>
                  <li>Switch between the <strong>Anisotropy</strong>, <strong>Polarizer</strong>, and <strong>Analyzer</strong> tabs to observe the resulting SHG intensity polarimetry patterns in the radar charts.</li>
                </ol>
              </div>

              <div className="p-4 border border-ink border-opacity-10 space-y-2">
                <h4 className="font-medium">Components & phases</h4>
                <p className="text-xs opacity-70 leading-relaxed">
                  Each independent tensor component enters with an adjustable relative amplitude and phase. The measured pattern is the squared modulus of a coherent sum, so relative phases matter: components interfere, and changing a phase can reshape or rotate lobes without changing any amplitude. Values are relative (arbitrary units); only ratios and phase differences affect the pattern shape.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  Physical Background
                </h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  In a typical SHG polarimetry experiment, linearly polarized light is incident on the crystal. The polarization of the incident light (polarizer) and the detected SHG light (analyzer) are rotated to probe the symmetry of the nonlinear susceptibility tensor. The simulator provides three distinct views:
                </p>
                <ul className="text-sm opacity-70 list-disc list-inside space-y-2 ml-4">
                  <li><strong>Anisotropy:</strong> The radar charts display the SHG intensity as the <strong>polarizer angle</strong> is rotated from <InlineMath math="0^\circ" /> to <InlineMath math="360^\circ" />.
                    <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                      <li><strong>Parallel Configuration:</strong> The polarizer and analyzer are aligned and rotate together.</li>
                      <li><strong>Crossed Configuration:</strong> The polarizer and analyzer are orthogonal (the analyzer is at <InlineMath math="+90^\circ" /> relative to the polarizer).</li>
                    </ul>
                  </li>
                  <li><strong>Polarizer:</strong> The analyzer is fixed at <InlineMath math="0^\circ" /> or <InlineMath math="90^\circ" />, and the intensity is plotted as a function of the <strong>polarizer angle</strong>.</li>
                  <li><strong>Analyzer:</strong> The polarizer is fixed at <InlineMath math="0^\circ" /> or <InlineMath math="90^\circ" />, and the intensity is plotted as a function of the <strong>analyzer angle</strong>.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Crystal Cut</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  <strong>Surface normal ∥ <InlineMath math="k" />.</strong> The cut presets choose which crystal direction faces the beam: the selected direction is aligned with the lab Z axis (<InlineMath math="k" />), the polarization plane is X/Y. Each preset aligns a Cartesian axis (x, y or z) or a symmetry diagonal; the button shows every valid designation (<InlineMath math="[hkl]" />, Cartesian axis, crystallographic axis). Additional tilts (<InlineMath math="\varphi_X, \varphi_Y" />) and the azimuth (<InlineMath math="\psi" />) are applied on top of the preset.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Crystal Rotation (Lab Frame)</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  The crystal orientation in the lab frame is controlled by a preset plus three continuous rotation angles:
                </p>
                <div className="space-y-3 pl-4 border-l-2 border-ink border-opacity-20 my-4">
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Preset (<InlineMath math="k \parallel [hkl]" />):</strong> Selects which crystal direction is aligned with the beam axis (lab Z). Defines <InlineMath math="R_{\text{preset}}" />.
                  </p>
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong><InlineMath math="\varphi_X, \varphi_Y" /> (tilt):</strong> Tilt the crystal surface away from normal incidence, rotating about the lab X and Y axes. Range: ±90°.
                  </p>
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong><InlineMath math="\psi" /> (azimuth):</strong> Rotate the crystal about its surface normal (crystal-tied azimuth). At zero tilt this coincides with the beam axis (lab Z). This is the in-plane rotation that sweeps the crystallographic directions through the polarizer plane. Range: ±180°.
                  </p>
                </div>
                <p className="text-sm opacity-70 leading-relaxed">
                  The full rotation matrix is <InlineMath math="R = R_y(\varphi_Y) \cdot R_x(\varphi_X) \cdot R_z(\psi) \cdot R_{\text{preset}}" />, applied right-to-left: the preset alignment first, then the crystal-tied azimuth <InlineMath math="\psi" />, then the lab-fixed tilts <InlineMath math="\varphi_X" /> and <InlineMath math="\varphi_Y" />. At <InlineMath math="\varphi_X = \varphi_Y = \psi = 0" />, the result is purely the preset alignment.
                </p>
              </div>

              <div className="p-6 bg-ink/5 border border-ink border-opacity-10 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">Calculating the Intensity</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  The polarizer sets the incident field direction (angle <InlineMath math="\theta_{pol}" />); the analyzer selects the detected component (angle <InlineMath math="\theta_{ana}" />). The incident field induces the transverse source terms <InlineMath math="S_X" />, <InlineMath math="S_Y" /> (see Physics → Source Terms & Transverse Fields); the detected signal is proportional to the source-term component along the analyzer. The Simulator's Mathematical Model box shows these formulas evaluated live for the selected group and orientation.
                </p>
                <div className="text-center overflow-x-auto py-2">
                  <BlockMath math="\vec{E}^{\omega} = E_0 (\cos\theta_{pol}, \sin\theta_{pol}, 0)" />
                </div>
                <div className="text-center overflow-x-auto py-2">
                  <BlockMath math="I(\theta_{pol}, \theta_{ana}) \propto |S_X(\theta_{pol})\cos\theta_{ana} + S_Y(\theta_{pol})\sin\theta_{ana}|^2" />
                </div>
                <p className="text-sm opacity-70 leading-relaxed">
                  Every plotted configuration is a specialization of this formula: Parallel (<InlineMath math="\theta_{ana} = \theta_{pol} = \theta" />), Crossed (<InlineMath math="\theta_{ana} = \theta_{pol} + 90^\circ" />), the Polarizer scans (<InlineMath math="\theta_{ana}" /> fixed at <InlineMath math="0^\circ" /> / <InlineMath math="90^\circ" />), and the Analyzer scans (<InlineMath math="\theta_{pol}" /> fixed at <InlineMath math="0^\circ" /> / <InlineMath math="90^\circ" />).
                </p>

                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-medium text-sm">Parallel Configuration</h4>
                    <div className="text-center overflow-x-auto py-2">
                      <BlockMath math="I_{\parallel} \propto |S_X\cos\theta + S_Y\sin\theta|^2" />
                    </div>
                    <p className="text-sm opacity-70 leading-relaxed">
                      with <InlineMath math="\theta = \theta_{pol} = \theta_{ana}" />.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-ink border-opacity-10">
                    <h4 className="font-medium text-sm">Crossed Configuration</h4>
                    <div className="text-center overflow-x-auto py-2">
                      <BlockMath math="I_{\perp} \propto |{-S_X\sin\theta + S_Y\cos\theta}|^2" />
                    </div>
                    <p className="text-sm opacity-70 leading-relaxed">
                      with <InlineMath math="\theta_{ana} = \theta + 90^\circ" />.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-ink border-opacity-10">
                    <h4 className="font-medium text-sm">Formula Simplification</h4>
                    <p className="text-sm opacity-70 leading-relaxed mt-1">
                      The expanded intensity formulas displayed in the simulator are mathematically simplified using power reduction and multiple-angle trigonometric identities (e.g., <InlineMath math="\sin^2\theta = \frac{1}{2}(1 - \cos 2\theta)" /> and <InlineMath math="\cos^3\theta = \frac{1}{4}(3\cos\theta + \cos 3\theta)" />).
                    </p>
                    <p className="text-sm opacity-70 leading-relaxed mt-2">
                      This converts the trigonometric polynomials into a harmonic Fourier series representation, making the rotational symmetries of the crystal lattice (like 2-fold, 3-fold, or 4-fold symmetry) immediately obvious. The harmonic form is preferred by default; the power form is used only when it is strictly shorter (fewer terms) for that particular component, and unnecessary minus signs are factored out of the absolute value expressions.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Deeper Topics */}
          {activeTab === 'deeper' && (
            <section className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">i-type vs. c-type Tensors</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  Every magnetic point group <InlineMath math="G" /> can be written as <InlineMath math="G = H + 1'(G - H)" />, where <InlineMath math="H" /> is the halving subgroup of elements that do not include time reversal, and <InlineMath math="1'" /> is the time-reversal operation.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  <strong>i-type (time-even):</strong> The tensor is invariant under <em>all</em> operations of <InlineMath math="G" />, including the time-reversed ones. Physically, i-type tensors describe properties that do not depend on the magnetic order — they survive even when the material is demagnetized. Example: the crystal structure contribution to SHG.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  <strong>c-type (time-odd):</strong> The tensor is invariant under <InlineMath math="H" /> but changes sign under the time-reversed operations. Physically, c-type tensors describe properties that reverse with the magnetic order. Example: the magnetization-induced SHG contribution that flips sign when the sample is demagnetized or the magnetic domains are reversed. For gray groups (<InlineMath math="G = H \times \{1, 1'\}" />), the c-type tensor is identically zero.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Why settings exist: the three mechanisms</h3>
                <div className="space-y-3 pl-4 border-l-2 border-ink border-opacity-20 my-4">
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Mechanism A (classical setting ambiguity):</strong> inherited from the spatial group — the two in-plane symmetry-direction sets carry <em>different</em> element types (e.g. 2-folds vs. mirrors in tetragonal <InlineMath math="\bar{4}2m" /> vs. <InlineMath math="\bar{4}m2" />).
                  </p>
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Mechanism B (time-reversal-broken equivalence):</strong> the two in-plane direction sets carry the <em>same</em> element type, so the non-magnetic parent has only one setting; priming one set but not the other (e.g. <InlineMath math="6'mm'" /> vs. <InlineMath math="6'm'm" />) breaks that equivalence.
                  </p>
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Axis orientation (orthorhombic):</strong> three settings (c-unique, a-unique, and b-unique) choosing which crystal axis carries the group's distinguished direction — the axis that differs from the other two. The distinction is either classical (the unique polar / 2-fold axis, e.g. <InlineMath math="mm2" />) or time-reversal-driven (the operation whose primed / un-primed status is unique, e.g. the un-primed 2-fold in <InlineMath math="2'2'2" />, or the primed mirror in <InlineMath math="mmm'" />). Groups whose three axes are equivalent — <InlineMath math="222" />, <InlineMath math="mmm" />, <InlineMath math="m'm'm'" />, and the gray forms <InlineMath math="2221'" />, <InlineMath math="mmm1'" /> — have a single setting only.
                  </p>
                  <p className="text-sm opacity-70 leading-relaxed">
                    <strong>Axis convention (monoclinic, 2 settings):</strong> not a different orientation but a different naming convention for the same physical axis choice — <em>First</em> (<InlineMath math="c" />-unique, Birss) and <em>Second</em> (<InlineMath math="b" />-unique, ITC).
                  </p>
                </div>
                <p className="text-sm opacity-70 leading-relaxed">
                  Mechanisms A and B never co-occur in the same group (one requires the two direction sets to differ in element type, the other requires them to match), and the orthorhombic/monoclinic axis mechanisms are unrelated to time reversal entirely — so the maximum is 3 settings, never 4.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Reading Birss's Parentheses</h3>
                <p className="text-sm opacity-70 leading-relaxed">
                  Birss's Table 7 marks some group symbols and tensor-form letters with parentheses -- e.g. <InlineMath math="(-6'2m')" /> -- to flag that the printed tensor form is expressed in axes rotated away from the row's standard orientation (30° for trigonal/hexagonal pairs, 45° for tetragonal). The bracket is a frame assertion, not decoration: the app's fixed-frame tensor output already accounts for it by direct projection, so no bracket-tracking step is needed at runtime. See <code className="text-xs">docs/references/BIRSS-ITC-CONVENTION-DIVERGENCES.md</code> for the full derivation.
                </p>
                <p className="text-sm opacity-70 leading-relaxed">
                  Two rows of Birss's own printed Table 7 omit brackets that its own generator column (Table 6) requires: <InlineMath math="(\bar{6}'2m')" /> (i-cells) and <InlineMath math="\bar{6}m'2'" /> (A- and c-cells). These are documented book printing errors -- the app's values for both groups are correct and independently verified against the book's own generators and against ITC Table 1.5.7.1.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-ink border-opacity-10">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  References
                </h3>
                <ul className="text-sm opacity-70 space-y-4 list-none">
                  {REFERENCES.map((reference) => (
                    <li key={reference.href} className="p-4 border border-ink border-opacity-10 hover:bg-ink/5 transition-colors">
                      <a href={reference.href} target="_blank" rel="noopener noreferrer" className="block space-y-1">
                        <span className="font-medium underline">
                          {reference.title}
                          {reference.openAccess && (
                            <span className="ml-2 text-xs uppercase tracking-widest text-ink/70 no-underline">Open Access</span>
                          )}
                        </span>
                        <span className="block opacity-80 text-xs">{reference.description}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-sm opacity-70">
                  <span className="font-medium">Sources & reference.</span> The same Birss tables and
                  convention notes the app is built on are available in full in the project
                  repository under{' '}
                  <a
                    href="https://github.com/manganite/birss-app/tree/main/birss-tables"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    birss-tables/
                  </a>
                  .
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
