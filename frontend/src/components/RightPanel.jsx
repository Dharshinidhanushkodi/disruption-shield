import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Activity, 
  ShieldCheck, 
  ListTodo, 
  Zap, 
  Plus, 
  ChevronRight,
  Clock
} from 'lucide-react';
import CalendarTimeline from './CalendarTimeline';

const NeuralLogItem = ({ log, index }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 hover:bg-white/[0.05] transition-all group/log cursor-pointer"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-accent-blue shadow-neon-blue animate-pulse" />
        <span className="text-[9px] font-black uppercase text-zinc-500 group-hover/log:text-zinc-200 transition-colors tracking-widest">
          {log.event_type || 'NEURAL'} SYNC
        </span>
      </div>
      <span className="text-[8px] font-bold text-zinc-700 font-mono">
        {new Date(log.timestamp).toLocaleString()}
      </span>
    </div>
    <p className="text-[10px] text-zinc-400 font-bold leading-tight uppercase tracking-tighter group-hover:text-white transition-colors">
       {log.description || log.disruption_type || 'STATE STABLE'}
    </p>
  </motion.div>
);

const TaskItem = ({ task, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent-blue/20 hover:bg-accent-blue/[0.02] transition-all group cursor-pointer"
  >
    <div className="flex items-start justify-between mb-2">
      <h4 className="text-[11px] font-black text-zinc-300 group-hover:text-white transition-colors uppercase tracking-tight">{task.title}</h4>
      <div className={`w-2 h-2 rounded-full border border-background shadow-neon-blue ${
        task.priority > 3 ? 'bg-alert-red' : 'bg-accent-blue'
      }`} />
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 font-black uppercase tracking-widest">
        <Zap size={10} className="text-accent-blue shadow-neon-blue" />
        {task.energy_level || 'MED'}
      </div>
      <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 font-black uppercase tracking-widest">
        <ShieldCheck size={10} className="text-accent-purple" />
        P{task.priority || 3}
      </div>
    </div>
  </motion.div>
);

// Removed internal NeuralTimeline

const RightPanel = ({ logs, tasks, events, onAddTask }) => {
  return (
    <div className="w-80 h-full flex flex-col border-l border-white/5 bg-zinc-950/20 glass-blue p-6 gap-8 overflow-hidden z-20">
      
      {/* Logs Section */}
      <section className="flex-[1] flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Buffer</h3>
            <h2 className="text-[11px] font-black text-white tracking-widest uppercase flex items-center gap-2">
               Neural Logs <Terminal size={12} className="text-accent-purple" />
            </h2>
          </div>
          <ChevronRight size={14} className="text-zinc-800" />
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
          {logs && logs.length > 0 ? (
            logs.map((log, i) => <NeuralLogItem key={i} log={log} index={i} />)
          ) : (
             <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                <Terminal size={24} className="mb-2" />
                <p className="text-[8px] font-black uppercase tracking-tighter text-zinc-500">Neural buffer clear. No logs yet.</p>
             </div>
          )}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="flex-[2.5] flex flex-col min-h-0 border-t border-white/5 pt-6">
        <CalendarTimeline events={events} />
      </section>

      {/* Tasks Section */}
      <section className="flex-[1.5] flex flex-col min-h-0 border-t border-white/5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Objectives</h3>
            <h2 className="text-[11px] font-black text-white tracking-widest uppercase flex items-center gap-2">
               Mission Tasks <ListTodo size={12} className="text-accent-neon" />
            </h2>
          </div>
          <button 
            onClick={onAddTask}
            className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-100 hover:bg-accent-blue hover:text-white transition-all shadow-neon-blue"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {tasks && tasks.length > 0 ? (
            tasks.slice(0, 10).map((task, i) => (
              <TaskItem key={i} task={task} index={i} />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
              <ListTodo size={24} className="mb-2" />
              <p className="text-[8px] font-black uppercase tracking-tighter text-zinc-500">No objectives defined. All clear.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default RightPanel;
