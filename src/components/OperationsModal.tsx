import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { getSymmetryOperations } from '../services/tensorCalculator';
import { FormatPointGroup, SymmetryOperation } from './MathComponents';
import { PointGroupData } from '../data/pointGroups';

interface OperationsModalProps {
  group: PointGroupData;
  onClose: () => void;
}

export const OperationsModal = ({ group, onClose }: OperationsModalProps) => {
  const operations = getSymmetryOperations(group.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#E4E3E0] w-full max-w-2xl border border-[#141414] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#141414]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium tracking-tight">
              <FormatPointGroup name={group.name} />
            </h2>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60">
              <span>{group.crystalSystem}</span>
              <span>•</span>
              <span>Type {group.type}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#141414]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <h3 className="text-xs uppercase tracking-[0.2em] opacity-50 mb-4">Symmetry Operations ({operations.length})</h3>
          <div className="flex flex-wrap gap-2">
            {operations.map((op, idx) => (
              <SymmetryOperation key={idx} symbol={op} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
