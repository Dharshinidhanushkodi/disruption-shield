import React, { useState, useEffect } from 'react';
import { Zap, Shield, RotateCcw, Loader2 } from 'lucide-react';
import CalendarTimeline from './components/CalendarTimeline';
import HistoryPanel from './components/HistoryPanel';
import TaskPanel from './components/TaskPanel';
import { getTasks, getHistory, addTask, disrupt, undo } from './services/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedTasks = await getTasks();
      const fetchedHistory = await getHistory();
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
      setHistory(Array.isArray(fetchedHistory) ? fetchedHistory : []);
    } catch(e) {
      console.error(e);
      setTasks([]);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (taskData) => {
    setIsLoading(true);
    try {
      const { title, time } = taskData;
      const [hours, minutes] = time.split(':').map(Number);
      const endHours = (hours + 1) % 24;
      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      await addTask({
        title,
        start_time: time,
        end_time: endTimeStr,
        priority: 3
      });
      await loadData(); // Immediate refresh
    } catch (err) {
      console.error("Task add failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async ({ delayMinutes, reason }) => {
    if (!isShieldActive) {
      // If shield OFF, only log history
      setHistory(prev => [{
        id: Date.now(),
        reason: reason,
        timestamp: new Date().toLocaleTimeString(),
        delay: delayMinutes
      }, ...(Array.isArray(prev) ? prev : [])]);
      return;
    }

    setIsLoading(true);
    try {
      await disrupt({ message: reason, delayMinutes, reason });
      await loadData(); // Update all states dynamically
    } catch (err) {
      console.error("Recovery failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    setIsLoading(true);
    try {
      await undo();
      await loadData();
    } catch(e) {
      console.error("Undo failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-accent-blue/30 overflow-hidden relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 bg-zinc-900 border border-accent-blue/20 p-8 rounded-3xl shadow-2xl">
            <Loader2 size={40} className="text-accent-blue animate-spin" />
            <span className="text-xs font-black tracking-[0.3em] uppercase text-accent-blue animate-pulse">Syncing Neural Link...</span>
          </div>
        </div>
      )}

      {/* Neural Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-blue/10 rounded-xl border border-accent-blue/20">
            <Zap size={20} className="text-accent-blue" />
          </div>
          <h1 className="text-sm font-black tracking-[0.3em] uppercase">
            DISRUPTIONSHIELD <span className="text-zinc-600 font-medium">COORDINATOR</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isShieldActive ? 'bg-accent-blue animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isShieldActive ? 'text-accent-blue' : 'text-red-500'}`}>
              {isShieldActive ? 'SHIELD: ACTIVE' : 'SHIELD: OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleUndo}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-zinc-100"
              title="Reverse Last Neural Shift"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={() => setIsShieldActive(!isShieldActive)}
              className={`p-2 rounded-lg transition-all duration-300 ${isShieldActive ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' : 'bg-zinc-900 text-zinc-600 border border-transparent'}`}
            >
              <Shield size={18} className={isShieldActive ? 'fill-accent-blue/20' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Task Panel */}
        <TaskPanel 
          onAddTask={handleAddTask} 
          onRecover={handleRecover} 
          isShieldActive={isShieldActive} 
          isLoading={isLoading} 
        />

        {/* Center Panel: Timeline */}
        <section className="flex-1 h-full border-r border-white/5 p-4">
          <CalendarTimeline events={tasks} />
        </section>

        {/* Right Panel: History */}
        <aside className="w-80 h-full overflow-hidden">
          <HistoryPanel logs={history} />
        </aside>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
        .text-accent-blue { color: #3b82f6; }
        .bg-accent-blue { background-color: #3b82f6; }
        .border-accent-blue { border-color: #3b82f6; }
        .text-accent-neon { color: #00f0ff; }
        .bg-accent-neon { background-color: #00f0ff; }
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5) sepia(1) saturate(5) hue-rotate(175deg);
        }
      `}} />
    </div>
  );
}

export default App;
