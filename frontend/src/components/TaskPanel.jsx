import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListTodo, Shield, Clock } from 'lucide-react';

const TaskPanel = ({ tasks, onAddTask }) => {
  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "INV DATE";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col glass rounded-3xl p-6 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <ListTodo size={14} className="text-accent-purple" />
          Mission Objectives
        </h3>
        <button 
          onClick={onAddTask}
          className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10 transition-all"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        <AnimatePresence mode="wait">
          {Array.isArray(tasks) && tasks.length > 0 ? (
            tasks.map((task, i) => (
              <motion.div
                key={task.id || i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-accent-purple transition-colors">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                      <Clock size={10} className="text-zinc-700" />
                      {formatTime(task.start_time)} — {formatTime(task.end_time)}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${
                    task.priority >= 5 ? 'bg-red-500 shadow-red-500/50' : 
                    task.priority >= 3 ? 'bg-accent-blue shadow-accent-blue/50' : 
                    'bg-zinc-700'
                  }`} />
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.03]">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                         <Shield size={10} className="text-accent-purple" />
                         IMPACT {task.impact_score || 5}
                      </div>
                   </div>
                   {task.status === 'Completed' && (
                     <span className="text-[8px] font-black text-accent-neon bg-accent-neon/10 px-2 py-0.5 rounded-full uppercase">Verified</span>
                   )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale py-20"
            >
               <Shield size={32} className="mb-4 text-zinc-600" />
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Neural Buffer Empty</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaskPanel;
