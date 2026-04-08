import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Settings2, 
  LayoutGrid,
  Zap,
  Radio,
  Cpu
} from 'lucide-react';

const Header = ({ isDisruptionMode, onToggleMode }) => {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 border-b border-white/5 px-8 flex items-center justify-between glass sticky top-0 z-20 backdrop-blur-xl"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
          <Cpu size={14} className="text-accent-blue" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Core-01 Status: Optimal</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <h2 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-3">
          <span className="text-accent-blue/50 text-[10px]">DS //</span> {isDisruptionMode ? 'NEURAL SHIELD ACTIVE' : 'PRIMARY COORDINATOR'}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-5 pr-6 border-r border-white/5">
          <button className="text-zinc-500 hover:text-accent-blue transition-all duration-300 hover:scale-110">
            <Radio size={18} />
          </button>
          <button className="text-zinc-500 hover:text-accent-blue transition-all duration-300 hover:scale-110">
            <LayoutGrid size={18} />
          </button>
        </div>

        <button 
          onClick={onToggleMode}
          className={`relative group flex items-center gap-3 px-6 py-2 rounded-xl font-black text-[10px] tracking-[0.1em] transition-all duration-500 border overflow-hidden ${
            isDisruptionMode 
              ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30 shadow-neon-blue' 
              : 'bg-zinc-900 text-zinc-400 hover:text-white border-white/5 hover:border-accent-blue/30'
          }`}
        >
          {isDisruptionMode && (
            <motion.div 
              layoutId="glow"
              className="absolute inset-0 bg-accent-blue/10 blur-xl px-10"
            />
          )}
          
          <div className="relative z-10 flex items-center gap-3">
            {isDisruptionMode ? (
              <Zap size={14} className="animate-pulse" />
            ) : (
              <ShieldCheck size={14} className="group-hover:text-accent-blue transition-colors" />
            )}
            <span>{isDisruptionMode ? 'SHIELD ONLINE' : 'ACTIVATE SHIELD'}</span>
          </div>

          {!isDisruptionMode && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Header;
