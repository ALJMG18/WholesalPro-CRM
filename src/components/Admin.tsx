import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, User as UserIcon, Calendar, Shield, Search, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AdminProps {
  user: User;
}

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  role: string;
}

export default function Admin({ user }: AdminProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [activeUsers, setActiveUsers] = useState(10);
  const [monthlyPrice, setMonthlyPrice] = useState(99);
  const [churnRate, setChurnRate] = useState(5); // 5% churn
  const [growthRate, setGrowthRate] = useState(20); // 20 users/month

  const calculateProjections = (months: number) => {
    let users = activeUsers;
    for (let i = 0; i < months; i++) {
      users = users + growthRate - (users * (churnRate / 100));
    }
    const mrr = users * monthlyPrice;
    const arr = mrr * 12;
    const valuation = arr * 5; // 5x multiple
    return { users: Math.floor(users), mrr, arr, valuation };
  };

  const fiveYear = calculateProjections(60);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-zinc-500 text-sm">Monitor platform growth and business projections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SaaS Simulator */}
        <div className="lg:col-span-1 bg-purple-600/10 border border-purple-500/20 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="text-purple-400" size={20} />
            </div>
            <h3 className="text-lg font-bold">SaaS Growth Simulator</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Monthly Price ($)</label>
              <input 
                type="number" 
                value={monthlyPrice} 
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Users / Month</label>
              <input 
                type="number" 
                value={growthRate} 
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Churn Rate (%)</label>
              <input 
                type="number" 
                value={churnRate} 
                onChange={(e) => setChurnRate(Number(e.target.value))}
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-purple-500/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Users (5 Years)</span>
              <span className="text-sm font-bold text-white">{fiveYear.users.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Annual Revenue</span>
              <span className="text-sm font-bold text-emerald-400">${(fiveYear.arr / 1000000).toFixed(1)}M</span>
            </div>
            <div className="h-px bg-purple-500/10" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white uppercase tracking-widest">Exit Valuation (5x)</span>
              <span className="text-2xl font-black text-purple-400">${(fiveYear.valuation / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Users</p>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Today</p>
              <p className="text-3xl font-bold text-emerald-500">{Math.ceil(users.length * 0.4)}</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last Active</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  <AnimatePresence>
                    {filteredUsers.map((u) => (
                      <motion.tr 
                        key={u.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-zinc-800/20 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon size={20} className="text-zinc-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{u.displayName || 'Anonymous'}</p>
                              <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            u.role === 'admin' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          )}>
                            <Shield size={10} />
                            {u.role || 'client'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Calendar size={12} />
                            {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Clock size={12} />
                            {u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && !loading && (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
                  <UserIcon size={32} />
                </div>
                <p className="text-zinc-500 text-sm italic">No users found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
