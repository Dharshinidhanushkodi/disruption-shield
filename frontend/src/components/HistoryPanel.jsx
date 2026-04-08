import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';

const HistoryPanel = ({ logs }) => {
  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden border-l border-white/5 bg-zinc-950/20 backdrop-blur-xl">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Neural History</h2>
        <span className="px-2 py-0.5 rounded-full bg-accent-blue/10 text-[10px] text-accent-blue font-black border border-accent-blue/20">
          LOGS: {safeLogs.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {safeLogs.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-zinc-600 gap-2 opacity-30">
            <Clock size={24} />
            <span className="text-[10px] uppercase font-bold tracking-widest">No events yet</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {safeLogs.map((log, index) => {
              const id = log.id || String(index);
              
              const formatTime = (time) => {
                if (!time) return "Unknown";
                const date = new Date(time);
                if (isNaN(date.getTime())) return time;
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              };
              
              const rawTime = log.timestamp || log.created_at || log.new_start;
              const timestamp = rawTime ? formatTime(rawTime) : "Just now";
              
              const delay = log.delay_applied || log.delay_minutes || log.delay || "Unknown";
              const reason = log.disruption_reason || log.reason || log.title || "Unknown Disruption";

              return (
                <motion.div
                  key={id}
                  layout="position"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="history-card group p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-accent-blue/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                      <AlertCircle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate mb-1">
                        {reason}
                      </p>
                      
                      <p className="flex items-center gap-2 mb-2 text-zinc-500 text-[10px]">
                        <Clock size={10} />
                        {timestamp}
                      </p>

                      <small className="text-[9px] font-black uppercase tracking-widest text-accent-blue truncate block bg-accent-blue/10 px-2 py-1 rounded inline-block">
                        Delay applied: {delay} min
                      </small>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
