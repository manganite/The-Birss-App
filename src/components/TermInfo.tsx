import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { GLOSSARY_TERMS } from '../data/glossary';

interface TermInfoProps {
  id: string;
  onNavigate?: (view: string, tab?: string) => void;
}

const POPUP_WIDTH = 224; // w-56
const POPUP_EST_HEIGHT = 160; // enough for term + brief (+ optional "Learn more")
const GAP = 6;
const MARGIN = 8;

export function TermInfo({ id, onNavigate }: TermInfoProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const term = GLOSSARY_TERMS.find(t => t.id === id);

  // The popup is rendered through a portal on document.body (not inside the modal's scroll
  // container), so it is never clipped and never forces a scrollbar. Position is fixed, computed
  // from the trigger's viewport rect: below by default, flipped above when it would overflow the
  // bottom, and clamped to stay on screen. Any scroll/resize simply closes it.
  const openPopup = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(MARGIN, r.left), window.innerWidth - POPUP_WIDTH - MARGIN);
    const spaceBelow = window.innerHeight - r.bottom;
    const candidateTop = spaceBelow >= POPUP_EST_HEIGHT + GAP || spaceBelow >= r.top
      ? r.bottom + GAP
      : r.top - GAP - POPUP_EST_HEIGHT;
    const top = Math.min(Math.max(MARGIN, candidateTop), window.innerHeight - POPUP_EST_HEIGHT - MARGIN);
    setCoords({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popupRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    const onScrollResize = () => setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
    };
  }, [open]);

  if (!term) return null;

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={`About: ${term.term}`}
        onClick={(e) => { e.stopPropagation(); if (open) setOpen(false); else openPopup(); }}
        className="opacity-40 hover:opacity-80 transition-opacity leading-none"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && coords && createPortal(
        <div
          ref={popupRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: POPUP_WIDTH }}
          className="z-50 bg-paper text-ink border border-ink shadow-xl normal-case tracking-normal p-3 space-y-2 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold opacity-80">{term.term}</p>
          <p className="text-xs text-ink/70 leading-relaxed">{term.brief}</p>
          {term.helpTab && onNavigate && (
            <button
              type="button"
              onClick={() => { onNavigate('help', term.helpTab); setOpen(false); }}
              className="text-xs uppercase tracking-wider text-ink/70 hover:text-ink transition-colors"
            >
              Learn more →
            </button>
          )}
        </div>,
        document.body,
      )}
    </span>
  );
}
