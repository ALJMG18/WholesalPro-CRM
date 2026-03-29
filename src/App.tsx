import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, logOut } from './firebase';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { cn } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import Calculator from './components/Calculator';
import Tasks from './components/Tasks';
import Buyers from './components/Buyers';

type View = 'dashboard' | 'leads' | 'calculator' | 'tasks' | 'buyers';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tighter italic font-serif">WholesalePro</h1>
            <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">Real Estate Wholesaling CRM</p>
          </div>
          
          <div className="p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-xl space-y-6">
            <p className="text-zinc-400 text-sm leading-relaxed">
              Manage your leads, analyze deals, and close more contracts with our specialized wholesaling workflow.
            </p>
            <button 
              onClick={signIn}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3"
            >
              <DollarSign size={20} />
              Sign in with Google
            </button>
          </div>
          
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
            Secure • Professional • Data-Driven
          </p>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'calculator', label: 'Deal Calc', icon: CalcIcon },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'buyers', label: 'Buyers', icon: Building2 },
  ];

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#0a0a0a] text-zinc-100 overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0a0a0a] z-50">
        <div className="space-y-0.5">
          <h2 className="text-xl font-serif italic font-bold">WholesalePro</h2>
          <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 uppercase tracking-widest">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Live v2.2
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400"
        >
          {isSidebarOpen ? <X size={24} /> : <Plus size={24} className="rotate-45" />}
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
                "fixed lg:relative inset-y-0 left-0 w-[280px] lg:w-64 border-r border-zinc-800 flex flex-col p-6 space-y-8 bg-[#0a0a0a] z-50",
                !isSidebarOpen && "hidden lg:flex"
              )}
            >
              <div className="hidden lg:block space-y-1">
                <h2 className="text-2xl font-serif italic font-bold">WholesalePro</h2>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live v2.2
                </div>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      currentView === item.id 
                        ? "bg-zinc-800 text-white shadow-lg" 
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="pt-6 border-t border-zinc-800 space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    className="w-8 h-8 rounded-full border border-zinc-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{user.displayName}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={logOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={18} />
                  Logout
                </button>
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
            {currentView === 'leads' && <Leads user={user} />}
            {currentView === 'calculator' && <Calculator />}
            {currentView === 'tasks' && <Tasks user={user} />}
            {currentView === 'buyers' && <Buyers user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
