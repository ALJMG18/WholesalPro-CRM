import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  Mail, 
  MessageSquare, 
  Clock, 
  Save,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ZapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Step {
  day: number;
  type: 'email' | 'sms';
  subject?: string;
  body: string;
}

interface Sequence {
  id: string;
  name: string;
  steps: Step[];
  ownerUid: string;
}

interface AutomationsProps {
  user: User | null;
}

export default function Automations({ user }: AutomationsProps) {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [processing, setProcessing] = useState(false);
  const [gmailTokens, setGmailTokens] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'sequences'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSequences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sequence)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
        setGmailTokens(event.data.tokens);
        toast.success('Gmail connected for automations');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGmail = async () => {
    try {
      const response = await fetch('/api/auth/gmail/url');
      const { url } = await response.json();
      window.open(url, 'gmail_auth', 'width=600,height=700');
    } catch (error) {
      toast.error('Failed to connect Gmail');
    }
  };

  const handleSaveSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingSequence) return;

    try {
      if (editingSequence.id) {
        const { id, ...data } = editingSequence;
        await updateDoc(doc(db, 'sequences', id), data);
        toast.success('Sequence updated');
      } else {
        await addDoc(collection(db, 'sequences'), {
          ...editingSequence,
          ownerUid: user.uid
        });
        toast.success('Sequence created');
      }
      setIsAdding(false);
      setEditingSequence(null);
    } catch (error) {
      toast.error('Failed to save sequence');
    }
  };

  const handleDeleteSequence = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sequence?')) return;
    try {
      await deleteDoc(doc(db, 'sequences', id));
      toast.success('Sequence deleted');
    } catch (error) {
      toast.error('Failed to delete sequence');
    }
  };

  const runAutomations = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      // Fetch all leads for this user
      const leadsSnap = await getDocs(query(collection(db, 'leads'), where('ownerUid', '==', user.uid)));
      const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const response = await fetch('/api/automations/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads,
          sequences,
          gmailTokens
        })
      });

      const { results } = await response.json();
      
      // Update leads in Firestore based on results
      for (const res of results) {
        if (res.status !== 'failed') {
          await updateDoc(doc(db, 'leads', res.leadId), {
            currentStepIndex: res.step,
            lastStepRunAt: new Date().toISOString()
          });
        }
      }

      const successCount = results.filter((r: any) => r.status !== 'failed').length;
      toast.success(`Automations processed: ${successCount} actions taken`);
    } catch (error) {
      console.error('Automation error:', error);
      toast.error('Failed to process automations');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif italic font-bold text-white tracking-tight">
            Drip Marketing Automations
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Set up automated follow-up sequences for your leads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!gmailTokens && (
            <button 
              onClick={handleConnectGmail}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
            >
              <Mail size={14} />
              Connect Gmail
            </button>
          )}
          <button 
            onClick={runAutomations}
            disabled={processing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run Automations Now
          </button>
          <button 
            onClick={() => {
              setEditingSequence({ id: '', name: '', steps: [], ownerUid: user?.uid || '' });
              setIsAdding(true);
            }}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Plus size={14} />
            New Sequence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sequences List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Active Sequences</h2>
          {sequences.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-800 rounded-3xl text-center">
              <p className="text-zinc-600 text-sm">No sequences created yet.</p>
            </div>
          ) : (
            sequences.map(seq => (
              <div 
                key={seq.id}
                onClick={() => setEditingSequence(seq)}
                className={cn(
                  "p-5 rounded-3xl border transition-all cursor-pointer group",
                  editingSequence?.id === seq.id 
                    ? "bg-zinc-900 border-blue-500/50" 
                    : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold">{seq.name}</h3>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">
                      {seq.steps.length} Steps • {seq.steps.reduce((acc, s) => Math.max(acc, s.day), 0)} Days
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSequence(seq.id);
                    }}
                    className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {editingSequence ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8"
              >
                <form onSubmit={handleSaveSequence} className="space-y-8">
                  <div className="flex items-center justify-between">
                    <input 
                      type="text"
                      value={editingSequence.name}
                      onChange={e => setEditingSequence({...editingSequence, name: e.target.value})}
                      placeholder="Sequence Name (e.g. Cold Lead Follow-up)"
                      className="bg-transparent text-2xl font-serif italic font-bold text-white border-none focus:ring-0 p-0 w-full placeholder:text-zinc-700"
                      required
                    />
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                    >
                      <Save size={14} />
                      Save Sequence
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Sequence Steps</h4>
                      <button 
                        type="button"
                        onClick={() => {
                          const newSteps = [...editingSequence.steps, { day: 1, type: 'email', body: '' }];
                          setEditingSequence({...editingSequence, steps: newSteps});
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Add Step
                      </button>
                    </div>

                    <div className="space-y-4">
                      {editingSequence.steps.map((step, index) => (
                        <div key={index} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 relative group">
                          <button 
                            type="button"
                            onClick={() => {
                              const newSteps = editingSequence.steps.filter((_, i) => i !== index);
                              setEditingSequence({...editingSequence, steps: newSteps});
                            }}
                            className="absolute top-4 right-4 p-2 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>

                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700">
                              <Clock size={12} className="text-zinc-400" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">Day</span>
                              <input 
                                type="number"
                                value={step.day}
                                onChange={e => {
                                  const newSteps = [...editingSequence.steps];
                                  newSteps[index].day = parseInt(e.target.value);
                                  setEditingSequence({...editingSequence, steps: newSteps});
                                }}
                                className="bg-transparent border-none focus:ring-0 p-0 w-8 text-white text-xs font-bold"
                              />
                            </div>

                            <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                              <button 
                                type="button"
                                onClick={() => {
                                  const newSteps = [...editingSequence.steps];
                                  newSteps[index].type = 'email';
                                  setEditingSequence({...editingSequence, steps: newSteps});
                                }}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                  step.type === 'email' ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                                )}
                              >
                                Email
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newSteps = [...editingSequence.steps];
                                  newSteps[index].type = 'sms';
                                  setEditingSequence({...editingSequence, steps: newSteps});
                                }}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                  step.type === 'sms' ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                                )}
                              >
                                SMS
                              </button>
                            </div>
                          </div>

                          {step.type === 'email' && (
                            <input 
                              type="text"
                              placeholder="Email Subject"
                              value={step.subject || ''}
                              onChange={e => {
                                const newSteps = [...editingSequence.steps];
                                newSteps[index].subject = e.target.value;
                                setEditingSequence({...editingSequence, steps: newSteps});
                              }}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 transition-all outline-none"
                            />
                          )}

                          <textarea 
                            placeholder={step.type === 'email' ? "Email Body (HTML supported)" : "SMS Message"}
                            value={step.body}
                            onChange={e => {
                              const newSteps = [...editingSequence.steps];
                              newSteps[index].body = e.target.value;
                              setEditingSequence({...editingSequence, steps: newSteps});
                            }}
                            rows={4}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 transition-all outline-none resize-none"
                            required
                          />
                          
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 italic">
                            <AlertCircle size={10} />
                            Tip: Use {"{fullName}"} to personalize messages.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-[2.5rem] p-12 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
                  <ZapIcon size={32} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Select or Create a Sequence</h3>
                  <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-2">
                    Automate your follow-ups to never miss a deal. Assign leads to a sequence and let the software do the work.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingSequence({ id: '', name: '', steps: [], ownerUid: user?.uid || '' });
                    setIsAdding(true);
                  }}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700 transition-all"
                >
                  Get Started
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
