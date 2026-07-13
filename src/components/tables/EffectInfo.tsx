import { InlineMath, BlockMath } from 'react-katex';
import type { TensorEffect } from '../../data/tensorEffects';

/** Render a string that may contain inline `$...$` LaTeX segments (used for effect blurbs). */
function MathText({ text }: { text: string }) {
  return (
    <>
      {text.split('$').map((seg, i) => (i % 2 === 1 ? <InlineMath key={i} math={seg} /> : <span key={i}>{seg}</span>))}
    </>
  );
}

/** Effect info: label, blurb, defining equation (effect mode only). */
export function EffectInfo({ effect }: { effect: TensorEffect }) {
  return (
    <div className="border border-ink/10 bg-white/30 p-5 space-y-2">
      <h3 className="text-base font-medium flex items-baseline gap-2">
        <InlineMath math={effect.symbol} /> · {effect.label}
      </h3>
      <p className="text-sm text-ink/70 leading-relaxed">
        <MathText text={effect.blurb} />
      </p>
      {effect.equation && (
        <div className="py-1">
          <BlockMath math={effect.equation} />
        </div>
      )}
      <p className="text-xs text-ink/40">{effect.reference}</p>
    </div>
  );
}
