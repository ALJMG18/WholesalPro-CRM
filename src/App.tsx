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
  X,
  Send,
  ShieldAlert
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
import Blast from './components/Blast';
import Login from './components/Login';
import Admin from './components/Admin';

type View = 'dashboard' | 'leads' | 'calculator' | 'tasks' | 'buyers' | 'blast' | 'admin';

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
    return <Login />;
  }

  const isAdmin = user?.email === 'emmanueltorresconcha@gmail.com';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'calculator', label: 'Deal Calc', icon: CalcIcon },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'buyers', label: 'Buyers', icon: Building2 },
    { id: 'blast', label: 'Blast', icon: Send },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: ShieldAlert });
  }

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
            {currentView === 'blast' && <Blast user={user} />}
            {currentView === 'admin' && isAdmin && <Admin user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
