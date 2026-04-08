import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldCheck, ArrowRight } from 'lucide-react';

const CalendarTimeline = ({ events }) => {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5: return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 4: return 'bg-orange-500/20 border-orange-500/40 text-orange-400';
      case 3: return 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue';
      default: return 'bg-zinc-500/20 border-zinc-500/40 text-zinc-400';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "INV DATE";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="flex-1 flex flex-col glass rounded-3xl p-6 border border-white/5 h-full overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-b from-accent-blue/[0.02] to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Timeline</h3>
          <h2 className="text-sm font-black text-white tracking-widest flex items-center gap-2 uppercase">
            Neural Sync <ShieldCheck size={14} className="text-accent-blue" />
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-0 relative">
        <div className="absolute left-[54px] top-0 bottom-0 w-px bg-white/5" />
        
        {hours.map(hour => (
          <div key={hour} className="flex gap-4 h-[100px] relative items-start group/hour">
            <span className="w-10 text-[10px] font-black text-zinc-700 text-right py-1">
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div className="flex-1 border-t border-white/[0.03] mt-2.5" />
          </div>
        ))}

        <AnimatePresence>
          {(!events || events.length === 0) ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               style={{ position: 'absolute', inset: 0, zIndex: 10 }}
               className="flex flex-col items-center justify-center opacity-30 gap-3"
            >
               <ShieldCheck size={32} className="text-zinc-600" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">No tasks scheduled</p>
            </motion.div>
          ) : events.map((event, i) => {
            if (!event.start_time || isNaN(new Date(event.start_time).getTime())) {
                console.warn("Neural Warning: Skipping invalid objective:", event.title);
                return null;
            }
            
            const start = new Date(event.start_time);
            const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 3600000);
            
            if (isNaN(start.getTime())) return null;

            // Simplified positioning: 100px per hour
            // 8:00 AM is 0px
            const top = (start.getHours() - 8) * 100 + (start.getMinutes() / 60) * 100;
            const durationMins = (end - start) / 60000;
            const height = (durationMins / 60) * 100;
            
            const isShifted = event.original_start_time && event.original_start_time !== event.start_time;
            
            return (
              <motion.div
                key={event.id || i}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{ 
                   top: `${top}px`, 
                   position: 'absolute', 
                   left: '70px', 
                   right: '10px',
                   height: `${Math.max(60, height)}px`
                }}
                className={`px-4 py-3 rounded-2xl border glass shadow-2xl flex flex-col justify-start gap-1 group/event transition-all ${
                  isShifted 
                    ? 'border-accent-neon shadow-neon-blue bg-accent-blue/10' 
                    : getPriorityColor(event.priority || 3)
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black truncate tracking-widest uppercase text-white">{event.title}</p>
                  {isShifted && (
                    <span className="text-[8px] font-black bg-accent-neon text-black px-2 py-0.5 rounded-full uppercase">Shifted</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-auto">
                    <Clock size={10} className="text-zinc-500" />
                    <div className="flex items-center gap-1.5">
                       {isShifted && (
                         <span className="text-[9px] text-zinc-600 line-through">
                           {formatTime(event.original_start_time)}
                         </span>
                       )}
                       <span className={`text-[10px] font-black ${isShifted ? 'text-accent-neon' : 'text-zinc-400'}`}>
                         {formatTime(event.start_time)}
                       </span>
                       <ArrowRight size={10} className="text-zinc-700" />
                       <span className="text-[10px] font-black text-zinc-400">
                         {formatTime(event.end_time)}
                       </span>
                    </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarTimeline;
