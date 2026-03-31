import React, { useState } from 'react';
import { Lead, LeadSource, LeadStatus } from '../types';
import { Menu } from 'lucide-react';

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

interface LeadFormProps {
  onSave: (lead: Omit<Lead, 'id' | 'createdAt' | 'fullName' | 'ownerUid'>) => void;
  onClose: () => void;
  initialData?: Lead;
  isLoading?: boolean;
  sequences?: Sequence[];
}

export const LeadForm: React.FC<LeadFormProps> = ({ onSave, onClose, initialData, isLoading, sequences = [] }) => {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    source: initialData?.source || LeadSource.WEB,
    status: initialData?.status || LeadStatus.NEW,
    notes: initialData?.notes || '',
    sequenceId: initialData?.sequenceId || '',
    propertyDetails: {
      equity: initialData?.propertyDetails?.equity || 'Unknown',
      occupancy: initialData?.propertyDetails?.occupancy || 'Unknown',
      motivation: initialData?.propertyDetails?.motivation || '',
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Editar Lead' : 'Nuevo Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Section: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre</label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                  placeholder="Ej. Juan"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Apellido</label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                  placeholder="Ej. Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Teléfono</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                  placeholder="(555) 000-0000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                  placeholder="juan@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Section: Property Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Detalles de la Propiedad</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                placeholder="123 Calle Principal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Ciudad</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                  placeholder="Miami"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Estado</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                  placeholder="FL"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">CP</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                  placeholder="33101"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Equity</label>
                <select
                  value={formData.propertyDetails.equity}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    propertyDetails: { ...formData.propertyDetails, equity: e.target.value as any } 
                  })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200 appearance-none"
                >
                  <option value="Unknown">Desconocido</option>
                  <option value="High">High Equity (Alto)</option>
                  <option value="Low">Low Equity (Bajo)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Ocupación</label>
                <select
                  value={formData.propertyDetails.occupancy}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    propertyDetails: { ...formData.propertyDetails, occupancy: e.target.value as any } 
                  })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200 appearance-none"
                >
                  <option value="Unknown">Desconocido</option>
                  <option value="Vacant">Vacante (Vacant)</option>
                  <option value="Occupied">Ocupado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Pipeline & Notes */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Pipeline & Notas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Fuente</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200 appearance-none"
                >
                  {Object.values(LeadSource).map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200 appearance-none"
                >
                  {Object.values(LeadStatus).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Automatización (Drip Sequence)</label>
              <select
                value={formData.sequenceId}
                onChange={(e) => setFormData({ ...formData, sequenceId: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200 appearance-none"
              >
                <option value="">Sin automatización</option>
                {sequences.map((seq) => (
                  <option key={seq.id} value={seq.id}>{seq.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Motivación del Vendedor</label>
              <input
                type="text"
                value={formData.propertyDetails.motivation}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  propertyDetails: { ...formData.propertyDetails, motivation: e.target.value } 
                })}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
                placeholder="Ej. Divorcio, Herencia, Mudanza..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Notas</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-zinc-200"
                placeholder="Agregue cualquier información adicional aquí..."
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-zinc-800 text-zinc-300 rounded-2xl hover:bg-zinc-700 transition-all text-xs font-bold uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 disabled:bg-blue-600/50 transition-all text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando Dirección...
                </>
              ) : (
                initialData ? 'Actualizar Lead' : 'Guardar Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
