import { type ReactNode } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Box, Hexagon, Triangle, Layers } from 'lucide-react';

export function SectionHeader({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h4 className="text-xs uppercase tracking-[0.2em] text-ink/70 flex items-center gap-2">
      {icon}
      {children}
    </h4>
  );
}

export const getCrystalIcon = (system: string) => {
  switch (system.toLowerCase()) {
    case 'cubic':
      return <Box className="w-5 h-5" />;
    case 'hexagonal':
      return <Hexagon className="w-5 h-5" />;
    case 'trigonal':
      return <Triangle className="w-5 h-5" />;
    case 'tetragonal':
      return <Box className="w-5 h-5 scale-y-125" />;
    case 'orthorhombic':
      return <Box className="w-5 h-5 scale-x-125" />;
    case 'monoclinic':
      return <Box className="w-5 h-5 skew-x-12" />;
    case 'triclinic':
      return <Box className="w-5 h-5 skew-x-12 skew-y-6" />;
    default:
      return <Layers className="w-5 h-5" />;
  }
};

export const TensorTerm = ({ term, isNull }: { term?: string; isNull: boolean }) => {
  if (!term) return null;

  return (
    <span className={isNull ? 'opacity-30' : 'text-ink'}>
      <InlineMath math={term} />
    </span>
  );
};

export const FormatPointGroup = ({ name }: { name: string }) => {
  const latex = name.replace(/-([1-6])/g, '\\bar{$1}');
  return <InlineMath math={latex} />;
};

const HM_SYMBOL_PATTERN = /^[-\d/m']+$/;

export const FormatGroupLabel = ({ label }: { label: string }) =>
  HM_SYMBOL_PATTERN.test(label) ? <FormatPointGroup name={label} /> : <>{label}</>;

export const FormatSchoenflies = ({ symbol }: { symbol: string }) => {
  const formatOne = (s: string) => {
    const m = s.match(/^([A-Z])(.+)$/);
    return m ? `${m[1]}_{${m[2]}}` : s;
  };
  const match = symbol.match(/^([A-Za-z0-9]+)(?:\(([A-Za-z0-9]+)\))?$/);
  if (!match) return <InlineMath math={symbol} />;
  const [, main, sub] = match;
  const latex = sub ? `${formatOne(main)}(${formatOne(sub)})` : formatOne(main);
  return <InlineMath math={latex} />;
};

export const SymmetryOperation = ({ symbol }: { symbol: string }) => {
  const match = symbol.match(/^(-?\d|m)(?:_([a-z\[\]0-9-°]+))?([⁺⁻])?(')?$/);
  if (!match)
    return (
      <span className="inline-flex items-center text-xs bg-white/50 px-2 py-1 border border-ink border-opacity-10 rounded-sm">
        <InlineMath math={symbol} />
      </span>
    );

  const [, base, axis, sign, prime] = match;

  let latex = '';

  if (base.startsWith('-')) {
    latex += `\\bar{${base.slice(1)}}`;
  } else {
    latex += base;
  }

  if (axis) {
    let cleanAxis = axis.replace('°', '^\\circ');
    latex += `_{${cleanAxis}}`;
  }

  let sup = '';
  if (sign === '⁺') sup += '+';
  if (sign === '⁻') sup += '-';
  if (prime) sup += '\\prime';

  if (sup) {
    latex += `^{${sup}}`;
  }

  return (
    <span className="inline-flex items-center text-xs bg-white/50 px-2 py-1 border border-ink border-opacity-10 rounded-sm">
      <InlineMath math={latex} />
    </span>
  );
};
