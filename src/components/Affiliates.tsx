import { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Share2, 
  Copy, 
  Users, 
  DollarSign, 
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  Gift
} from 'lucide-react';
import { motion } from 'motion/react';

interface AffiliatesProps {
  user: User;
}

export default function Affiliates({ user }: AffiliatesProps) {
  const [copied, setCopied] = useState(false);
  const referralCode = user.uid.slice(0, 8).toUpperCase();
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: 'Total Referrals', value: '0', icon: Users, color: 'text-blue-400' },
    { label: 'Pending Payout', value: '$0.00', icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Conversion Rate', value: '0%', icon: TrendingUp, color: 'text-purple-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Affiliate Program</h1>
          <p className="text-zinc-500 text-sm">Earn 40% recurring commission for every user you refer.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-blue-400">
          <Gift size={14} />
          Partner Status: Active
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <div className="p-2 bg-zinc-800 w-fit rounded-xl">
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referral Link Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold">Your Referral Link</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Share this link with other wholesalers. When they sign up, you'll earn a commission on every payment they make.
          </p>
          
          <div className="flex items-center gap-2 p-4 bg-black rounded-2xl border border-zinc-800">
            <code className="flex-1 text-xs text-blue-400 truncate">{referralLink}</code>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
            >
              {copied ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              <Share2 size={14} />
              Share on X
            </button>
            <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              <ExternalLink size={14} />
              Marketing Kit
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold">How it Works</h3>
          <div className="space-y-4">
            {[
              { step: '01', text: 'Share your unique link with your network.' },
              { step: '02', text: 'They sign up for a WholesalePro subscription.' },
              { step: '03', text: 'You get 40% of their monthly fee, every month.' },
              { step: '04', text: 'Payouts are sent automatically via PayPal/Stripe.' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-blue-400 font-mono font-bold text-sm">{item.step}</span>
                <p className="text-sm text-zinc-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
        <h3 className="text-lg font-bold">Recent Referrals</h3>
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
            <Share2 size={24} />
          </div>
          <p className="text-xs text-zinc-500 italic">No referrals yet. Start sharing your link to earn!</p>
        </div>
      </div>
    </div>
  );
}
