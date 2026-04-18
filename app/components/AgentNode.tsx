'use client';

import { motion } from 'framer-motion';
import { Cpu, Zap, Activity, ShieldCheck, Database, Search, Code, CheckCircle2 } from 'lucide-react';

interface AgentNodeProps {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done';
  x: number;
  y: number;
  icon: any;
}

export const AgentNode = ({ id, label, status, x, y, icon: Icon }: AgentNodeProps) => {
  const isSelected = status === 'loading';
  const isDone = status === 'done';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: isSelected ? 1.2 : 1,
        x,
        y 
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="absolute flex flex-col items-center gap-2 group pointer-events-none"
      style={{ left: '50%', top: '50%' }}
    >
      {/* Glow Aura */}
      <motion.div
        animate={{
          scale: isSelected ? [1, 1.4, 1] : 1,
          opacity: isSelected ? [0.2, 0.5, 0.2] : 0.1
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute inset-[-20px] rounded-full blur-2xl ${
          isDone ? 'bg-emerald-500' : isSelected ? 'bg-cyan-500' : 'bg-slate-500'
        }`}
      />

      {/* The Sphere */}
      <div className={`
        relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-700
        ${isDone ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 
          isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)]' : 
          'bg-slate-900 border-slate-700 text-slate-600'}
      `}>
        {isDone ? <CheckCircle2 size={24} /> : <Icon size={24} />}
      </div>

      <span className={`text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap transition-colors ${
        isDone ? 'text-emerald-400' : isSelected ? 'text-cyan-400' : 'text-slate-600'
      }`}>
        {label}
      </span>
    </motion.div>
  );
};
