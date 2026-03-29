import React, { useState } from 'react';
import { Zap, Upload, FileText, CheckCircle2, AlertCircle, Search, Download, History, Loader2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SkipTraceResult {
  id: string;
  name: string;
  address: string;
  status: 'completed' | 'processing' | 'failed';
  date: string;
  hits: number;
}

export default function SkipTrace() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'history'>('bulk');

  const mockHistory: SkipTraceResult[] = [
    { id: '1', name: 'Miami Beach List', address: '50 Records', status: 'completed', date: '2024-03-28', hits: 48 },
    { id: '2', name: 'Dallas Foreclosures', address: '120 Records', status: 'completed', date: '2024-03-25', hits: 112 },
    { id: '3', name: 'Single Search: 123 Main St', address: '123 Main St, Miami FL', status: 'completed', date: '2024-03-20', hits: 1 },
  ];

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      }
    }, 300);
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Zap className="text-blue-400" size={24} fill="currentColor" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Skip Trace Pro</h1>
          </div>
          <p className="text-zinc-400 font-medium">Find property owners, phone numbers, and emails with 98% accuracy.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Available Credits</p>
            <p className="text-xl font-black text-white">2,450</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
            <CreditCard size={14} />
            Buy Credits
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl w-fit">
        {[
          { id: 'bulk', label: 'Bulk Upload', icon: Upload },
          { id: 'single', label: 'Single Search', icon: Search },
          { id: 'history', label: 'History', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-zinc-800 text-white shadow-lg" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'bulk' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div 
                className={cn(
                  "relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 transition-all",
                  isUploading ? "border-blue-500/50 bg-blue-500/5" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
                )}
              >
                {isUploading ? (
                  <div className="w-full max-w-xs space-y-4 text-center">
                    <Loader2 className="mx-auto text-blue-400 animate-spin" size={48} />
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-white uppercase tracking-widest">Processing List...</p>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold">{uploadProgress}% Complete</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-zinc-800 rounded-2xl">
                      <FileText className="text-zinc-400" size={32} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-lg font-bold text-white">Drop your CSV or Excel file here</p>
                      <p className="text-sm text-zinc-500">Maximum 50,000 records per upload</p>
                    </div>
                    <button 
                      onClick={handleUpload}
                      className="mt-4 bg-white text-black px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all"
                    >
                      Select File
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Tier 1 Data', desc: 'Premium credit header data', icon: CheckCircle2 },
                  { label: 'Litigation Scrub', desc: 'TCPA & DNC compliance', icon: CheckCircle2 },
                  { label: 'Fast Results', desc: 'Average 5-10 min turnaround', icon: CheckCircle2 },
                ].map((feature, i) => (
                  <div key={i} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-400">
                      <feature.icon size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{feature.label}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Pricing Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Base Price</span>
                    <span className="text-sm text-white font-black">$0.15 / hit</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Volume Discount</span>
                    <span className="text-sm text-green-400 font-black">-15%</span>
                  </div>
                  <div className="h-px bg-zinc-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white font-black uppercase tracking-widest">Your Price</span>
                    <span className="text-xl text-blue-400 font-black">$0.12 / hit</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3">
                  <AlertCircle className="text-blue-400 shrink-0" size={18} />
                  <p className="text-[10px] text-blue-300 leading-relaxed font-medium">
                    You only pay for successful hits. If we can't find data, you keep your credits.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Template</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                  Download our CSV template to ensure your data is formatted correctly for the best results.
                </p>
                <button className="w-full flex items-center justify-center gap-2 p-3 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 transition-all">
                  <Download size={14} />
                  Download CSV Template
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">List Name</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Date</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Hits</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-all">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg">
                          <FileText size={16} className="text-zinc-400" />
                        </div>
                        <span className="text-sm font-bold text-white">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-xs text-zinc-400 font-medium">{item.date}</td>
                    <td className="p-6">
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-md border border-green-500/20">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-6 text-sm font-bold text-white">{item.hits}</td>
                    <td className="p-6 text-right">
                      <button className="text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ml-auto">
                        <Download size={12} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeTab === 'single' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Single Search</h2>
              <p className="text-sm text-zinc-500 font-medium">Search by property address or owner name</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Property Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 123 Main St, Miami, FL 33101"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Owner First Name</label>
                  <input type="text" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Owner Last Name</label>
                  <input type="text" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2">
                <Zap size={18} fill="currentColor" />
                Search & Skip Trace ($0.15)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
