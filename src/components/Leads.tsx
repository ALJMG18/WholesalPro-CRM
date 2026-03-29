import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead, LeadStatus, Property } from '../types';
import { Plus, Search, MoreVertical, Phone, Mail, MapPin, Trash2, Edit2, X, ChevronDown, ChevronUp, Home, Hammer, DollarSign, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from '../lib/utils';

interface LeadsProps {
  user: User;
}

export default function Leads({ user }: LeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [customStatuses, setCustomStatuses] = useState<string[]>(['New', 'Contacted', 'Appointment', 'Under Contract', 'Closed', 'Dead']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStatusName, setNewStatusName] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [newLead, setNewLead] = useState({
    fullName: '',
    phone: '',
    email: '',
    status: 'New' as LeadStatus,
    notes: '',
    source: ''
  });

  useEffect(() => {
    const q = query(
      collection(db, 'settings'),
      where('ownerUid', '==', user.uid),
      where('type', '==', 'lead_statuses')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setCustomStatuses(data.values || []);
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(
      collection(db, 'leads'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const fetchProperties = async () => {
      const q = query(
        collection(db, 'properties'),
        where('ownerUid', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const props: Record<string, Property> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Property;
        props[data.leadId] = { id: doc.id, ...data };
      });
      setProperties(props);
    };
    fetchProperties();
  }, [leads, user.uid]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'leads'), {
        ...newLead,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewLead({ fullName: '', phone: '', email: '', status: 'New', notes: '', source: '' });
    } catch (error) {
      console.error("Error adding lead:", error);
    }
  };

  const handleUpdateProperty = async (leadId: string, field: string, value: any) => {
    const existingProp = properties[leadId];
    try {
      if (existingProp) {
        await updateDoc(doc(db, 'properties', existingProp.id), { [field]: value });
      } else {
        const docRef = await addDoc(collection(db, 'properties'), {
          leadId,
          address: '',
          ownerUid: user.uid,
          [field]: value
        });
        setProperties(prev => ({ ...prev, [leadId]: { id: docRef.id, leadId, address: '', ownerUid: user.uid, [field]: value } as Property }));
      }
    } catch (error) {
      console.error("Error updating property:", error);
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) return;
    const updatedStatuses = [...customStatuses, newStatusName.trim()];
    
    const q = query(
      collection(db, 'settings'),
      where('ownerUid', '==', user.uid),
      where('type', '==', 'lead_statuses')
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(collection(db, 'settings'), {
        type: 'lead_statuses',
        ownerUid: user.uid,
        values: updatedStatuses
      });
    } else {
      await updateDoc(doc(db, 'settings', snapshot.docs[0].id), {
        values: updatedStatuses
      });
    }
    setNewStatusName('');
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const update = {
      status: newStatus,
      note: statusNote || `Status changed to ${newStatus}`,
      timestamp: new Date()
    };

    await updateDoc(doc(db, 'leads', leadId), {
      status: newStatus,
      statusHistory: arrayUnion(update),
      updatedAt: serverTimestamp()
    });
    setStatusNote('');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'New': return "bg-blue-500/10 text-blue-400";
      case 'Contacted': return "bg-purple-500/10 text-purple-400";
      case 'Appointment': return "bg-amber-500/10 text-amber-400";
      case 'Under Contract': return "bg-emerald-500/10 text-emerald-400";
      case 'Closed': return "bg-green-500/10 text-green-400";
      case 'Dead': return "bg-red-500/10 text-red-400";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    if (ts instanceof Date) return ts.toLocaleDateString();
    return new Date(ts).toLocaleDateString();
  };

  const filteredLeads = leads.filter(l => 
    l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-zinc-500 text-sm">Manage your potential deals and seller contacts</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all"
        >
          <Plus size={18} />
          Add Lead
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder="Search leads by name, phone, or email..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredLeads.map((lead) => (
            <motion.div 
              key={lead.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all group"
            >
              <div 
                className="p-4 md:p-6 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
              >
                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-bold text-base md:text-lg truncate">{lead.fullName}</h3>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-wider",
                        getStatusBadgeClass(lead.status)
                      )}>
                        {lead.status}
                      </span>
                      <div className="md:hidden flex items-center gap-2 text-[10px] text-zinc-500">
                        <Phone size={10} />
                        {lead.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-6 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      {lead.phone || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      {lead.email || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm('Delete lead?')) deleteDoc(doc(db, 'leads', lead.id));
                    }}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedLead === lead.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedLead === lead.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 md:px-6 pb-6 border-t border-zinc-800 pt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Home size={14} />
                        Property Details
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] text-zinc-600 uppercase mb-1 block">Address</label>
                          <input 
                            type="text"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                            value={properties[lead.id]?.address || ''}
                            onChange={(e) => handleUpdateProperty(lead.id, 'address', e.target.value)}
                            placeholder="123 Main St, City, State"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] text-zinc-600 uppercase mb-1 block">ARV</label>
                            <input 
                              type="number"
                              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                              value={properties[lead.id]?.arv || ''}
                              onChange={(e) => handleUpdateProperty(lead.id, 'arv', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-600 uppercase mb-1 block">Repairs</label>
                            <input 
                              type="number"
                              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                              value={properties[lead.id]?.repairEstimate || ''}
                              onChange={(e) => handleUpdateProperty(lead.id, 'repairEstimate', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-600 uppercase mb-1 block">Asking</label>
                            <input 
                              type="number"
                              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                              value={properties[lead.id]?.askingPrice || ''}
                              onChange={(e) => handleUpdateProperty(lead.id, 'askingPrice', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} />
                        Status & Timeline
                      </h4>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <select 
                            className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                            value={lead.status}
                            onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                          >
                            {customStatuses.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {lead.statusHistory?.slice().reverse().map((update, i) => (
                            <div key={i} className="p-2 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{update.status}</span>
                                <span className="text-[8px] text-zinc-500">{formatDate(update.timestamp)}</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 italic">"{update.note}"</p>
                            </div>
                          ))}
                          {!lead.statusHistory?.length && <p className="text-[10px] text-zinc-600 italic text-center py-4">No status updates yet.</p>}
                        </div>
                        <div className="pt-2 border-t border-zinc-800">
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Add status note..."
                              className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-[10px]"
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Edit2 size={14} />
                        Notes & Source
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] text-zinc-600 uppercase mb-1 block">Lead Source</label>
                          <input 
                            type="text"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                            value={lead.source || ''}
                            onChange={(e) => updateDoc(doc(db, 'leads', lead.id), { source: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-600 uppercase mb-1 block">Notes</label>
                          <textarea 
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm h-24 resize-none"
                            value={lead.notes || ''}
                            onChange={(e) => updateDoc(doc(db, 'leads', lead.id), { notes: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex gap-3 flex-1">
                      <a 
                        href={`tel:${lead.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all"
                      >
                        <Phone size={14} />
                        Call
                      </a>
                      <a 
                        href={`mailto:${lead.email}?subject=Property Inquiry - ${properties[lead.id]?.address || ''}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all"
                      >
                        <Mail size={14} />
                        Email
                      </a>
                    </div>
                    <button 
                      onClick={async () => {
                        await addDoc(collection(db, 'tasks'), {
                          title: `Follow up with ${lead.fullName}`,
                          completed: false,
                          leadId: lead.id,
                          ownerUid: user.uid,
                          dueDate: serverTimestamp(),
                          createdAt: serverTimestamp()
                        });
                        alert('Follow-up task created!');
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-all"
                    >
                      <Clock size={14} />
                      Schedule Follow-up
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Add New Lead</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddLead} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                      value={newLead.fullName}
                      onChange={(e) => setNewLead({...newLead, fullName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Phone</label>
                      <input 
                        type="tel" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={newLead.phone}
                        onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Email</label>
                      <input 
                        type="email" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={newLead.email}
                        onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Status</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={newLead.status}
                        onChange={(e) => setNewLead({...newLead, status: e.target.value})}
                      >
                        {customStatuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-[10px] text-zinc-500 uppercase mb-2">Create New Status</p>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="New status name..."
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-xs"
                          value={newStatusName}
                          onChange={(e) => setNewStatusName(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={handleCreateStatus}
                          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Notes</label>
                    <textarea 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 h-24 resize-none"
                      value={newLead.notes}
                      onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all"
                >
                  Create Lead
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Leads component
