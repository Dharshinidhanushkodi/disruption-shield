import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';

const Timeline = ({ tasks }) => {
  // Sort tasks by start time (string comparison works for HH:MM)
  const sortedTasks = [...tasks].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden bg-zinc-950/20 backdrop-blur-xl">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Task Timeline</h2>
        <span className="px-2 py-0.5 rounded-full bg-accent-blue/10 text-[10px] text-accent-blue font-black border border-accent-blue/20 uppercase tracking-widest">
          SYNCHRONIZED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {sortedTasks.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-zinc-600 gap-2 opacity-30">
            <Calendar size={32} />
            <span className="text-[10px] uppercase font-bold tracking-widest">No Active Tasks</span>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6">
            {/* Vertical Line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-white/5" />

            {sortedTasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                {/* Node */}
                <div className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full border-2 border-zinc-900 z-10 
                  ${task.status === 'rescheduled' ? 'bg-orange-500 animate-pulse' : 'bg-accent-blue'}`} 
                />

                <div className={`task-card p-4 rounded-2xl border transition-all duration-300
                  ${task.status === 'rescheduled' 
                    ? 'rescheduled' 
                    : 'bg-white/[0.03] border-white/5 hover:border-accent-blue/40'}`}>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-zinc-100 truncate">
                          {task.title}
                          {task.status === "rescheduled" && (
                            <span className="rescheduled-badge">RESCHEDULED</span>
                          )}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Clock size={12} strokeWidth={2.5} />
                          <p className="text-[11px] font-bold uppercase tracking-tight">
                            {task.status === "rescheduled" ? (
                              <>
                                <span className="old-time">{task.original_start_time}</span>
                                <span className="mx-1 opacity-50">→</span>
                                <span className="new-time">{task.start_time}</span>
                              </>
                            ) : (
                              task.start_time
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-1.5 rounded-lg ${task.status === 'rescheduled' ? 'bg-orange-500/10 text-orange-500' : 'bg-accent-blue/10 text-accent-blue opacity-30 group-hover:opacity-100 transition-opacity'}`}>
                        <CheckCircle2 size={16} />
                    </div>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
