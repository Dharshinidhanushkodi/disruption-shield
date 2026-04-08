import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Zap, 
  Loader2, 
  User, 
  CheckCircle2, 
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BarChart3,
  Flame,
  PhoneCall
} from 'lucide-react';

const Typewriter = ({ text, delay = 15 }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};

const RecoveryCard = ({ plan, disruptionType, duration }) => {
  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className="mt-6 p-6 rounded-3xl bg-zinc-900 border border-alert-red/20 shadow-neon-red space-y-6 max-w-xl overflow-hidden relative group"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue to-accent-purple" />
      <div className="absolute inset-0 bg-accent-blue/[0.05] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-accent-blue font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">
          <ShieldAlert size={14} />
          Protocol: Recovery Active
        </div>
        <div className="text-[10px] text-zinc-600 font-mono tracking-tighter">LATENCY: 12MS // DS-COORD-X1</div>
      </div>

      <div className="grid grid-cols-1 gap-2">
         <div className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            {disruptionType || 'SYSTEM ANOMALY'} 
            <span className="text-zinc-500 font-medium text-sm">/ {duration || 'DETECTED'}</span>
         </div>
         <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Neural link recalibrated. Schedule state: REBALANCED.
         </p>
      </div>

      <div className="space-y-2">
        {plan.schedule && plan.schedule.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-neon-blue" />
              <span className="text-xs font-bold text-zinc-300">{s.title.split('→')[0].trim()}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600">
               <ArrowRight size={14} />
               <span className="text-xs font-black text-accent-blue uppercase tracking-tighter">
                  {s.title.includes('→') ? s.title.split('→')[1].trim() : 'NEW SLOT'}
               </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent-neon font-black text-[10px] uppercase tracking-widest">
          <CheckCircle2 size={16} fill="currentColor" className="text-accent-neon neo-blur" />
          Neural Integrity: 100%
        </div>
      </div>
    </motion.div>
  );
};

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full py-8 ${isUser ? 'bg-transparent' : 'bg-accent-blue/[0.02]'}`}
    >
      <div className="max-w-[700px] mx-auto flex gap-6 px-6">
        <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border transition-all ${
          isUser 
            ? 'bg-zinc-900 border-white/10 text-zinc-500 font-black text-[10px]' 
            : 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue shadow-neon-blue'
        }`}>
          {isUser ? 'OP' : <Sparkles size={16} fill="currentColor" />}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
             <span className="text-[9px] font-black tracking-[0.3em] uppercase text-zinc-600">
                {isUser ? 'Neural Link // Source' : 'Coordinator // Response'}
             </span>
             {!isUser && <div className="w-1 h-1 rounded-full bg-accent-blue animate-pulse" />}
          </div>
          
          <div className={`text-[14px] leading-relaxed font-semibold tracking-tight ${isUser ? 'text-zinc-300' : 'text-zinc-100'}`}>
            {isUser ? msg.content : <Typewriter text={msg.content} />}
          </div>

          {msg.plan && (
            <RecoveryCard 
              plan={msg.plan} 
              disruptionType={msg.disruptionType} 
              duration={msg.duration} 
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CenterPanel = ({ messages, onSend, isLoading, isShieldActive, isRecovering, onNavigate }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
    return false;
  };

  const disruptionCards = [
    { label: 'Traffic Delay', icon: <BarChart3 size={16} />, val: 'Stuck in traffic, delayed by 1 hour' },
    { label: 'Power Cut', icon: <Flame size={16} />, val: 'Power cut just hit my area, losing 2 hours' },
    { label: 'Urgent Call', icon: <PhoneCall size={16} />, val: 'Emergency client call came in for 45 minutes' },
    { label: 'Missed Task', icon: <ShieldAlert size={16} />, val: 'I missed my previous task due to a disruption' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-8 pb-48 space-y-0 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-12 px-8"
            >
              <div className="relative group">
                <div className="w-20 h-20 rounded-3xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue shadow-neon-blue relative z-10 overflow-hidden">
                  <ShieldCheck size={40} className="relative z-10 group-hover:scale-110 transition-transform neo-blur" fill="currentColor" />
                </div>
                <div className="absolute inset-0 bg-accent-blue/20 blur-[60px] rounded-full animate-pulse-slow px-20" />
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-widest leading-none uppercase">
                  {isShieldActive ? 'Neural Shield Active' : 'Shield Offline'}
                </h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-[400px] mx-auto opacity-70">
                   {isShieldActive ? 'Multi-Agent Coordinated Recovery System' : 'Protocol Deactivated. Auto-Recovery Disabled.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-lg pt-4">
                {disruptionCards.map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => onNavigate(item)}
                    className="flex flex-col gap-3 p-5 rounded-2xl glass border border-white/5 hover:border-accent-blue/30 hover:bg-accent-blue/5 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-accent-blue transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-200 tracking-[0.2em] uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((m, i) => <Message key={i} msg={m} />)
          )}
        </AnimatePresence>

        {(isLoading || isRecovering) && (
          <div className="max-w-[700px] mx-auto px-12 py-10">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shadow-neon-blue">
                <Loader2 size={16} className="text-accent-blue animate-spin" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-blue animate-pulse">
                {isRecovering ? 'Rebuilding schedule...' : 'Neural Syncing...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Futuristic Chat Input */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-32 pb-12 px-8 z-10 pointer-events-none">
        <div className="max-w-[760px] mx-auto relative group pointer-events-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                onSend(input);
                setInput('');
              }
            }} 
            className="relative z-10"
          >
            <div className="absolute inset-0 bg-accent-blue/10 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inject command into Neural Link..."
              className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl py-6 pl-10 pr-24 text-sm font-semibold text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-accent-blue/40 focus:border-accent-blue/40 transition-all backdrop-blur-3xl shadow-2xl"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-4 top-4 p-4 bg-accent-blue text-white rounded-xl shadow-neon-blue hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100 transition-all flex items-center justify-center group/btn"
            >
              <Send size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </form>
          <div className="mt-5 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-accent-neon shadow-neon-blue animate-pulse" />
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Link Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-accent-purple shadow-neon-purple animate-pulse" />
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Agents Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CenterPanel;
