import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Lead, Property } from '../types';
import { FileText, Download, Printer, ChevronRight, User as UserIcon, MapPin, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DocumentsProps {
  user: User;
}

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'ps',
    name: 'Purchase & Sale Agreement',
    description: 'Standard contract between Buyer and Seller for property acquisition.',
    content: `PURCHASE AND SALE AGREEMENT

This Agreement is made this {{DATE}} by and between {{OWNER_NAME}} ("Seller") and {{MY_NAME}} ("Buyer").

1. PROPERTY: Seller agrees to sell and Buyer agrees to buy the property located at:
{{PROPERTY_ADDRESS}}

2. PURCHASE PRICE: The total purchase price to be paid by Buyer is {{PRICE}}.

3. CLOSING: This transaction shall close on or before {{CLOSING_DATE}}.

4. INSPECTION: Buyer shall have {{INSPECTION_DAYS}} days to inspect the property.

SELLER: ____________________    BUYER: ____________________
`
  },
  {
    id: 'assignment',
    name: 'Assignment of Contract',
    description: 'Assign your rights in a P&S agreement to an end buyer for a fee.',
    content: `ASSIGNMENT OF REAL ESTATE PURCHASE AND SALE AGREEMENT

This Assignment is made this {{DATE}} by and between {{MY_NAME}} ("Assignor") and {{BUYER_NAME}} ("Assignee").

WHEREAS, Assignor entered into a Purchase and Sale Agreement with {{OWNER_NAME}} ("Seller") dated {{CONTRACT_DATE}} for the property located at:
{{PROPERTY_ADDRESS}}

1. ASSIGNMENT: Assignor hereby assigns all rights and interests in said contract to Assignee.

2. ASSIGNMENT FEE: Assignee shall pay Assignor an assignment fee of {{ASSIGNMENT_FEE}}.

3. TOTAL PRICE: Assignee agrees to pay the original purchase price of {{PRICE}} plus the assignment fee.

ASSIGNOR: ____________________    ASSIGNEE: ____________________
`
  }
];

export default function Documents({ user }: DocumentsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const qLeads = query(collection(db, 'leads'), where('ownerUid', '==', user.uid));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    });

    const qProps = query(collection(db, 'properties'), where('ownerUid', '==', user.uid));
    const unsubscribeProps = onSnapshot(qProps, (snapshot) => {
      const props: Record<string, Property> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Property;
        props[data.leadId] = { id: doc.id, ...data };
      });
      setProperties(props);
    });

    return () => {
      unsubscribeLeads();
      unsubscribeProps();
    };
  }, [user.uid]);

  useEffect(() => {
    if (selectedLead && selectedTemplate) {
      const prop = properties[selectedLead.id];
      let content = selectedTemplate.content;
      
      const replacements: Record<string, string> = {
        '{{DATE}}': new Date().toLocaleDateString(),
        '{{OWNER_NAME}}': selectedLead.fullName,
        '{{MY_NAME}}': user.displayName || 'WholesalePro User',
        '{{PROPERTY_ADDRESS}}': prop?.address || '[PROPERTY ADDRESS MISSING]',
        '{{PRICE}}': prop?.askingPrice ? `$${prop.askingPrice.toLocaleString()}` : '$0.00',
        '{{CLOSING_DATE}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        '{{INSPECTION_DAYS}}': '10',
        '{{BUYER_NAME}}': '[END BUYER NAME]',
        '{{CONTRACT_DATE}}': new Date().toLocaleDateString(),
        '{{ASSIGNMENT_FEE}}': '$5,000.00'
      };

      Object.entries(replacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(key, 'g'), value);
      });

      setPreviewContent(content);
    }
  }, [selectedLead, selectedTemplate, properties, user.displayName]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // In a real app, this would trigger a PDF generation or a print dialog
      window.print();
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-serif italic font-bold">Document Generator</h1>
        <p className="text-zinc-500 text-sm tracking-wide">Generate professional contracts instantly using your lead data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Select Template & Lead */}
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white">1</span>
                Select Template
              </h3>
              <div className="space-y-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all",
                      selectedTemplate?.id === t.id 
                        ? "bg-emerald-500/10 border-emerald-500/50 text-white" 
                        : "bg-black/20 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-[10px] opacity-60 mt-1">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-white">2</span>
                Select Lead
              </h3>
              <select 
                className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none transition-all"
                onChange={(e) => setSelectedLead(leads.find(l => l.id === e.target.value) || null)}
                value={selectedLead?.id || ''}
              >
                <option value="">-- Choose a Lead --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.fullName}</option>
                ))}
              </select>
              {selectedLead && (
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <UserIcon size={14} className="text-emerald-500" />
                    {selectedLead.fullName}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <MapPin size={12} />
                    {properties[selectedLead.id]?.address || 'No address set'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Preview & Generate */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col h-full min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} />
                Document Preview
              </h3>
              {selectedLead && selectedTemplate && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Printer size={14} />}
                    Print / PDF
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-white text-black p-8 md:p-12 rounded-2xl shadow-inner overflow-y-auto font-serif text-sm leading-relaxed whitespace-pre-wrap print:p-0 print:shadow-none">
              {selectedLead && selectedTemplate ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {previewContent}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                  <FileText size={48} className="opacity-20" />
                  <p className="font-sans text-center">Select a template and a lead to generate your contract preview.</p>
                </div>
              )}
            </div>
          </div>
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
            <span className="text-sm font-bold">Document generated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-0, .print\\:p-0 * {
            visibility: visible;
          }
          .print\\:p-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm !important;
          }
        }
      `}</style>
    </div>
  );
}
