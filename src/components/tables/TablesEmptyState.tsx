import { Table2 } from 'lucide-react';

/** Shown when the Tables page has no selected group. */
export function TablesEmptyState() {
  return (
    <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-8">
      <div className="w-24 h-24 border border-ink border-dashed rounded-full flex items-center justify-center animate-spin-slow">
        <Table2 className="w-8 h-8 opacity-20" />
      </div>
      <div className="space-y-2">
        <p className="text-xl font-serif italic text-ink/70">Select a point group to look up its tensor forms</p>
        <p className="text-xs uppercase tracking-[0.3em] opacity-30">Use the Explorer or the header search</p>
      </div>
    </div>
  );
}
