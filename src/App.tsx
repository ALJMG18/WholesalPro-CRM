import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, logOut, db } from './firebase';
import { 
  LayoutDashboard, 
  Users, 
  Calculator as CalcIcon, 
  CheckSquare, 
  LogOut, 
  Plus, 
  Search,
  Building2,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  X,
  Send,
  ShieldAlert,
  Zap,
  Share2,
  Map as MapIcon,
  Settings as SettingsIcon,
  FileText,
  Menu,
  CreditCard,
  Zap as ZapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { cn } from './lib/utils';

import { Toaster } from 'sonner';

import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import Calculator from './components/Calculator';
import Tasks from './components/Tasks';
import Buyers from './components/Buyers';
import Blast from './components/Blast';
import Login from './components/Login';
import Admin from './components/Admin';
import PropertyFinder from './components/PropertyFinder';
import SkipTrace from './components/SkipTrace';
import Affiliates from './components/Affiliates';
import MapFinder from './components/MapFinder';
import Settings from './components/Settings';
import Documents from './components/Documents';
import Pricing from './components/Pricing';
import Automations from './components/Automations';

type View = 'dashboard' | 'leads' | 'calculator' | 'tasks' | 'buyers' | 'blast' | 'admin' | 'finder' | 'skiptrace' | 'affiliates' | 'map' | 'settings' | 'documents' | 'pricing' | 'automations';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeadsCount(snapshot.docs.length);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white font-mono text-sm tracking-widest uppercase"
        >
          Initializing WholesalePro...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isAdmin = user?.email === 'emmanueltorresconcha@gmail.com';

  const navSections = [
    {
      title: 'General',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'map', label: 'Map Search', icon: MapIcon },
      ]
    },
    {
      title: 'CRM',
      items: [
        { id: 'leads', label: 'Leads', icon: Users },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'buyers', label: 'Buyers', icon: Building2 },
        { id: 'affiliates', label: 'Affiliates', icon: Share2 },
      ]
    },
    {
      title: 'Marketing',
      items: [
        { id: 'blast', label: 'Blast', icon: Send },
      ]
    },
    {
      title: 'PropTech',
      items: [
        { id: 'finder', label: 'PropFinder', icon: Search },
        { id: 'skiptrace', label: 'SkipTrace', icon: Zap },
        { id: 'calculator', label: 'Deal Calc', icon: CalcIcon },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'pricing', label: 'Pricing', icon: CreditCard },
        { id: 'automations', label: 'Automations', icon: ZapIcon },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldAlert }] : []),
      ]
    }
  ];

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#0a0a0a] text-zinc-100 overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0a0a0a] z-50">
        <div className="flex items-center gap-3">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            className="w-8 h-8 rounded-full border border-zinc-700"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-0.5">
            <h2 className="text-sm font-serif italic font-bold">WholesalePro</h2>
            <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 uppercase tracking-widest">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Live v2.2
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400"
        >
          {isSidebarOpen ? <Menu size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop & Mobile Overlay */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed lg:relative inset-y-0 left-0 w-[280px] lg:w-64 border-r border-zinc-800 flex flex-col bg-[#0a0a0a] z-50",
                !isSidebarOpen && "hidden lg:flex"
              )}
            >
              {/* Profile Section at the Top (Yellow Area) */}
              <div className="p-6 border-b border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                      className="w-10 h-10 rounded-full border border-zinc-700 shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-white">{user.displayName || 'User'}</p>
                    <p className="text-[10px] text-zinc-500 truncate uppercase tracking-tighter">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-serif italic font-bold leading-tight">WholesalePro</h2>
                    <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 uppercase tracking-widest">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Live v2.2
                    </div>
                  </div>
                  <button 
                    onClick={logOut}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <h3 className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentView(item.id as View);
                            setIsSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group",
                            currentView === item.id 
                              ? "bg-zinc-800 text-white shadow-lg shadow-black/20" 
                              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                          )}
                        >
                          <item.icon size={16} className={cn(
                            "transition-colors",
                            currentView === item.id ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"
                          )} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-zinc-800">
                <div className="px-4 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Storage</span>
                    <span className="text-[10px] font-bold text-zinc-400">{Math.min(Math.round((leadsCount / 100) * 100), 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500/50 transition-all duration-500" 
                      style={{ width: `${Math.min((leadsCount / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-zinc-600 mt-2 uppercase tracking-tighter">
                    {leadsCount} / 100 leads used
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'dashboard' && <Dashboard user={user} />}
            {currentView === 'map' && <MapFinder user={user} />}
            {currentView === 'leads' && <Leads user={user} />}
            {currentView === 'documents' && <Documents user={user} />}
            {currentView === 'pricing' && <Pricing user={user} />}
            {currentView === 'automations' && <Automations user={user} />}
            {currentView === 'calculator' && <Calculator />}
            {currentView === 'tasks' && <Tasks user={user} />}
            {currentView === 'buyers' && <Buyers user={user} />}
            {currentView === 'blast' && <Blast user={user} />}
            {currentView === 'finder' && <PropertyFinder user={user} />}
            {currentView === 'skiptrace' && <SkipTrace />}
            {currentView === 'affiliates' && <Affiliates user={user} />}
            {currentView === 'settings' && <Settings user={user} />}
            {currentView === 'admin' && isAdmin && <Admin user={user} />}
          </motion.div>
        </AnimatePresence>
        <Toaster position="top-right" expand={false} richColors theme="dark" />
      </main>
    </div>
  );
}
