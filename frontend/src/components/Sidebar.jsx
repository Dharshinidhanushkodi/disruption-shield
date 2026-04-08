import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Settings, 
  History, 
  LayoutDashboard,
  Shield,
  Zap,
  MoreHorizontal,
  Bot,
  Activity,
  Cpu,
  Globe,
  User
} from 'lucide-react';

const Sidebar = ({ onCommand }) => {
  const agents = [
    { name: 'Coordinator', status: 'Active', color: 'text-accent-blue', icon: <Bot size={14} /> },
    { name: 'InfoAgent', status: 'Syncing', color: 'text-accent-blue', icon: <Globe size={14} /> },
    { name: 'TaskAgent', status: 'Idle', color: 'text-zinc-500', icon: <Activity size={14} /> },
    { name: 'ScheduleAgent', status: 'Idle', color: 'text-zinc-500', icon: <Cpu size={14} /> },
  ];

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, active: true },
    { label: 'History', icon: <History size={18} /> },
    { label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-background/80 border-r border-white/5 flex flex-col h-screen select-none z-30 glass shadow-2xl"
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between group cursor-pointer border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue shadow-neon-blue border border-accent-blue/20">
            <Shield size={20} fill="currentColor" className="neo-blur" />
          </div>
          <div>
            <h1 className="font-black text-xs text-white tracking-[0.1em] uppercase leading-tight">DisruptionShield</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Coordinator</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        {/* Quick Actions */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white cursor-pointer transition-all group border border-transparent hover:border-white/5">
            <Search size={18} className="group-hover:text-accent-blue transition-colors" />
            <span className="text-sm font-semibold">Neural Search</span>
          </div>
          <div 
            onClick={() => onCommand('/seed')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white cursor-pointer transition-all group border border-transparent hover:border-white/5"
          >
            <Plus size={18} className="group-hover:text-accent-neon transition-colors" />
            <span className="text-sm font-semibold">Initialize Protocol</span>
          </div>
        </div>

        {/* Main Navigation */}
        <section>
          <h3 className="px-3 text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-4">Command Center</h3>
          <div className="space-y-1.5">
            {menuItems.map((item) => (
              <div 
                key={item.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group ${
                  item.active 
                    ? 'bg-accent-blue/10 text-white border border-accent-blue/20 shadow-neon-blue' 
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <span className={`${item.active ? 'text-accent-blue' : 'group-hover:text-zinc-300'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Agents Section */}
        <section>
          <h3 className="px-3 text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-4">Agents</h3>
          <div className="space-y-1">
            {agents.map((agent) => (
              <div 
                key={agent.name}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer group transition-all border border-transparent hover:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-zinc-900 border border-white/5 ${agent.color}`}>
                    {agent.icon}
                  </div>
                  <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-100 transition-colors">
                    {agent.name}
                  </span>
                </div>
                <div className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full border border-white/5 uppercase ${agent.color === 'text-zinc-500' ? 'bg-zinc-950 text-zinc-600' : 'bg-accent-blue/10'}`}>
                  {agent.status}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/50">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 group cursor-pointer transition-all">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue neo-blur">
              <User size={20} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent-neon border-2 border-background flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] font-black text-white truncate uppercase tracking-widest">Main Operator</p>
            <p className="text-[9px] text-zinc-500 font-bold truncate tracking-tighter">ID: DS-992-ALPHA</p>
          </div>
          <Settings size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
