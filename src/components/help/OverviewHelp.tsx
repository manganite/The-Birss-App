import React from 'react';
import { Layers, Zap, Activity, Table2, LucideIcon } from 'lucide-react';

const FEATURES: { icon: LucideIcon; title: string; description: string; extra?: React.ReactNode }[] = [
  {
    icon: Layers,
    title: 'Explorer',
    description:
      'Browse all 122 crystallographic magnetic point groups. Filter by crystal system, group type (Ordinary, Gray, Black & White), and view their symmetry operations and properties. Each crystal system shows an info panel with lattice conditions, defining symmetry, and convention notes.',
  },
  {
    icon: Zap,
    title: 'Calculator',
    description:
      'Calculate non-zero tensor components for various physical properties (Electric Dipole, Magnetic Dipole, Electric Quadrupole) under different point group symmetries. Supports time-reversal symmetry toggles for magnetic groups. A global BIRSS | ITC toggle in the header switches the symbol convention app-wide; a setting selector in the group header switches between alternate crystal settings.',
  },
  {
    icon: Activity,
    title: 'Simulator',
    description:
      'Visualize expected SHG intensity polarimetry patterns. Adjust crystal orientation, tensor component amplitudes, and phases to simulate various polarization configurations.',
    extra: (
      <ul className="text-sm opacity-70 list-disc list-inside space-y-1 ml-4">
        <li>
          <strong>Anisotropy:</strong> Parallel and Crossed configurations as a function of polarizer angle.
        </li>
        <li>
          <strong>Polarizer:</strong> Fixed analyzer at 0° and 90°, as a function of polarizer angle.
        </li>
        <li>
          <strong>Analyzer:</strong> Fixed polarizer at 0° and 90°, as a function of analyzer angle.
        </li>
      </ul>
    ),
  },
  {
    icon: Table2,
    title: 'Tables',
    description:
      'Interactive lookup in the Birss tables: choose any tensor by rank (0–4), spatial parity (polar/axial) and time parity (i/c), plus intrinsic index symmetry where meaningful, and see its symmetry-reduced form for the selected group. Effects like piezoelectricity or the linear magnetoelectric effect can be selected directly, with their defining equations. The lookup chain (family class, reference axes, table row) mirrors the manual two-step lookup in the book.',
  },
];

/** The Overview tab of the Help page. */
export function OverviewHelp() {
  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="p-6 border border-ink border-opacity-10 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <feature.icon className="w-4 h-4" />
              {feature.title}
            </div>
            <p className="text-sm opacity-70 leading-relaxed">{feature.description}</p>
            {feature.extra}
          </div>
        ))}
      </div>
    </section>
  );
}
