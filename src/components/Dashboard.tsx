import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead } from '../types';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { cn } from '../lib/utils';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [buyersCount, setBuyersCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    dead: 0
  });

  useEffect(() => {
    const qLeads = query(
      collection(db, 'leads'),
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadsData);
      
      setStats({
        total: leadsData.length,
        active: leadsData.filter(l => !['Closed', 'Dead'].includes(l.status)).length,
        closed: leadsData.filter(l => l.status === 'Closed').length,
        dead: leadsData.filter(l => l.status === 'Dead').length
      });
    });

    const qBuyers = query(
      collection(db, 'buyers'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribeBuyers = onSnapshot(qBuyers, (snapshot) => {
      setBuyersCount(snapshot.docs.length);
    });

    return () => {
      unsubscribeLeads();
      unsubscribeBuyers();
    };
  }, [user.uid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return '#3b82f6';
      case 'Contacted': return '#8b5cf6';
      case 'Appointment': return '#f59e0b';
      case 'Under Contract': return '#10b981';
      case 'Closed': return '#059669';
      case 'Dead': return '#ef4444';
      default: return '#71717a';
    }
  };

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name,
      value: value as number,
      color: getStatusColor(name)
    }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 6);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
    <div className="bg-zinc-900/50 border border-zinc-800 p-4 md:p-6 rounded-2xl space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-1.5 md:p-2 bg-zinc-800 rounded-lg">
          <Icon size={18} className="text-zinc-400" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider font-medium">{title}</p>
        <h3 className="text-2xl md:text-3xl font-bold mt-1">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm">Welcome back, {user.displayName?.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-400">
          <Clock size={14} />
          Last updated: Just now
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <StatCard title="Total Leads" value={stats.total} icon={Building2} trend="up" trendValue="12%" />
        <StatCard title="Active Pipeline" value={stats.active} icon={TrendingUp} trend="up" trendValue="5%" />
        <StatCard title="Cash Buyers" value={buyersCount} icon={Users} />
        <StatCard title="Closed Deals" value={stats.closed} icon={DollarSign} />
        <StatCard title="Dead Leads" value={stats.dead} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold">Pipeline Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold">Recent Activity</h3>
          <div className="space-y-6">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center gap-4">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(lead.status) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lead.fullName}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{lead.status}</p>
                </div>
                <p className="text-[10px] text-zinc-600">
                  {new Date(lead.createdAt?.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8 italic">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// StatCard component
