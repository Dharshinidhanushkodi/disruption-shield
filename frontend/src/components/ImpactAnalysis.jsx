import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Activity, 
  Zap, 
  ArrowLeft, 
  Play, 
  XCircle,
  Scan,
  Database,
  Unplug
} from 'lucide-react';

const RadarScanner = () => (
  <div className="relative w-64 h-64 mx-auto mb-12">
    {/* Concentric Circles */}
    {[1, 2, 3].map((i) => (
      <div 
        key={i}
        className="absolute inset-0 border border-accent-blue/20 rounded-full"
        style={{ margin: `${i * 20}px` }}
      />
    ))}
    
    {/* Grid Lines */}
    <div className="absolute inset-0 border-l border-white/5 left-1/2 -translate-x-1/2" />
    <div className="absolute inset-0 border-t border-white/5 top-1/2 -translate-y-1/2" />
    
    {/* Rotating Sweep */}
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 bg-gradient-to-tr from-accent-blue/30 via-transparent to-transparent rounded-full shadow-[0_0_50px_rgba(30,144,255,0.2)]"
      style={{ transformOrigin: 'center' }}
    />

    {/* Pulsing Center Node */}
    <div className="absolute inset-[112px] bg-accent-blue rounded-full shadow-neon-blue animate-pulse z-10" />

    {/* Scanning Particles */}
    {[1,2,3,4].map(i => (
      <motion.div
        key={i}
        animate={{ 
          scale: [0, 1, 0],
          opacity: [0, 0.5, 0],
          x: Math.sin(i) * 100,
          y: Math.cos(i) * 100
        }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
        className="absolute inset-0 m-auto w-1 h-1 bg-accent-neon rounded-full"
      />
    ))}
  </div>
);

const MetricBox = ({ icon, label, val, color = 'blue' }) => (
  <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-1 group hover:border-accent-blue/30 transition-all">
    <div className={`text-${color === 'blue' ? 'accent-blue' : 'alert-red'} mb-2`}>{icon}</div>
    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</div>
    <div className="text-sm font-black text-white tracking-widest">{val}</div>
  </div>
);

const ImpactAnalysis = ({ view, onBack, onInitiate }) => {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="flex-1 flex flex-col h-full bg-zinc-950/40 p-12 overflow-y-auto custom-scrollbar relative"
    >
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-16">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-accent-blue tracking-[0.3em] uppercase">Impact Scan // 0X-DE44</span>
          <span className="text-[8px] text-zinc-700 font-mono">NEURAL_ID: 992-ALPHA-DELTA</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full text-center">
        <RadarScanner />

        <div className="space-y-4 mb-16">
          <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase flex items-center justify-center gap-4">
             {analyzing ? 'Scanning System State' : `${view.label} Detected`}
             <ShieldAlert className="text-alert-red animate-pulse" size={24} />
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">
            {analyzing ? 'Recalibrating mission timelines and constraints...' : 'Immediate intervention recommended for neural stability.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {analyzing ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-6 max-w-2xl mx-auto"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <MetricBox icon={<Zap size={18} />} label="Potential Delay" val={view.label === 'Traffic Delay' ? '60 MIN' : '120 MIN'} />
                <MetricBox icon={<Database size={18} />} label="Affected Tasks" val="3 Active" />
                <MetricBox icon={<Unplug size={18} />} label="System Risk" val="MODERATE" color="red" />
              </div>

              <div className="flex items-center justify-center gap-6 pt-8">
                <button 
                  onClick={() => onInitiate(view.val)}
                  className="px-10 py-5 rounded-2xl bg-accent-blue text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-neon-blue hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                >
                  <Play size={16} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                  Initiate Recovery Protocol
                </button>
                <button 
                  onClick={onBack}
                  className="px-10 py-5 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-500 font-black uppercase tracking-[0.2em] text-[11px] hover:text-alert-red transition-colors flex items-center gap-3"
                >
                  <XCircle size={16} />
                   Abort Analysis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      {!analyzing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-auto pt-24 text-center space-y-6"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-accent-blue/5 border border-accent-blue/20">
            <Scan size={14} className="text-accent-blue shadow-neon-blue" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Target Disruption: <span className="text-white">PROCESSED_DELTA_V</span></span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ImpactAnalysis;
