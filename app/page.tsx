'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, Activity, TrendingUp, Cpu, 
  Download, FileCode, CheckCircle2, ChevronRight, 
  AlertTriangle, Boxes, Network, Search, Database,
  Terminal as TerminalIcon, Sparkles, Code
} from 'lucide-react';
import type { Blueprint, Variables } from '@/lib/types';
import { PocketFlow, ArchitectNode, BatchFillerNode, FinalizerNode } from '@/lib/flow';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import { AgentNode } from './components/AgentNode';

// --- Tactical Data ---

const CORE_AGENTS = [
  { id: 'architect', label: 'A1: ARCHITECT', icon: Boxes, x: 0, y: -180 },
  { id: 'squad-LEAD-1 (CORE)', label: 'A2: LEAD CORE', icon: ShieldCheck, x: -160, y: -80 },
  { id: 'squad-LEAD-2 (SERVICES)', label: 'A3: LEAD SERV', icon: Zap, x: 160, y: -80 },
  { id: 'squad-LEAD-3 (EXPERT)', label: 'A4: LEAD EXP', icon: Search, x: -220, y: 80 },
  { id: 'squad-BULK-1 (SEO)', label: 'A5: BULK SEO', icon: Database, x: 0, y: 180 },
  { id: 'squad-BULK-2 (DATA)', label: 'A6: BULK DATA', icon: Activity, x: 220, y: 80 },
  { id: 'schema-expert', label: 'A7: SCHEMAS', icon: Code, x: -120, y: 280 },
  { id: 'seo-auditor', label: 'A8: AUDITOR', icon: TrendingUp, x: 120, y: 280 },
  { id: 'finalizer', label: 'A9: ASSEMBLER', icon: Network, x: 0, y: 0 },
];

const StatCard = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
  <div className="glass-symbiosis p-6 flex flex-col gap-2 border-white/5 bg-white/[0.02]">
    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
      <Icon size={16} />
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-2xl font-black text-white italic">{value}</span>
  </div>
);

