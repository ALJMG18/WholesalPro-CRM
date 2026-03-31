import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Lead, Property, Task, Activity, ActivityType } from '../types';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Zap,
  MessageSquare,
  Mail as MailIcon,
  FileText,
  Trash2,
  UserPlus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';

import { cn } from '../lib/utils';

interface DashboardProps {
  user: User;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  return errInfo;
};

export default function Dashboard({ user }: DashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [buyersCount, setBuyersCount] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    dead: 0,
    pipelineValue: 0
  });

  useEffect(() => {
    if (!user) return;

    // Fetch Leads
    const qLeads = query(
      collection(db, 'leads'),
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    // Fetch Activities
    const qActivities = query(
      collection(db, 'activities'),
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeActivities = onSnapshot(qActivities, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      setActivities(activitiesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activities');
    });

    // Fetch Properties for Pipeline Value
    const qProps = query(
      collection(db, 'properties'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribeProps = onSnapshot(qProps, (snapshot) => {
      const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(propsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'properties');
    });

    // Fetch Buyers
    const qBuyers = query(
      collection(db, 'buyers'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribeBuyers = onSnapshot(qBuyers, (snapshot) => {
      setBuyersCount(snapshot.docs.length);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'buyers');
    });

    // Fetch Tasks
    const qTasks = query(
      collection(db, 'tasks'),
      where('ownerUid', '==', user.uid),
      where('completed', '==', false)
    );

    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => {
      unsubscribeLeads();
      unsubscribeActivities();
      unsubscribeProps();
      unsubscribeBuyers();
      unsubscribeTasks();
    };
  }, [user.uid]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.LEAD_CREATED: return <UserPlus size={14} className="text-blue-400" />;
      case ActivityType.LEAD_UPDATED: return <Zap size={14} className="text-amber-400" />;
      case ActivityType.LEAD_DELETED: return <Trash2 size={14} className="text-red-400" />;
      case ActivityType.SMS_SENT: return <MessageSquare size={14} className="text-emerald-400" />;
      case ActivityType.EMAIL_SENT: return <MailIcon size={14} className="text-purple-400" />;
      case ActivityType.TASK_COMPLETED: return <CheckCircle2 size={14} className="text-emerald-400" />;
      case ActivityType.CONTRACT_GENERATED: return <FileText size={14} className="text-indigo-400" />;
      default: return <Zap size={14} className="text-zinc-400" />;
    }
  };

  useEffect(() => {
    // Calculate Stats
    const activeLeads = leads.filter(l => !['Closed', 'Dead'].includes(l.status));
    const activeLeadIds = new Set(activeLeads.map(l => l.id));
    
    // Pipeline value is sum of MAO for active leads
    const pipelineValue = properties
      .filter(p => activeLeadIds.has(p.leadId))
      .reduce((sum, p) => sum + (p.mao || 0), 0);

    setStats({
      total: leads.length,
      active: activeLeads.length,
      closed: leads.filter(l => l.status === 'Closed').length,
      dead: leads.filter(l => l.status === 'Dead').length,
      pipelineValue
    });
  }, [leads, properties]);

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

  // Chart 1: Pipeline Distribution (Bar)
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name,
      value: value as number,
      color: getStatusColor(name)
    }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  // Chart 2: Leads Trend (Area)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  });

  const trendData = last7Days.map(day => {
    const count = leads.filter(l => {
      const created = l.createdAt?.toDate ? l.createdAt.toDate() : new Date();
      return created.toLocaleDateString([], { month: 'short', day: 'numeric' }) === day;
    }).length;
    return { day, count };
  });

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, isCurrency }: any) => (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-700 transition-all group">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-zinc-800 rounded-xl group-hover:scale-110 transition-transform">
          <Icon size={20} className="text-zinc-400" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">{title}</p>
        <h3 className="text-3xl font-bold mt-1 tracking-tight">
          {isCurrency ? `$${(value / 1000).toFixed(1)}k` : value}
        </h3>
      </div>
    </div>
  );

  const [budget, setBudget] = useState(500);
  const costPerLead = 0.2279; // $0.10 list + $0.12 skip + $0.0079 sms
  const leadsFromBudget = Math.floor(budget / costPerLead);
  const estimatedDeals = Math.max(1, Math.floor(leadsFromBudget * 0.0002)); // 0.02% conversion
  const estimatedRevenue = estimatedDeals * 10000;
  const netProfit = estimatedRevenue - budget;

  const today = new Date().toISOString().split('T')[0];
  const urgentTasks = tasks.filter(t => t.dueDate === today || !t.dueDate).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm">Welcome back, {user.displayName?.split(' ')?.[0] || 'User'}. Here's your wholesaling summary.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          <Clock size={14} />
          Real-time Sync Active
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pipeline Value" value={stats.pipelineValue} icon={DollarSign} isCurrency trend="up" trendValue="+8%" />
        <StatCard title="Active Leads" value={stats.active} icon={TrendingUp} trend="up" trendValue="+12%" />
        <StatCard title="Cash Buyers" value={buyersCount} icon={Users} />
        <StatCard title="Closed Deals" value={stats.closed} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ROI Calculator Widget */}
        <div className="lg:col-span-1 bg-blue-600/10 border border-blue-500/20 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <h3 className="text-lg font-bold">ROI Calculator</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>Your Budget</span>
                <span className="text-blue-400">${budget.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="10000" 
                step="100" 
                value={budget} 
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-blue-500" 
              />
            </div>

            <div className="space-y-4 border-t border-blue-500/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Leads to Purchase</span>
                <span className="text-sm font-bold text-white">{leadsFromBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Target Deals ({estimatedDeals})</span>
                <span className="text-sm font-bold text-emerald-400">+${estimatedRevenue.toLocaleString()}.00</span>
              </div>
              <div className="h-px bg-blue-500/10" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Net Profit</span>
                <span className="text-xl font-black text-blue-400">${netProfit.toLocaleString()}.00</span>
              </div>
            </div>

            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all">
              Launch Campaign
            </button>
          </div>
        </div>

        {/* Leads Trend Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Leads Acquisition Trend</h3>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last 7 Days</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Urgent Tasks</h3>
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <div className="space-y-4">
            {urgentTasks.map((task) => (
              <div key={task.id} className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl space-y-2">
                <p className="text-sm font-bold">{task.title}</p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {task.dueDate || 'Today'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {task.dueTime || 'ASAP'}
                  </div>
                </div>
              </div>
            ))}
            {urgentTasks.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs text-zinc-500 italic">All caught up for today!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pipeline Distribution */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold">Pipeline Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Activity Feed</h3>
            <Zap size={18} className="text-blue-400" />
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-zinc-800/30 rounded-2xl hover:bg-zinc-800/50 transition-colors">
                <div className="mt-1 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200">
                    <span className="font-bold text-white">{activity.leadName || 'System'}</span>
                    {' '}{activity.description}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                    {activity.createdAt?.toDate ? activity.createdAt.toDate().toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                  <Zap size={24} />
                </div>
                <p className="text-xs text-zinc-500 italic">No activity recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// StatCard component
