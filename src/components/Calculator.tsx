import { useState, useEffect } from 'react';
import { DollarSign, Calculator as CalcIcon, Percent, Hammer, Home, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function Calculator() {
  const [arv, setArv] = useState<number>(0);
  const [repairCosts, setRepairCosts] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(10000);
  const [percentage, setPercentage] = useState<number>(70);

  // MAO = (ARV * 70%) - Repairs - Wholesale Fee
  const mao = (arv * (percentage / 100)) - repairCosts - profitMargin;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wholesale Calculator</h1>
        <p className="text-zinc-500 text-sm">Calculate your Maximum Allowable Offer (MAO) using the 70% Rule</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <Home size={14} />
                After Repair Value (ARV)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="number" 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  value={arv || ''}
                  onChange={(e) => setArv(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <Hammer size={14} />
                Estimated Repair Costs
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="number" 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  value={repairCosts || ''}
                  onChange={(e) => setRepairCosts(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <Percent size={14} />
                  Rule (%)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 px-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <TrendingUp size={14} />
                  Desired Profit
                </label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 px-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white text-black p-6 md:p-8 rounded-3xl flex-1 flex flex-col justify-center items-center text-center space-y-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-60">Maximum Allowable Offer</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              {formatCurrency(mao > 0 ? mao : 0)}
            </h2>
            <div className="pt-4 border-t border-black/10 w-full">
              <p className="text-[10px] font-medium opacity-60 italic">
                Formula: (ARV × {percentage}%) - Repairs - Profit
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold">Deal Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Base Offer ({percentage}%)</span>
                <span className="font-mono">{formatCurrency(arv * (percentage / 100))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Repairs</span>
                <span className="font-mono text-red-400">-{formatCurrency(repairCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Wholesale Fee</span>
                <span className="font-mono text-red-400">-{formatCurrency(profitMargin)}</span>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between font-bold">
                <span>Final MAO</span>
                <span className="text-emerald-400">{formatCurrency(mao > 0 ? mao : 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
