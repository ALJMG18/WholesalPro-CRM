import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Brain, TrendingUp, AlertTriangle, CheckCircle2, Target, DollarSign, Loader2 } from 'lucide-react';
import { Lead, Property } from '../types';
import { analyzeDeal, DealAnalysis } from '../services/aiService';
import { cn } from '../lib/utils';

interface AIDealScorerModalProps {
  lead: Lead;
  property?: Property;
  onClose: () => void;
}

export default function AIDealScorerModal({ lead, property, onClose }: AIDealScorerModalProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getAnalysis = async () => {
      try {
        setLoading(true);
        const result = await analyzeDeal(lead, property);
        setAnalysis(result);
      } catch (err) {
        console.error('AI Analysis error:', err);
        setError('Failed to generate AI analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    getAnalysis();
  }, [lead, property]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative my-8"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Brain className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight italic font-serif">AI Deal Analysis</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Lead: {lead.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
            <X size={24} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <Brain className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={24} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-white font-bold text-lg">Gemini is analyzing the deal...</p>
                <p className="text-zinc-500 text-sm max-w-xs">Evaluating property data, motivation, and market potential.</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4">
              <AlertTriangle size={48} className="text-red-500 mx-auto opacity-50" />
              <p className="text-zinc-400">{error}</p>
              <button onClick={onClose} className="px-6 py-2 bg-zinc-800 text-white rounded-xl text-sm font-bold">Close</button>
            </div>
          ) : analysis && (
            <div className="space-y-8">
              {/* Score & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800 relative overflow-hidden group">
                  <div className={cn(
                    "absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20",
                    analysis.score >= 80 ? "bg-emerald-500" : analysis.score >= 50 ? "bg-amber-500" : "bg-red-500"
                  )} />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Deal Score</span>
                  <span className={cn(
                    "text-6xl font-black font-serif italic",
                    analysis.score >= 80 ? "text-emerald-400" : analysis.score >= 50 ? "text-amber-400" : "text-red-400"
                  )}>
                    {analysis.score}
                  </span>
                  <span className="text-[10px] text-zinc-600 mt-2 font-mono uppercase">Out of 100</span>
                </div>
                <div className="md:col-span-2 p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingUp size={14} />
                    Executive Summary
                  </h4>
                  <p className="text-zinc-300 text-sm leading-relaxed italic">"{analysis.summary}"</p>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Key Strengths
                  </h4>
                  <div className="space-y-2">
                    {analysis.pros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-zinc-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {pro}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Potential Risks
                  </h4>
                  <div className="space-y-2">
                    {analysis.cons.map((con, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs text-zinc-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        {con}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategy & Profit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-3">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} />
                    Recommended Strategy
                  </h4>
                  <p className="text-white font-bold">{analysis.strategy}</p>
                </div>
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-3">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={14} />
                    Est. Wholesale Fee
                  </h4>
                  <p className="text-white font-bold text-xl">{analysis.estimatedProfit}</p>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
