'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, FileJson, Loader2, FileCode, Zap, Eye, Code, Star, ChevronRight, CheckCircle2, Circle, Share2, ClipboardCheck, ArrowRight, AlertTriangle, ShieldCheck, Terminal, Layers, Activity, TrendingUp, Cpu } from 'lucide-react';
import type { Blueprint, Variables, ContentPage } from '@/lib/types';
import { PocketFlow, ArchitectNode, BatchFillerNode, FinalizerNode } from '@/lib/flow';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';

// --- Tactical Components ---

const StepIndicator = ({ label, status, active }: { label: string, status: 'pending' | 'loading' | 'done', active: boolean }) => (
  <div className={`flex flex-col items-center gap-3 transition-all duration-700 ${active ? 'opacity-100 scale-110' : 'opacity-20 scale-95'}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-2xl ${status === 'done' ? 'bg-emerald-500 border-emerald-400 text-white' : status === 'loading' ? 'border-emerald-500 text-emerald-400 animate-pulse' : 'border-slate-700 text-slate-700'}`}>
      {status === 'done' ? <CheckCircle2 size={24} /> : status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <Circle size={24} />}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${active ? 'text-emerald-400' : 'text-slate-500'}`}>{label}</span>
  </div>
);

const ValueCounter = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
  <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 flex items-center gap-5">
    <div className={`w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-black text-slate-200`}>{value}</p>
    </div>
  </div>
);

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'architecting' | 'writing' | 'finalizing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ words: 0, files: 0, savings: 0 });
  const [isCopied, setIsCopied] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [variables, setVariables] = useState<Variables | null>(null);
  
  const [activeTab, setActiveTab] = useState<'agent' | 'output' | 'system'>('agent');
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${new Date().toLocaleTimeString()} | ${msg}`].slice(-12));

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setErrorStatus(null);
    setLogs([]);
    setStats({ words: 0, files: 0, savings: 0 });
    setStep('architecting');
    
    const flow = new PocketFlow({ baseUrl: window.location.origin });
    
    try {
      addLog("Initialisation du moteur CORE V4...");
      
      // Node 1: Architect (A1)
      flow.addNode(ArchitectNode(prompt, "gemini-3.1-pro-preview"));
      
      const intermediate = await flow.run(
        (id) => { if (id === 'architect') setStep('architecting'); },
        (msg) => addLog(msg)
      );
      
      setBlueprint(intermediate.blueprint);
      setVariables(intermediate.variables);
      addLog("Architecture validée. Déploiement de la CORE SQUAD (Spark Era)...");
      setStep('writing');

      // Nodes 2-6: Batch Squads (A2-A6)
      // Batch 1 (Home/Services Core) - 3 Flash
      flow.addNode(BatchFillerNode("LEAD-1 (CORE)", [0, 1, 2], "gemini-3-flash-preview"));
      // Batch 2 (Services) - 3 Flash
      flow.addNode(BatchFillerNode("LEAD-2 (SERVICES)", [3, 4, 5], "gemini-3-flash-preview"));
      // Batch 3 (Expertise) - 3 Flash
      flow.addNode(BatchFillerNode("LEAD-3 (EXPERT)", [6, 7, 8], "gemini-3-flash-preview"));
      // Batch 4 (Blog) - 3.1 Flash-Lite
      flow.addNode(BatchFillerNode("BULK-1 (SEO)", [9, 10, 11], "gemini-3.1-flash-lite-preview"));
      // Batch 5 (Studies) - 3.1 Flash-Lite
      flow.addNode(BatchFillerNode("BULK-2 (DATA)", [12, 13, 14], "gemini-3.1-flash-lite-preview"));

      // Node 7: Finalizer (A9)
      flow.addNode(FinalizerNode());

      const finalStore = await flow.run(
        (id, p) => {
          if (id.startsWith('squad')) { setStep('writing'); setProgress(p); }
          if (id === 'finalizer') setStep('finalizing');
        },
        (msg) => {
            addLog(msg);
            if (msg.includes("Terminé")) {
                setStats(s => ({ 
                    words: s.words + 3600, // Batch of 3
                    files: s.files + 1, 
                    savings: s.savings + 280 
                }));
            }
        }
      ).catch(e => {
          addLog(`ERREUR CRITIQUE SQUAD : ${e.message}`);
          throw e;
      });

      setGeneratedFiles(finalStore.generatedFiles || {});
      setStep('done');
      setActiveTab('output');
      setSelectedFile(Object.keys(finalStore.generatedFiles || {})[0]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message);
      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadZip = async () => {
    if (!generatedFiles) return;
    const zip = new JSZip();
    Object.entries(generatedFiles).forEach(([p, c]) => zip.file(p, c));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'project-core-pack.zip');
  };

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col font-sans max-w-[1600px] mx-auto gap-8 bg-[#0b0f1a] text-slate-200">
      <header className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-6 px-10 border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-6">
           <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
             <ShieldCheck className="text-white" size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">CORE <span className="text-emerald-500">ENGINE</span></h1>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Proprietary SEO Agent v4.2 | Squad Mode</p>
           </div>
        </div>
        <div className="flex p-1 bg-slate-950/50 rounded-xl border border-slate-800">
             {(['agent', 'output', 'system'] as const).map(t => (
               <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-2.5 rounded-lg text-[10px] font-black transition-all ${activeTab === t ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>
                {t.toUpperCase()}
               </button>
             ))}
        </div>
      </header>
      
      <div className="flex-1 rounded-[3rem] bg-slate-900/40 backdrop-blur-3xl border border-slate-800 shadow-3xl flex flex-col min-h-[750px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <AnimatePresence mode="wait">
          {activeTab === 'agent' && step === 'idle' && (
            <motion.div key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-16">
               <div className="max-w-4xl w-full text-center space-y-12">
                  <h2 className="text-8xl font-black text-white tracking-tighter leading-none italic mb-4">
                     CORE <span className="text-emerald-500">SQUAD</span> ACTIVATION.
                  </h2>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] mb-8">Deploying 10 specialized agent shells</p>
                  
                  <div className="relative group">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Identifiez la mission sémantique..." className="w-full h-80 rounded-[3rem] bg-[#05070a] border border-slate-700/50 p-12 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all shadow-2xl" />
                    <button onClick={handleGenerate} className="absolute bottom-10 right-10 bg-emerald-600 hover:bg-emerald-500 text-white px-16 py-7 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center gap-4 transition-all">
                       <Zap size={22} /> ENGAGER LA SQUAD
                    </button>
                  </div>
                  {errorStatus && <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 font-black uppercase text-xs tracking-widest"><AlertTriangle size={16} className="inline mr-2" /> {errorStatus}</div>}
               </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0f1a]/98 z-50 p-12">
               <div className="w-full max-w-5xl flex flex-col gap-12">
                  <div className="flex justify-between items-center px-12 lg:px-32">
                    <StepIndicator label="A1: STRATÉGIE" status={step === 'architecting' ? 'loading' : 'done'} active={step === 'architecting'} />
                    <StepIndicator label="A2-A6: SQUAD" status={step === 'writing' ? 'loading' : step === 'finalizing' || step === 'done' ? 'done' : 'pending'} active={step === 'writing'} />
                    <StepIndicator label="A7: PACKAGING" status={step === 'finalizing' ? 'loading' : step === 'done' ? 'done' : 'pending'} active={step === 'finalizing'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <ValueCounter icon={Activity} label="Mots Sémantiques" value={stats.words.toLocaleString()} color="emerald" />
                     <ValueCounter icon={Cpu} label="Agents Engagés" value={stats.files} color="emerald" />
                     <ValueCounter icon={TrendingUp} label="Expertise SEO" value={`${stats.savings}€`} color="emerald" />
                  </div>

                  <div className="bg-[#05070a] rounded-[2rem] border border-slate-800 p-8 h-80 relative shadow-inner overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Core Terminal Stream</span>
                     </div>
                     <div className="font-mono text-[10px] text-emerald-500/60 space-y-2 overflow-y-auto h-full pr-4 custom-scrollbar">
                        {logs.map((log, i) => (
                           <div key={i} className="animate-terminal-text border-l border-emerald-500/10 pl-3 lowercase opacity-80">{log}</div>
                        ))}
                        <div ref={logEndRef} />
                     </div>
                  </div>
                  
                  <div className="text-center space-y-4">
                     <p className="text-white font-black uppercase text-xs tracking-[0.5em] animate-pulse">Synchronisation des agents Spark...</p>
                     <div className="h-1 w-full max-w-md mx-auto bg-slate-800 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" animate={{ width: `${progress}%` }} />
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'output' && !isLoading && (
            <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-row">
               <aside className="w-[450px] border-r border-slate-800/50 bg-[#0d121f] p-10 flex flex-col gap-6">
                <button onClick={downloadZip} className="bg-emerald-600 text-white p-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-500 pointer transition-all">
                   <Download size={20} /> TÉLÉCHARGER LE PAQUET
                </button>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                  {Object.keys(generatedFiles).sort().map(k => (
                    <button key={k} onClick={() => setSelectedFile(k)} className={`w-full text-left p-4 rounded-xl font-black text-[11px] flex items-center justify-between border transition-all ${selectedFile === k ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-800/10 border-transparent text-slate-500 hover:text-slate-300'}`}>
                      <span className="truncate">{k.split('/').pop()}</span>
                    </button>
                  ))}
                </div>
              </aside>
              <main className="flex-1 p-10 bg-[#0b0f1a] overflow-auto">
                 <div className="rounded-[2.5rem] bg-[#0d121f] border border-slate-800 p-16 min-h-full prose prose-invert prose-emerald max-w-none">
                    {selectedFile && <ReactMarkdown>{generatedFiles[selectedFile]}</ReactMarkdown>}
                 </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
        @keyframes terminal-text { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
        .animate-terminal-text { animation: terminal-text 0.2s ease-out forwards; }
      `}</style>
    </main>
  );
}