const StepIndicator = ({ label, status, active }: { label: string, status: 'pending' | 'loading' | 'done', active: boolean }) => (
  <div className={`flex flex-col items-center gap-3 transition-all duration-700 ${active ? 'scale-110' : 'scale-100 opacity-40'}`}>
    <div className={`w-3 h-3 rounded-full ${status === 'done' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : status === 'loading' ? 'bg-cyan-500 animate-pulse shadow-[0_0_15px_#06b6d4]' : 'bg-slate-700'}`} />
    <span className="text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap">{label}</span>
  </div>
);

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'architecting' | 'writing' | 'finalizing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ words: 0, files: 0, savings: 0 });
  const [currentActiveNode, setCurrentActiveNode] = useState<string | null>(null);
  const [doneNodes, setDoneNodes] = useState<Set<string>>(new Set());
  
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'mission' | 'vault' | 'system'>('mission');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`].slice(-15));

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setLogs([]);
    setDoneNodes(new Set());
    setStep('architecting');
    
    const flow = new PocketFlow({ baseUrl: window.location.origin });
    
    try {
      addLog("CORE IGNITION STARTED...");
      
      // Node 0: Research (A0)
      flow.addNode(ResearchNode(prompt));
      
      // Node 1: Architect (A1)
      flow.addNode(ArchitectNode(prompt, "gemini-3.1-pro-preview"));
      
      const intermediate = await flow.run(
        (id) => { 
          setCurrentActiveNode(id);
          if (id === 'research') addLog("SCANNING GOOGLE SERP (A0)...");
          if (id === 'architect') setStep('architecting'); 
        },
        (msg) => addLog(msg)
      );
      
      setDoneNodes(prev => new Set(prev).add('architect'));

      const pages = intermediate.blueprint.contentPages || [];
      flow.addNode(BatchFillerNode("LEAD-1 (CORE)", [0, 1, 2], "gemini-3-flash-preview"));
      flow.addNode(BatchFillerNode("LEAD-2 (SERVICES)", [3, 4, 5], "gemini-3-flash-preview"));
      flow.addNode(BatchFillerNode("LEAD-3 (EXPERT)", [6, 7, 8], "gemini-3-flash-preview"));
      flow.addNode(BatchFillerNode("BULK-1 (SEO)", [9, 10, 11], "gemini-3.1-flash-lite-preview"));
      flow.addNode(BatchFillerNode("BULK-2 (DATA)", [12, 13, 14], "gemini-3.1-flash-lite-preview"));
      flow.addNode(FinalizerNode());

      const finalStore = await flow.run(
        (id, p) => {
          setCurrentActiveNode(id);
          if (id.startsWith('squad')) setStep('writing');
          if (id === 'finalizer') setStep('finalizing');
          setProgress(p);
        },
        (msg) => {
            addLog(msg);
            if (msg.includes("Terminé")) {
                setStats(s => ({ 
                    words: s.words + 3600, // Batch of 3
                    files: s.files + 1, 
                    savings: s.savings + 280 
                }));
                setDoneNodes(prev => new Set(prev).add(currentActiveNode || ''));
            }
            if (msg.includes("Recherche")) addLog("SCANNING GOOGLE SERP (GROUNDING)...");
            if (msg.includes("Crawl")) addLog("EXTRACTING COMPETITOR MARKDOWN (FIRECRAWL)...");
        }
      );

      setGeneratedFiles(finalStore.generatedFiles || {});
      setStep('done');
      setActiveTab('vault');
      setSelectedFile(Object.keys(finalStore.generatedFiles || {})[0]);
    } catch (err: any) {
      addLog(`CRITICAL FAILURE: ${err.message}`);
      setStep('idle');
    } finally {
      setIsLoading(false);
      setCurrentActiveNode(null);
    }
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    Object.entries(generatedFiles).forEach(([p, c]) => zip.file(p, c));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'core-pack-v5.zip');
  };

  return (
    <main className="min-h-screen relative flex flex-col p-6 lg:p-12 overflow-hidden selection:bg-cyan-500/30">
      <div className="bg-mesh" />

      {/* Floating Header */}
      <header className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4">
        <div className="glass-symbiosis p-4 flex items-center justify-between shadow-2xl bg-white/[0.04]">
          <div className="flex items-center gap-6 pl-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <ShieldCheck className="text-black" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-widest leading-none">CORE <span className="text-cyan-500 italic">ENGINE</span></h1>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em]">v5.0 Symbiosis</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 p-1 bg-black/40 rounded-full mr-2 border border-white/5">
            {(['mission', 'vault', 'system'] as const).map(t => (
              <button 
                key={t} onClick={() => setActiveTab(t)}
                className={`px-10 py-3 rounded-full text-[10px] font-black transition-all duration-500 ${activeTab === t ? 'bg-cyan-500 text-black glow-cyan' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1 mt-32 flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {activeTab === 'mission' && step === 'idle' && (
            <motion.div key="m" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-4xl space-y-12 text-center">
                <h2 className="text-9xl font-black text-white tracking-tighter italic leading-none">
                  LIQUID <span className="text-cyan-500">POWER.</span>
                </h2>
                <div className="relative group">
                  <textarea 
                    value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your semantic target..."
                    className="w-full h-96 glass-symbiosis p-12 text-2xl font-bold text-white focus:outline-none focus:border-cyan-500/50 transition-all shadow-3xl bg-black/40"
                  />
                  <button 
                    onClick={handleGenerate}
                    className="absolute bottom-12 right-12 bg-white text-black px-20 py-8 rounded-full font-black text-xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 group"
                  >
                    <Zap size={24} className="group-hover:text-cyan-600 transition-colors" /> ENGAGE SQUAD
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center min-h-[700px]">
              <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Visual Graph View */}
                <div className="lg:col-span-8 relative h-[600px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent blur-3xl" />
                  <div className="relative w-full h-full">
                    {/* Connection Filaments */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                      {CORE_AGENTS.map(agent => (
                        <line key={agent.id} x1="50%" y1="50%" x2={`calc(50% + ${agent.x}px)`} y2={`calc(50% + ${agent.y}px)`} stroke="url(#line-grad)" strokeWidth="1" />
                      ))}
                      <defs>
                        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                          <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {CORE_AGENTS.map(agent => (
                      <AgentNode 
                        key={agent.id} 
                        {...agent} 
                        status={doneNodes.has(agent.id) ? 'done' : currentActiveNode === agent.id ? 'loading' : 'pending'} 
                      />
                    ))}
                  </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="flex justify-between items-center px-4 py-6 border-b border-white/5 mb-4">
                    <StepIndicator label="A0: RESEARCH" status={currentActiveNode === 'research' ? 'loading' : doneNodes.has('research') ? 'done' : 'pending'} active={currentActiveNode === 'research'} />
                    <StepIndicator label="A1: STRATEGY" status={currentActiveNode === 'architect' ? 'loading' : doneNodes.has('architect') ? 'done' : 'pending'} active={currentActiveNode === 'architect'} />
                    <StepIndicator label="A2-A6: SQUAD" status={step === 'writing' ? 'loading' : step === 'finalizing' || step === 'done' ? 'done' : 'pending'} active={step === 'writing'} />
                    <StepIndicator label="A7: PACKAGING" status={step === 'finalizing' ? 'loading' : step === 'done' ? 'done' : 'pending'} active={step === 'finalizing'} />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <StatCard icon={Activity} label="Words Stream" value={stats.words.toLocaleString()} />
                    <StatCard icon={Cpu} label="Agents Pulse" value={stats.files} />
                  </div>

                  {/* Terminal Mist */}
                  <div className="glass-symbiosis p-8 h-80 bg-black/40 flex flex-col gap-4 border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-[0.3em] text-cyan-500/50 uppercase">Neural Stream</span>
                      <TerminalIcon size={14} className="text-cyan-500/20" />
                    </div>
                    <div className="flex-1 font-mono text-[10px] text-cyan-500/70 overflow-y-auto space-y-2 custom-scrollbar">
                      {logs.map((log, i) => <div key={i} className="animate-in slide-in-from-left duration-300">{log}</div>)}
                      <div ref={logEndRef} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">
                       <span>Total Progress</span>
                       <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-cyan-500 shadow-[0_0_15px_#06b6d4]" animate={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'vault' && !isLoading && (
            <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col lg:flex-row gap-8">
              <aside className="w-full lg:w-96 flex flex-col gap-6">
                <button 
                  onClick={downloadZip}
                  className="glass-symbiosis p-8 bg-white text-black font-black uppercase tracking-widest hover:bg-cyan-500 transition-all flex items-center justify-center gap-4 group"
                >
                  <Download size={20} className="group-hover:bounce" /> Export Pack
                </button>
                <div className="flex-1 glass-symbiosis bg-black/20 p-6 overflow-y-auto custom-scrollbar border-white/5 space-y-2">
                  {Object.keys(generatedFiles).sort().map(f => (
                    <button 
                      key={f} onClick={() => setSelectedFile(f)}
                      className={`w-full text-left p-4 rounded-3xl text-[10px] font-black transition-all uppercase tracking-widest ${selectedFile === f ? 'bg-cyan-500 text-black glow-cyan' : 'text-slate-500 hover:text-slate-300 bg-white/5'}`}
                    >
                      {f.split('/').pop()}
                    </button>
                  ))}
                </div>
              </aside>
              <main className="flex-1 glass-symbiosis bg-black/40 p-12 overflow-auto border-white/5">
                <div className="prose prose-invert prose-cyan max-w-none">
                   {selectedFile && <ReactMarkdown>{generatedFiles[selectedFile]}</ReactMarkdown>}
                </div>
              </main>
            </motion.div>
          )}
          {activeTab === 'system' && (
            <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-symbiosis p-12 bg-black/40 border-white/5">
                  <h3 className="text-2xl font-black text-white italic mb-8 flex items-center gap-4">
                    <Cpu className="text-cyan-500" /> SYSTEM DIAGNOSTICS
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Core Framework</span>
                      <div className="text-white font-mono">PocketFlow v2.1.0</div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Neural Engine</span>
                      <div className="text-white font-mono">Gemini 3.1 Pro Symbiosis</div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Latency</span>
                      <div className="text-cyan-500 font-mono">24ms (Optimized)</div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Storage</span>
                      <div className="text-white font-mono">Virtual Obsidian Vault</div>
                    </div>
                  </div>
                </div>

                <div className="glass-symbiosis p-12 bg-black/40 border-white/5">
                  <h3 className="text-2xl font-black text-white italic mb-8 flex items-center gap-4">
                    <Network className="text-cyan-500" /> SQUAD REGISTRY
                  </h3>
                  <div className="space-y-4">
                    {CORE_AGENTS.map(agent => (
                      <div key={agent.id} className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                          <agent.icon size={16} className="text-cyan-500" />
                          <span className="text-[10px] font-bold text-white tracking-widest">{agent.label}</span>
                        </div>
                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">ACTIVE</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="glass-symbiosis p-12 bg-cyan-500 text-black shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                  <h3 className="text-xl font-black italic mb-4">NEURAL LINK</h3>
                  <p className="text-[10px] font-bold leading-relaxed">
                    CONNECTION STABLE. ALL AGENTS SYNCHRONIZED. GROUNDING TOOLS ACTIVE.
                  </p>
                </div>
                <div className="glass-symbiosis p-12 bg-black/60 border-white/10">
                  <h3 className="text-xs font-black text-white italic mb-6">ENVIRONMENT</h3>
                  <div className="space-y-4 font-mono text-[9px]">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">GEMINI_KEY</span>
                      <span className="text-white">AIzaSy...****</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">FIRECRAWL_KEY</span>
                      <span className="text-white">fc-dc6a...****</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">RUNTIME</span>
                      <span className="text-white">VERCEL_EDGE</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-8 flex justify-between px-4 text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">
         <span>Core Engine © 2026</span>
         <span>Encrypted Neural Link Active</span>
      </footer>
    </main>
  );
}
