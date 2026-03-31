import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Lead, LeadSource, LeadStatus, ActivityType, Property } from '../types';
import { logActivity } from '../services/activityService';
import { LeadList } from './LeadList';
import { LeadForm } from './LeadForm';
import { CSVImporter } from './CSVImporter';

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

const calculateLeadScore = (lead: Partial<Lead>) => {
  let score = 0;
  if (lead.propertyDetails?.equity === 'High') score += 40;
  if (lead.propertyDetails?.occupancy === 'Vacant') score += 40;
  if (lead.propertyDetails?.motivation) score += 20;
  
  return {
    score,
    isHot: score >= 80
  };
};
import { Map as MapIcon, List, Plus, Upload, Search, Filter, Download, MapPin, Trash2, RotateCcw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { geocodeAddress } from '../lib/geocoding';
import { toast } from 'sonner';

// Component to handle map center updates
const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, {
      duration: 1.5
    });
  }, [center, map]);
  return null;
};

// Fix for default marker icons in Leaflet with React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

if (L.Marker.prototype.options) {
  L.Marker.prototype.options.icon = DefaultIcon;
}

interface LeadsProps {
  user: FirebaseUser | null;
}

const Leads: React.FC<LeadsProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [sequences, setSequences] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [showDeleted, setShowDeleted] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'street'>('dark');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'leads'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lead));
      
      // Sort in memory to handle missing createdAt fields
      leadsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setLeads(leadsData);
    }, (error) => {
      const errInfo = handleFirestoreError(error, OperationType.LIST, 'leads');
      toast.error('Error de conexión: ' + errInfo.error);
    });

    const qProps = query(
      collection(db, 'properties'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribeProps = onSnapshot(qProps, (snapshot) => {
      const props: Record<string, Property> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Property;
        props[data.leadId] = { id: doc.id, ...data };
      });
      setProperties(props);
    });

    const qSeqs = query(
      collection(db, 'sequences'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribeSeqs = onSnapshot(qSeqs, (snapshot) => {
      setSequences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeProps();
      unsubscribeSeqs();
    };
  }, [user]);

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'fullName' | 'ownerUid'>) => {
    if (!user) return;
    setIsGeocoding(true);
    try {
      // Real geocoding
      let lat = leadData.lat;
      let lng = leadData.lng;
      
      if (leadData.address && !lat) {
        const geo = await geocodeAddress(`${leadData.address}, ${leadData.city || ''}, ${leadData.state || ''}`);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }

      const { score, isHot } = calculateLeadScore(leadData);

      const docRef = await addDoc(collection(db, 'leads'), {
        ...leadData,
        lat: lat || null,
        lng: lng || null,
        fullName: `${leadData.firstName} ${leadData.lastName}`,
        ownerUid: user.uid,
        deleted: false,
        createdAt: serverTimestamp(),
        score,
        isHot
      });

      await logActivity(
        user.uid,
        ActivityType.LEAD_CREATED,
        `creó un nuevo lead`,
        docRef.id,
        `${leadData.firstName} ${leadData.lastName}`
      );
      setIsFormOpen(false);
      toast.success('Lead agregado correctamente');
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Error al agregar el lead');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUpdateLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'fullName' | 'ownerUid'>) => {
    if (!editingLead || !user) return;
    setIsGeocoding(true);
    try {
      const leadRef = doc(db, 'leads', editingLead.id);
      
      let lat = leadData.lat;
      let lng = leadData.lng;
      
      if (leadData.address && (!lat || leadData.address !== editingLead.address)) {
        const geo = await geocodeAddress(`${leadData.address}, ${leadData.city || ''}, ${leadData.state || ''}`);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }

      const { score, isHot } = calculateLeadScore(leadData);

      await updateDoc(leadRef, {
        ...leadData,
        lat: lat || null,
        lng: lng || null,
        fullName: `${leadData.firstName} ${leadData.lastName}`,
        score,
        isHot
      });

      await logActivity(
        user.uid,
        ActivityType.LEAD_UPDATED,
        `actualizó la información del lead`,
        editingLead.id,
        `${leadData.firstName} ${leadData.lastName}`
      );
      setEditingLead(undefined);
      setIsFormOpen(false);
      toast.success('Lead actualizado correctamente');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Error al actualizar el lead');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!user) return;
    try {
      const leadRef = doc(db, 'leads', id);
      const lead = leads.find(l => l.id === id);
      await updateDoc(leadRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });

      await logActivity(
        user.uid,
        ActivityType.LEAD_DELETED,
        `movió el lead a la papelera`,
        id,
        lead?.fullName
      );

      toast.success('Lead movido a la papelera');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Error al eliminar el lead');
    }
  };

  const handleRestoreLead = async (id: string) => {
    try {
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, {
        deleted: false,
        deletedAt: null
      });
      toast.success('Lead restaurado correctamente');
    } catch (error) {
      console.error('Error restoring lead:', error);
      toast.error('Error al restaurar el lead');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    console.log('Attempting permanent delete:', id);
    try {
      await deleteDoc(doc(db, 'leads', id));
      toast.success('Lead eliminado permanentemente');
      console.log('Lead permanently deleted:', id);
    } catch (error) {
      console.error('Error permanent deleting lead:', error);
      toast.error('Error al eliminar permanentemente: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleImportLeads = async (importedLeads: Omit<Lead, 'id' | 'createdAt' | 'fullName' | 'ownerUid'>[]) => {
    if (!user) return;
    try {
      for (const l of importedLeads) {
        let lat = l.lat;
        let lng = l.lng;
        
        if (l.address && !lat) {
          const geo = await geocodeAddress(`${l.address}, ${l.city || ''}, ${l.state || ''}`);
          if (geo) {
            lat = geo.lat;
            lng = geo.lng;
          }
        }

        await addDoc(collection(db, 'leads'), {
          ...l,
          lat: lat || null,
          lng: lng || null,
          fullName: `${l.firstName} ${l.lastName}`,
          ownerUid: user.uid,
          deleted: false,
          createdAt: serverTimestamp(),
        });
      }
      setIsImporterOpen(false);
    } catch (error) {
      console.error('Error importing leads:', error);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    // Filter by deleted status
    if (showDeleted) {
      if (!lead.deleted) return false;
    } else {
      if (lead.deleted) return false;
    }

    const firstName = lead.firstName || '';
    const lastName = lead.lastName || '';
    const email = lead.email || '';
    const phone = String(lead.phone || '');

    const matchesSearch = 
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || lead.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Fuente', 'Estado', 'Notas', 'Creado'];
    const rows = leads.map(l => [
      l.firstName || '',
      l.lastName || '',
      l.email || '',
      l.phone || '',
      l.source || '',
      l.status || '',
      (l.notes || '').replace(/\n/g, ' '),
      l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString() : (l.createdAt ? new Date(l.createdAt).toLocaleDateString() : new Date().toLocaleDateString())
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif italic font-bold text-white">
            {showDeleted ? 'Papelera de Leads' : 'Gestión de Leads'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest">
            {showDeleted ? 'Leads eliminados recientemente' : 'Pipeline de Ventas & Prospección'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium border",
              showDeleted 
                ? "bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20" 
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            )}
          >
            {showDeleted ? <List size={18} /> : <Trash2 size={18} />}
            {showDeleted ? 'Ver Activos' : 'Ver Papelera'}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all text-sm font-medium border border-zinc-700"
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all text-sm font-medium border border-zinc-700"
          >
            <Upload size={18} />
            Importar
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-blue-900/20"
          >
            <Plus size={18} />
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 w-full">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'All')}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-200 appearance-none"
            >
              <option value="All">Todos los estados</option>
              {Object.values(LeadStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 h-fit">
          <button 
            onClick={() => setView('list')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              view === 'list' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => setView('map')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              view === 'map' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <MapIcon size={20} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leads.length, color: 'text-blue-400' },
          { label: 'Nuevos', value: leads.filter(l => l.status === LeadStatus.NEW).length, color: 'text-emerald-400' },
          { label: 'Cualificados', value: leads.filter(l => l.status === LeadStatus.QUALIFIED).length, color: 'text-amber-400' },
          { label: 'Contactados', value: leads.filter(l => l.status === LeadStatus.CONTACTED).length, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Lead List or Map View */}
      {view === 'list' ? (
        <LeadList
          leads={filteredLeads}
          properties={properties}
          sequences={sequences}
          onEdit={showDeleted ? undefined : (lead) => {
            setEditingLead(lead);
            setIsFormOpen(true);
          }}
          onDelete={showDeleted ? handlePermanentDelete : handleDeleteLead}
          onRestore={showDeleted ? handleRestoreLead : undefined}
        />
      ) : (
        <div className="h-[600px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden relative z-0 shadow-2xl">
          <MapContainer 
            center={
              filteredLeads.find(l => typeof l.lat === 'number' && typeof l.lng === 'number') 
                ? [filteredLeads.find(l => typeof l.lat === 'number' && typeof l.lng === 'number')!.lat!, filteredLeads.find(l => typeof l.lat === 'number' && typeof l.lng === 'number')!.lng!]
                : [25.7617, -80.1918]
            } 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <RecenterMap 
              center={
                filteredLeads.find(l => typeof l.lat === 'number' && typeof l.lng === 'number') 
                  ? [filteredLeads.find(l => typeof l.lat === 'number' && typeof l.lng === 'number')!.lat!, filteredLeads.find(l => typeof l.lat === 'number' && typeof l.lng === 'number')!.lng!]
                  : [25.7617, -80.1918]
              } 
            />
            <TileLayer
              attribution={mapStyle === 'dark' 
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
              url={mapStyle === 'dark'
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              }
            />
            {filteredLeads.filter(l => typeof l.lat === 'number' && typeof l.lng === 'number').map(lead => (
              <Marker 
                key={lead.id} 
                position={[lead.lat!, lead.lng!]}
              >
                <Popup>
                  <div className="p-2 space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900">{lead.fullName}</h3>
                      <span className="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-bold uppercase">{lead.status}</span>
                    </div>
                    <p className="text-xs text-zinc-600">{lead.address || 'No address'}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <MapPin size={12} />
                      {lead.city}, {lead.state}
                    </div>
                    <button 
                      onClick={() => {
                        setEditingLead(lead);
                        setIsFormOpen(true);
                      }}
                      className="w-full mt-2 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg"
                    >
                      Editar Lead
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
            <button 
              onClick={() => setMapStyle(mapStyle === 'dark' ? 'street' : 'dark')}
              className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-xl text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              <MapIcon size={16} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Estilo: {mapStyle === 'dark' ? 'Oscuro' : 'Calle'}</span>
            </button>
            <button 
              onClick={() => {
                const firstLead = filteredLeads.find(l => typeof l.lat === 'number');
                if (firstLead) {
                  // This will trigger the RecenterMap component
                  setSearchTerm(searchTerm); // Force re-render if needed, but center is derived from filteredLeads
                }
              }}
              className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-xl text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              <MapPin size={16} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Recentrar</span>
            </button>
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-xl text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              {filteredLeads.filter(l => typeof l.lat === 'number').length} Marcadores en el mapa
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <LeadForm
          onSave={editingLead ? handleUpdateLead : handleAddLead}
          onClose={() => {
            setIsFormOpen(false);
            setEditingLead(undefined);
          }}
          initialData={editingLead}
          isLoading={isGeocoding}
          sequences={sequences}
        />
      )}

      {isImporterOpen && (
        <CSVImporter
          onImport={handleImportLeads}
          onClose={() => setIsImporterOpen(false)}
        />
      )}
    </div>
  );
};

export default Leads;
