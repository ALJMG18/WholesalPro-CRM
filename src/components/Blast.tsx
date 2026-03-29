import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead, Buyer, Template } from '../types';
import { Send, Mail, MessageSquare, Users, Building2, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Save, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface BlastProps {
  user: User;
}

type BlastType = 'email' | 'sms';
type RecipientType = 'leads' | 'buyers';

export default function Blast({ user }: BlastProps) {
  const [blastType, setBlastType] = useState<BlastType>('email');
  const [recipientType, setRecipientType] = useState<RecipientType>('leads');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gmailTokens, setGmailTokens] = useState<any>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Template states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Load Gmail tokens and Templates
  useEffect(() => {
    const savedTokens = localStorage.getItem('gmail_tokens');
    if (savedTokens) {
      setGmailTokens(JSON.parse(savedTokens));
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
        setGmailTokens(event.data.tokens);
        localStorage.setItem('gmail_tokens', JSON.stringify(event.data.tokens));
      }
    };
    window.addEventListener('message', handleMessage);

    // Subscribe to templates
    const q = query(collection(db, 'templates'), where('ownerUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template)));
    });

    return () => {
      window.removeEventListener('message', handleMessage);
      unsubscribe();
    };
  }, [user.uid]);

  const connectGmail = async () => {
    try {
      const response = await fetch('/api/auth/gmail/url');
      const { url } = await response.json();
      window.open(url, 'gmail_auth', 'width=600,height=700');
    } catch (err) {
      setError('Failed to connect to Gmail');
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !message.trim()) return;
    setIsSavingTemplate(true);
    try {
      await addDoc(collection(db, 'templates'), {
        name: templateName,
        type: blastType,
        subject: blastType === 'email' ? subject : '',
        body: message,
        ownerUid: user.uid
      });
      setTemplateName('');
      setShowTemplateModal(false);
    } catch (err) {
      setError('Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const loadTemplate = (template: Template) => {
    setBlastType(template.type as BlastType);
    if (template.type === 'email') setSubject(template.subject || '');
    setMessage(template.body);
    setShowTemplateDropdown(false);
  };

  const deleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'templates', id));
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  const handleBlast = async () => {
    if (!message.trim() || isSubmitting) return;
    if (blastType === 'email' && (!subject.trim() || !gmailTokens)) {
      setError('Please connect Gmail and provide a subject');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResults(null);

    try {
      const q = query(collection(db, recipientType), where('ownerUid', '==', user.uid));
      const snap = await getDocs(q);
      const recipients = snap.docs
        .map(doc => doc.data())
        .filter(data => blastType === 'email' ? data.email : data.phone)
        .map(data => blastType === 'email' ? data.email : data.phone);

      if (recipients.length === 0) {
        throw new Error(`No ${recipientType} found with valid ${blastType === 'email' ? 'emails' : 'phone numbers'}`);
      }

      const endpoint = blastType === 'email' ? '/api/blast/email' : '/api/blast/sms';
      const body = blastType === 'email' 
        ? { tokens: gmailTokens, recipients, subject, body: message }
        : { recipients, message };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Blast failed');
      
      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Marketing Blast</h1>
          <p className="text-zinc-500 text-sm">Send bulk emails or SMS to your leads and buyers</p>
        </div>
        
        <div className="flex items-center gap-3">
          {blastType === 'email' && (
            <button 
              onClick={connectGmail}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                gmailTokens 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-white text-black hover:bg-zinc-200"
              )}
            >
              {gmailTokens ? <ShieldCheck size={14} /> : <Mail size={14} />}
              {gmailTokens ? 'Gmail Connected' : 'Connect Gmail'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Blast Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setBlastType('email')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                    blastType === 'email' ? "bg-zinc-800 border-zinc-700 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <Mail size={20} />
                  <span className="text-xs font-bold">Email</span>
                </button>
                <button 
                  onClick={() => setBlastType('sms')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                    blastType === 'sms' ? "bg-zinc-800 border-zinc-700 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <MessageSquare size={20} />
                  <span className="text-xs font-bold">SMS</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recipients</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setRecipientType('leads')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                    recipientType === 'leads' ? "bg-zinc-800 border-zinc-700 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <Users size={20} />
                  <span className="text-xs font-bold">Leads</span>
                </button>
                <button 
                  onClick={() => setRecipientType('buyers')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                    recipientType === 'buyers' ? "bg-zinc-800 border-zinc-700 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  <Building2 size={20} />
                  <span className="text-xs font-bold">Buyers</span>
                </button>
              </div>
            </div>

            {/* Templates List */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Templates</label>
                <button 
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  className="text-[10px] font-bold text-white flex items-center gap-1 hover:text-zinc-300 transition-colors"
                >
                  Load <ChevronDown size={12} />
                </button>
              </div>
              
              <AnimatePresence>
                {showTemplateDropdown && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {templates.filter(t => t.type === blastType).length > 0 ? (
                      templates.filter(t => t.type === blastType).map(t => (
                        <div 
                          key={t.id}
                          onClick={() => loadTemplate(t)}
                          className="group flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all"
                        >
                          <span className="text-xs font-medium truncate pr-2">{t.name}</span>
                          <button 
                            onClick={(e) => deleteTemplate(e, t.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-zinc-600 italic text-center py-2">No {blastType} templates</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Composer</label>
              <button 
                onClick={() => setShowTemplateModal(true)}
                disabled={!message.trim()}
                className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
              >
                <Save size={12} /> Save as Template
              </button>
            </div>

            {blastType === 'email' && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Subject</label>
                <input 
                  type="text"
                  placeholder="e.g. New Wholesale Deal in [City]!"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                {blastType === 'email' ? 'Email Body (HTML supported)' : 'SMS Message'}
              </label>
              <textarea 
                placeholder={blastType === 'email' ? "Write your email content here..." : "Write your text message here..."}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm h-64 resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              onClick={handleBlast}
              disabled={isSubmitting || (blastType === 'email' && !gmailTokens)}
              className={cn(
                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                isSubmitting || (blastType === 'email' && !gmailTokens)
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-white text-black hover:bg-zinc-200"
              )}
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              {isSubmitting ? 'Sending Blast...' : `Send ${blastType === 'email' ? 'Email' : 'SMS'} Blast`}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    Blast Results
                  </h3>
                  <span className="text-xs text-zinc-500">
                    {results.filter(r => r.status === 'sent').length} sent / {results.length} total
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl text-xs">
                      <span className="text-zinc-300 truncate max-w-[200px]">{res.email || res.phone}</span>
                      <span className={cn(
                        "font-bold uppercase tracking-widest text-[10px]",
                        res.status === 'sent' ? "text-emerald-500" : "text-red-500"
                      )}>
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Save Template</h3>
                <p className="text-zinc-500 text-xs">Give your template a name to reuse it later.</p>
              </div>

              <input 
                type="text"
                placeholder="e.g. Follow-up SMS 1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveTemplate}
                  disabled={isSavingTemplate || !templateName.trim()}
                  className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {isSavingTemplate ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Save Template'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
