import { Info } from 'lucide-react';
import { isCentrosymmetric } from '../services/tensorCalculator';
import type { TensorType, TensorTimeReversal } from '../services/tensorCalculator';
import type { PointGroupData } from '../data/pointGroups';

/**
 * The shared reason a tensor configuration produces no components: the two symmetry-forbidden cases
 * (centrosymmetric ED i-type; grey-group c-type). Returns `null` when neither applies, so callers
 * supply their own fallback (`?? 'No non-zero components…'` in the recovery fallback, `?? ''` in the
 * Simulator's zero-intensity state). Hoisted here because these two strings were copy-pasted across
 * CalculatorPage, TensorComponentControls, and PolarimetrySection.
 */
export function zeroStateReason(
  tensorType: TensorType,
  groupName: string,
  groupType: PointGroupData['type'],
  timeReversal: TensorTimeReversal,
): string | null {
  if (tensorType === 'ED' && isCentrosymmetric(groupName) && timeReversal === 'i')
    return 'ED SHG is symmetry-forbidden for centrosymmetric groups (i-type).';
  if (groupType === 'II' && timeReversal === 'c') return "c-type tensors vanish for grey groups (G1').";
  return null;
}

interface NoComponentsFallbackProps {
  tensorType: TensorType;
  setTensorType: (t: TensorType) => void;
  timeReversal: TensorTimeReversal;
  setTimeReversal: (t: TensorTimeReversal) => void;
  groupName: string;
  groupType: PointGroupData['type'];
  /** Wrapper classes — CalculatorPage and TensorComponentControls place the border/bg and the
   *  button-row indent differently, so the chrome is parameterized while the message + recovery
   *  buttons are shared. */
  outerClassName: string;
  infoClassName: string;
  buttonsClassName: string;
}

/**
 * The "no components — try another configuration" recovery block: a reason message plus buttons that
 * flip time-reversal / tensor type to a configuration that may allow a form. Shared by CalculatorPage
 * and TensorComponentControls (their wrapper chrome differs; see the className props).
 */
export function NoComponentsFallback({
  tensorType,
  setTensorType,
  timeReversal,
  setTimeReversal,
  groupName,
  groupType,
  outerClassName,
  infoClassName,
  buttonsClassName,
}: NoComponentsFallbackProps) {
  return (
    <div className={outerClassName}>
      <div className={infoClassName}>
        <Info className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
        <p className="text-sm leading-relaxed">
          {zeroStateReason(tensorType, groupName, groupType, timeReversal) ??
            'No non-zero components for this configuration.'}
        </p>
      </div>
      <div className={buttonsClassName}>
        {timeReversal === 'i' && (
          <button
            onClick={() => setTimeReversal('c')}
            className="px-3 py-1.5 text-xs border border-ink border-opacity-20 hover:bg-ink hover:text-paper transition-colors"
          >
            Try c-type
          </button>
        )}
        {timeReversal === 'c' && (
          <button
            onClick={() => setTimeReversal('i')}
            className="px-3 py-1.5 text-xs border border-ink border-opacity-20 hover:bg-ink hover:text-paper transition-colors"
          >
            Try i-type
          </button>
        )}
        {tensorType !== 'EQ' && (
          <button
            onClick={() => setTensorType('EQ')}
            className="px-3 py-1.5 text-xs border border-ink border-opacity-20 hover:bg-ink hover:text-paper transition-colors"
          >
            Try EQ
          </button>
        )}
        {tensorType !== 'MD' && (
          <button
            onClick={() => setTensorType('MD')}
            className="px-3 py-1.5 text-xs border border-ink border-opacity-20 hover:bg-ink hover:text-paper transition-colors"
          >
            Try MD
          </button>
        )}
      </div>
    </div>
  );
}
