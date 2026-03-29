import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Bell, 
  CreditCard, 
  Key, 
  Smartphone, 
  Globe, 
  Lock,
  ChevronRight,
  ExternalLink,
  Save,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'integrations' | 'notifications'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'billing', label: 'Subscription', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-serif italic font-bold">Account Settings</h1>
        <p className="text-zinc-500 text-sm tracking-wide">Manage your profile, subscription, and platform preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left",
                activeTab === tab.id 
                  ? "bg-zinc-800 text-white shadow-lg border border-zinc-700" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 md:p-8">
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    className="w-24 h-24 rounded-3xl border-2 border-zinc-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">Change</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user.displayName}</h3>
                  <p className="text-zinc-500 text-sm">{user.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                    <Shield size={10} />
                    Verified Account
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={user.displayName || ''}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user.email || ''}
                    disabled
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Language</label>
                  <select className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all appearance-none">
                    <option>Spanish (Español)</option>
                    <option>English (Inglés)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Lock size={14} />
                  <button className="text-xs hover:text-white transition-colors">Change Password</button>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Current Plan</p>
                  <h3 className="text-2xl font-bold text-white">Pro Wholesaler</h3>
                  <p className="text-zinc-400 text-sm">Next billing date: April 29, 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">$99<span className="text-sm font-normal text-zinc-500">/mo</span></p>
                  <button className="text-xs text-emerald-500 font-bold hover:underline mt-1">Manage Subscription</button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Payment Method</h3>
                <div className="flex items-center justify-between p-4 bg-black/30 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-zinc-800 rounded flex items-center justify-center text-[10px] font-bold">VISA</div>
                    <div>
                      <p className="text-sm font-bold">•••• •••• •••• 4242</p>
                      <p className="text-[10px] text-zinc-500">Expires 12/28</p>
                    </div>
                  </div>
                  <button className="text-xs text-zinc-400 hover:text-white transition-colors">Edit</button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Billing History</h3>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-800/20 rounded-2xl transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500">
                          <ExternalLink size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Invoice #WP-00{i}</p>
                          <p className="text-[10px] text-zinc-500">March {29 - i}, 2026</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold">$99.00</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="p-6 bg-black/30 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">BatchData API</h4>
                        <p className="text-[10px] text-zinc-500">Used for Skip Tracing services</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">Connected</span>
                  </div>
                  <input 
                    type="password" 
                    value="••••••••••••••••••••••••"
                    disabled
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-500"
                  />
                </div>

                <div className="p-6 bg-black/30 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Twilio Integration</h4>
                        <p className="text-[10px] text-zinc-500">Used for SMS and Voice calls</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Configure</button>
                  </div>
                </div>

                <div className="p-6 bg-black/30 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Google Maps API</h4>
                        <p className="text-[10px] text-zinc-500">Used for property visualization</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-500/20">Missing Key</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 hover:bg-zinc-800/20 rounded-2xl transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Email Notifications</p>
                    <p className="text-xs text-zinc-500">Receive daily summaries and lead alerts</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-zinc-800/20 rounded-2xl transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Browser Push</p>
                    <p className="text-xs text-zinc-500">Get real-time alerts for new messages</p>
                  </div>
                  <div className="w-12 h-6 bg-zinc-800 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-600 rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 hover:bg-zinc-800/20 rounded-2xl transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">SMS Alerts</p>
                    <p className="text-xs text-zinc-500">Urgent notifications for hot leads</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center gap-3 z-50"
          >
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
