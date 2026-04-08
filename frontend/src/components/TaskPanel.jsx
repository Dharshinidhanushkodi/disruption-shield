import React, { useState } from 'react';
import { AlertCircle, Plus, Clock, ChevronRight, Loader2, Shield } from 'lucide-react';

const TaskPanel = ({ onAddTask, onRecover, isShieldActive, isLoading }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('10:00');
  const [disruptionInput, setDisruptionInput] = useState('');

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask({ title: newTaskTitle, time: newTaskTime });
    setNewTaskTitle('');
    setNewTaskTime('10:00');
  };

  const handleRecoverSubmit = (e, directMsg = null) => {
    if (e) e.preventDefault();
    const message = directMsg || disruptionInput;
    if (!message.trim()) return;
    
    // Disruption regex extraction
    let delayMinutes = 120; // Default
    const delayMatch = message.match(/(\d+)\s*(hour|hr|h|minute|min|m)/i);
    if (delayMatch) {
      const amount = parseInt(delayMatch[1], 10);
      const unit = delayMatch[2].toLowerCase();
      if (unit.startsWith('h')) {
        delayMinutes = amount * 60;
      } else if (unit.startsWith('m')) {
        delayMinutes = amount;
      }
    }

    onRecover({ delayMinutes, reason: message });
    if (!directMsg) setDisruptionInput('');
  };

  return (
    <aside className="w-80 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-md h-full">
      <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
        
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Plus size={14} className="text-accent-blue" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Dispatch Task</h2>
          </div>
          <form onSubmit={handleTaskSubmit} className="space-y-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent-blue/50 transition-all"
            />
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-blue/50 transition-all color-scheme-dark"
                />
              </div>
              <button type="submit" className="flex items-center justify-center w-12 bg-white/[0.03] border border-white/10 rounded-xl text-zinc-400 hover:text-accent-blue hover:border-accent-blue/30 transition-all">
                <Plus size={20} />
              </button>
            </div>
            {newTaskTitle.trim() === '' && (
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-2">
                No objectives defined
              </p>
            )}
          </form>
        </section>

        <section className="pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} className="text-orange-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Disruption Detection</h2>
          </div>
          <div className="space-y-4">
            <form onSubmit={handleRecoverSubmit} className="relative group flex items-center">
              <input
                type="text"
                value={disruptionInput}
                onChange={(e) => setDisruptionInput(e.target.value)}
                placeholder="Delay (e.g. '15 min delay')..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-accent-blue/50 transition-all placeholder:text-zinc-600"
              />
              <button type="submit" disabled={isLoading} className={`absolute right-2 top-1.5 p-1.5 rounded-lg text-black transition-transform shadow-lg ${isLoading ? 'bg-zinc-500' : 'bg-accent-blue hover:scale-105 active:scale-95 shadow-accent-blue/20'}`}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} strokeWidth={2.5} />}
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2">
              {['traffic (30 min)', 'power (2 hr)'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { 
                    setDisruptionInput(tag);
                    handleRecoverSubmit(null, tag); 
                  }}
                  className="py-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200 hover:border-white/10 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 bg-black/40 border-t border-white/5">
        <div className="p-4 rounded-2xl bg-accent-blue/5 border border-accent-blue/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-20 transition-opacity">
            <Shield size={40} className="text-accent-blue" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-blue mb-1">Protection Status</h4>
          <p className="text-xs font-bold text-zinc-100 mb-2">SYNAPTIC SHIELD: {isShieldActive ? 'ENABLED' : 'DISABLED'}</p>
          <p className="text-[9px] leading-relaxed text-zinc-500 font-medium uppercase tracking-tight">
            {isShieldActive ? 'Real-time AI monitoring active. Tasks will shift automatically.' : 'Shield offline. ONLY logging disruption (cannot shift tasks).'}
          </p>
        </div>
      </div>
    </aside>
  );
};
export default TaskPanel;
