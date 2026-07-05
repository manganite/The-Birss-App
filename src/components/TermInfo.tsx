import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { GLOSSARY_TERMS } from '../data/glossary';

interface TermInfoProps {
  id: string;
  onNavigate?: (view: string, tab?: string) => void;
}

export function TermInfo({ id, onNavigate }: TermInfoProps) {
  const [open, setOpen] = useState(false);
  const term = GLOSSARY_TERMS.find(t => t.id === id);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!term) return null;

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`About: ${term.term}`}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="opacity-40 hover:opacity-80 transition-opacity leading-none"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-5 left-0 z-20 w-56 bg-paper border border-ink shadow-xl normal-case tracking-normal p-3 space-y-2 text-left">
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
          </div>
        </>
      )}
    </span>
  );
}
