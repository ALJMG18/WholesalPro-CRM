import React, { useState } from 'react';
import { Lead, LeadStatus, ActivityType, Property } from '../types';
import { Phone, Mail, MoreVertical, Edit2, Trash2, User, Calendar, Tag, RotateCcw, FileText, Flame, MessageSquare, X, ChevronRight, CheckCircle2, Brain, ZapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { auth } from '../firebase';
import { logActivity } from '../services/activityService';
import { toast } from 'sonner';
import AIDealScorerModal from './AIDealScorerModal';

interface LeadListProps {
  leads: Lead[];
  properties?: Record<string, Property>;
  sequences?: any[];
  onEdit?: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  [LeadStatus.NEW]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [LeadStatus.CONTACTED]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [LeadStatus.QUALIFIED]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [LeadStatus.UNQUALIFIED]: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  [LeadStatus.APPOINTMENT]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [LeadStatus.UNDER_CONTRACT]: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  [LeadStatus.CLOSED]: 'bg-green-500/10 text-green-400 border-green-500/20',
  [LeadStatus.DEAD]: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const scripts = [
  {
    title: 'Apertura Empática (General)',
    script: 'Hola [Nombre], mi nombre es [Tu Nombre]. Estaba pasando por [Dirección] y me preguntaba si alguna vez has pensado en vender esa propiedad. No soy un listado de la ciudad, soy un inversionista local y busco comprar algo en efectivo en esa zona.',
  },
  {
    title: 'Absentee Owner (Dueño Ausente)',
    script: 'Hola [Nombre], te llamo por la propiedad en [Dirección]. Noté que no vives ahí y me preguntaba si mantenerla se ha vuelto un dolor de cabeza o si estarías abierto a una oferta justa en efectivo para cerrar rápido sin reparaciones.',
  },
  {
    title: 'Manejo de Objeciones (Precio)',
    script: 'Entiendo que el precio es importante. Mi oferta es en efectivo, cubro todos los gastos de cierre y compramos la casa "tal cual". No tienes que limpiar ni reparar nada. ¿Qué número tenías en mente para que esto fuera un trato ganar-ganar?',
  }
];

export const LeadList: React.FC<LeadListProps> = ({ leads, properties = {}, sequences = [], onEdit, onDelete, onRestore }) => {
  const [selectedLeadForScript, setSelectedLeadForScript] = useState<Lead | null>(null);
  const [selectedLeadForAI, setSelectedLeadForAI] = useState<Lead | null>(null);

  const getSequenceName = (id?: string) => {
    if (!id) return null;
    return sequences.find(s => s.id === id)?.name;
  };

  const generateContract = async (lead: Lead) => {
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text('LETTER OF INTENT (LOI)', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${date}`, 20, 40);
      
      // Body
      doc.setFont('helvetica', 'bold');
      doc.text('RE: Propuesta de Compra de Bienes Raíces', 20, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Estimado(a) ${lead.firstName} ${lead.lastName},`, 20, 65);
      
      const bodyText = `Esta carta tiene como objetivo formalizar mi interés en comprar la propiedad ubicada en:
${lead.address || 'DIRECCIÓN NO ESPECIFICADA'}, ${lead.city || ''}, ${lead.state || ''} ${lead.zip || ''}.

Términos Propuestos:
1. Precio de Compra: A ser determinado tras inspección.
2. Método de Pago: Efectivo (Cash).
3. Gastos de Cierre: El comprador pagará todos los gastos de cierre estándar.
4. Estado de la Propiedad: Se compra en su estado actual ("As-Is").
5. Fecha de Cierre: Dentro de los 30 días posteriores a la firma del contrato final.

Esta carta no es un contrato legalmente vinculante, sino una expresión de interés serio.`;

      const splitText = doc.splitTextToSize(bodyText, 170);
      doc.text(splitText, 20, 75);
      
      // Signature
      doc.text('__________________________', 20, 160);
      doc.text('Firma del Comprador', 20, 165);
      
      doc.text('__________________________', 120, 160);
      doc.text('Firma del Vendedor', 120, 165);
      
      doc.save(`LOI_${lead.lastName}_${lead.id.slice(0, 5)}.pdf`);
      
      if (auth.currentUser) {
        await logActivity(
          auth.currentUser.uid,
          ActivityType.CONTRACT_GENERATED,
          `generó un contrato LOI para el lead`,
          lead.id,
          lead.fullName
        );
      }
      
      toast.success('Contrato generado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el contrato');
    }
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No hay leads todavía</h3>
        <p className="text-zinc-500 max-w-xs text-sm">Comienza agregando un lead manualmente o importa una lista CSV.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {leads.map((lead) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={lead.id}
              className="group bg-zinc-900/50 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 font-bold text-lg border border-zinc-700">
                        {lead.firstName?.[0] || ''}{lead.lastName?.[0] || ''}
                      </div>
                      {lead.isHot && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-lg shadow-lg shadow-red-900/40 animate-pulse">
                          <Flame size={14} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        {lead.firstName} {lead.lastName}
                        {lead.score !== undefined && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md border border-zinc-700">
                            {lead.score}%
                          </span>
                        )}
                      </h3>
                      <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-lg border ${statusColors[lead.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <Tag className="w-4 h-4 text-zinc-500" />
                    <span>Fuente: {lead.source}</span>
                  </div>
                  {lead.sequenceId && (
                    <div className="flex items-center gap-3 text-xs text-blue-400/80">
                      <ZapIcon className="w-4 h-4" />
                      <span>Secuencia: {getSequenceName(lead.sequenceId)}</span>
                    </div>
                  )}
                  {lead.propertyDetails?.motivation && (
                    <div className="flex items-center gap-3 text-xs text-amber-400/80">
                      <Flame className="w-4 h-4" />
                      <span>Motivación: {lead.propertyDetails.motivation}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setSelectedLeadForScript(lead)}
                    className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-700"
                  >
                    <MessageSquare size={14} />
                    Guion
                  </button>
                  <button 
                    onClick={() => generateContract(lead)}
                    className="flex items-center justify-center gap-2 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-blue-500/20"
                  >
                    <FileText size={14} />
                    Contrato
                  </button>
                  <button 
                    onClick={() => setSelectedLeadForAI(lead)}
                    className="flex items-center justify-center gap-2 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-500/20"
                  >
                    <Brain size={14} />
                    AI Score
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-950/30 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
                  <Calendar size={12} />
                  {lead.createdAt?.toDate 
                    ? lead.createdAt.toDate().toLocaleDateString() 
                    : (lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'No date')}
                </div>
                <div className="flex items-center gap-2">
                  {onRestore && (
                    <button
                      onClick={() => onRestore(lead.id)}
                      className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                      title="Restaurar"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(lead)}
                      className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(lead.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title={onRestore ? "Eliminar Permanentemente" : "Mover a Papelera"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Call Scripts Modal */}
      <AnimatePresence>
        {selectedLeadForScript && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
                <div>
                  <h2 className="text-xl font-bold text-white">Guiones de Llamada</h2>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Lead: {selectedLeadForScript.fullName}</p>
                </div>
                <button
                  onClick={() => setSelectedLeadForScript(null)}
                  className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {scripts.map((s, i) => (
                  <div key={i} className="space-y-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">{s.title}</h4>
                      <button 
                        onClick={() => {
                          const text = s.script.replace('[Nombre]', selectedLeadForScript.firstName).replace('[Dirección]', selectedLeadForScript.address || 'la propiedad');
                          navigator.clipboard.writeText(text);
                          toast.success('Copiado al portapapeles');
                        }}
                        className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                      "{s.script.replace('[Nombre]', selectedLeadForScript.firstName).replace('[Dirección]', selectedLeadForScript.address || 'la propiedad')}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
                <button
                  onClick={() => setSelectedLeadForScript(null)}
                  className="w-full py-3 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all text-xs font-bold uppercase tracking-widest"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Deal Scorer Modal */}
      <AnimatePresence>
        {selectedLeadForAI && (
          <AIDealScorerModal
            lead={selectedLeadForAI}
            property={properties[selectedLeadForAI.id]}
            onClose={() => setSelectedLeadForAI(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
