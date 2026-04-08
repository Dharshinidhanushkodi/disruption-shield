import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Zap, 
  Loader2, 
  User, 
  CheckCircle2, 
  Clock, 
  Layout, 
  ShieldCheck,
  ShieldAlert,
  ArrowRight
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
      className="mt-6 p-6 rounded-3xl bg-[#0c0c0e]/80 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-6 max-w-xl overflow-hidden relative group"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue to-accent-purple" />
      <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-orange-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">
          <ShieldAlert size={18} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
          ⚡ Disruption Resolved
        </div>
        <div className="text-[10px] text-zinc-600 font-mono">LATENCY: 42MS</div>
      </div>

      <div className="grid grid-cols-1 gap-2">
         <div className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            {disruptionType || 'SYSTEM ANOMALY'} 
            <span className="text-zinc-500 font-medium text-sm">/ {duration || 'AUTO'}</span>
         </div>
         <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            Recovery Plan Applied Successfully
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
              <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
              <span className="text-sm font-bold text-zinc-300">{s.title.split('→')[0].trim()}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
               <ArrowRight size={14} />
               <span className="text-sm font-black text-accent-blue">{s.title.split('→')[1] || 'NEXT'}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent-neon font-black text-[10px] uppercase tracking-widest">
          <CheckCircle2 size={16} fill="currentColor" className="text-accent-neon" />
          ✅ Neural State: STABLE
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
      className={`w-full py-10 ${isUser ? 'bg-transparent' : 'bg-white/[0.01]'}`}
    >
      <div className="max-w-[700px] mx-auto flex gap-8 px-6">
        <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border transition-all ${
          isUser 
            ? 'bg-zinc-900 border-white/5 text-zinc-500' 
            : 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue shadow-[0_0_20px_rgba(59,130,246,0.1)]'
        }`}>
          {isUser ? <User size={20} /> : <Zap size={20} fill="currentColor" />}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 mb-1">
             <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-600">
                {isUser ? 'OPERATOR' : 'COORDINATOR UNIT'}
             </span>
             {!isUser && <div className="w-1 h-1 rounded-full bg-accent-blue animate-pulse" />}
          </div>
          
          <div className={`text-[15px] leading-relaxed font-medium ${isUser ? 'text-zinc-300' : 'text-zinc-100'}`}>
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

const ChatPanel = ({ messages, onSend, isLoading }) => {
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
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden glass border-x border-white/5">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-6 pb-40 space-y-0 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-12 px-8"
            >
              <div className="relative group">
                <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-900 border border-white/5 flex items-center justify-center text-accent-blue shadow-[0_0_50px_rgba(59,130,246,0.1)] relative z-10 overflow-hidden">
                  <ShieldCheck size={48} className="relative z-10 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-transparent group-hover:opacity-100 opacity-50 transition-opacity" />
                </div>
                <div className="absolute inset-0 bg-accent-blue/10 blur-[80px] rounded-full animate-pulse-slow" />
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tighter leading-none">NEURAL SHIELD ACTIVE</h2>
                <p className="text-zinc-500 text-sm leading-relaxed font-bold uppercase tracking-widest max-w-[300px] mx-auto opacity-70">
                  Ready to protect mission integrity. Protocol standing by.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full max-w-sm pt-4">
                {[
                  { label: 'Traffic Anomaly', val: 'Detect traffic for 2 hours' },
                  { label: 'Energy Depletion', val: 'Power cut till tomorrow' },
                  { label: 'Strategic Conflict', val: 'Add high priority meeting at 4PM' }
                ].map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => onSend(item.val)}
                    className="flex items-center justify-between p-4 rounded-2xl glass border border-white/5 hover:border-accent-blue/30 hover:bg-accent-blue/5 transition-all text-left group"
                  >
                    <span className="text-xs font-black text-zinc-500 group-hover:text-zinc-200 tracking-wider uppercase">{item.label}</span>
                    <Zap size={14} className="text-zinc-700 group-hover:text-accent-blue transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((m, i) => <Message key={i} msg={m} />)
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="max-w-[700px] mx-auto px-12 py-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-accent-blue/5 border border-accent-blue/10 flex items-center justify-center">
                <Loader2 size={20} className="text-accent-blue animate-spin" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-blue/60 animate-pulse">
                Cognitive Syncing...
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent pt-32 pb-10 px-8">
        <div className="max-w-[760px] mx-auto relative group">
          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="absolute inset-0 bg-accent-blue/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message DisruptionShield Coordinator..."
              className="w-full bg-[#121214]/80 border border-white/10 rounded-[1.5rem] py-5 pl-8 pr-20 text-[15px] font-medium text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-accent-blue/30 focus:border-accent-blue/30 focus:bg-[#121214] transition-all backdrop-blur-3xl shadow-2xl"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-3 p-3.5 bg-accent-blue text-white rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100 transition-all flex items-center justify-center group/btn"
            >
              <Send size={20} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse" />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Neural Link Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Version 2.5 Flash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
