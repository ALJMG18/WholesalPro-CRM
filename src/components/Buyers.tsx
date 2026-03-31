import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Buyer } from '../types';
import { Plus, Search, Phone, Mail, MapPin, Trash2, X, Briefcase, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface BuyersProps {
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

export default function Buyers({ user }: BuyersProps) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [buyerToEdit, setBuyerToEdit] = useState<Buyer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBuyer, setNewBuyer] = useState({
    fullName: '',
    phone: '',
    email: '',
    buyCriteria: '',
    areas: ''
  });

  useEffect(() => {
    const q = query(
      collection(db, 'buyers'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBuyers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Buyer)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'buyers');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'buyers'), {
        ...newBuyer,
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewBuyer({ fullName: '', phone: '', email: '', buyCriteria: '', areas: '' });
    } catch (error) {
      console.error("Error adding buyer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerToEdit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { id, ...data } = buyerToEdit;
      await updateDoc(doc(db, 'buyers', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setIsEditModalOpen(false);
      setBuyerToEdit(null);
    } catch (error) {
      console.error("Error updating buyer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBuyers = buyers.filter(b => 
    b.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.areas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cash Buyers</h1>
          <p className="text-zinc-500 text-sm">Manage your network of investors and their criteria</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all"
        >
          <Plus size={18} />
          Add Buyer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder="Search buyers by name or area..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredBuyers.map((buyer) => (
            <motion.div 
              key={buyer.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{buyer.fullName}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                    <MapPin size={10} />
                    {buyer.areas || 'All Areas'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!deleteConfirmId && (
                    <button 
                      onClick={() => {
                        setBuyerToEdit(buyer);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {deleteConfirmId === buyer.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                      <button 
                        onClick={() => {
                          deleteDoc(doc(db, 'buyers', buyer.id));
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-all"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeleteConfirmId(buyer.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex items-center gap-3">
                  <Phone size={14} />
                  <span>{buyer.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={14} />
                  <span className="truncate">{buyer.email || 'No email'}</span>
                </div>
                {buyer.buyCriteria && (
                  <div className="pt-3 border-t border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Criteria</p>
                    <p className="text-xs line-clamp-2">{buyer.buyCriteria}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Buyer Modal */}
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
                <h2 className="text-2xl font-bold">Add New Buyer</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddBuyer} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                      value={newBuyer.fullName}
                      onChange={(e) => setNewBuyer({...newBuyer, fullName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Phone</label>
                      <input 
                        type="tel" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={newBuyer.phone}
                        onChange={(e) => setNewBuyer({...newBuyer, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Email</label>
                      <input 
                        type="email" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={newBuyer.email}
                        onChange={(e) => setNewBuyer({...newBuyer, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Target Areas</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Miami, Orlando, Tampa"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                      value={newBuyer.areas}
                      onChange={(e) => setNewBuyer({...newBuyer, areas: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Buy Criteria</label>
                    <textarea 
                      placeholder="e.g. SFR only, min 10% ROI, 3+ beds..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 h-24 resize-none"
                      value={newBuyer.buyCriteria}
                      onChange={(e) => setNewBuyer({...newBuyer, buyCriteria: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Buyer"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Buyer Modal */}
      <AnimatePresence>
        {isEditModalOpen && buyerToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditModalOpen(false);
                setBuyerToEdit(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Edit Buyer</h2>
                <button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setBuyerToEdit(null);
                  }} 
                  className="p-2 hover:bg-zinc-800 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditBuyer} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                      value={buyerToEdit.fullName}
                      onChange={(e) => setBuyerToEdit({...buyerToEdit, fullName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Phone</label>
                      <input 
                        type="tel" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={buyerToEdit.phone}
                        onChange={(e) => setBuyerToEdit({...buyerToEdit, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Email</label>
                      <input 
                        type="email" 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        value={buyerToEdit.email}
                        onChange={(e) => setBuyerToEdit({...buyerToEdit, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Target Areas</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Miami, Orlando, Tampa"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                      value={buyerToEdit.areas}
                      onChange={(e) => setBuyerToEdit({...buyerToEdit, areas: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Buy Criteria</label>
                    <textarea 
                      placeholder="e.g. SFR only, min 10% ROI, 3+ beds..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 h-24 resize-none"
                      value={buyerToEdit.buyCriteria}
                      onChange={(e) => setBuyerToEdit({...buyerToEdit, buyCriteria: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
