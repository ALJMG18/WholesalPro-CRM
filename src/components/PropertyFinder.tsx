import React, { useState } from 'react';
import { Search, Filter, Map as MapIcon, List, Home, AlertTriangle, UserMinus, DollarSign, Zap, ArrowRight, Loader2, Plus, Phone, Mail, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { toast } from 'sonner';
import { logActivity } from '../services/activityService';
import { ActivityType } from '../types';

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

L.Marker.prototype.options.icon = DefaultIcon;
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PropertyResult {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: string;
  equity: string;
  motivation: 'High' | 'Medium' | 'Low';
  tags: string[];
  owner: string;
  lat?: number;
  lng?: number;
}

const MOCK_PROPERTIES: PropertyResult[] = [
  { id: '1', address: '123 Maple St', city: 'Miami', state: 'FL', zip: '33101', type: 'Single Family', equity: '65%', motivation: 'High', tags: ['Vacant', 'Tax Delinquent'], owner: 'John Smith', lat: 25.7617, lng: -80.1918 },
  { id: '2', address: '456 Oak Ave', city: 'Miami', state: 'FL', zip: '33102', type: 'Multi-Family', equity: '40%', motivation: 'Medium', tags: ['Pre-Foreclosure'], owner: 'Maria Garcia', lat: 25.7717, lng: -80.2018 },
  { id: '3', address: '789 Pine Rd', city: 'Miami', state: 'FL', zip: '33101', type: 'Single Family', equity: '90%', motivation: 'High', tags: ['Absentee Owner', 'High Equity'], owner: 'Robert Wilson', lat: 25.7517, lng: -80.1818 },
  { id: '4', address: '101 Palm Dr', city: 'Miami', state: 'FL', zip: '33105', type: 'Condo', equity: '15%', motivation: 'Low', tags: ['Expired Listing'], owner: 'Linda Chen', lat: 25.7817, lng: -80.2118 },
];

interface PropertyFinderProps {
  user: User;
}

export default function PropertyFinder({ user }: PropertyFinderProps) {
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSkipTracing, setIsSkipTracing] = useState<string | null>(null);
  const [tracedResults, setTracedResults] = useState<Record<string, { phone: string, email: string }>>({});
  const [view, setView] = useState<'list' | 'map'>('list');
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate API call to property data provider
    setTimeout(() => {
      setResults(MOCK_PROPERTIES);
      setIsSearching(false);
    }, 1500);
  };

  const handleAddToLeads = async (prop: PropertyResult) => {
    setIsAdding(prop.id);
    try {
      const trace = tracedResults[prop.id];
      await addDoc(collection(db, 'leads'), {
        fullName: prop.owner,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        phone: trace?.phone || '',
        email: trace?.email || '',
        status: 'new',
        ownerUid: user.uid,
        score: prop.motivation === 'High' ? 85 : 60,
        isHot: prop.motivation === 'High',
        propertyDetails: {
          equity: prop.equity,
          occupancy: prop.tags.includes('Vacant') ? 'vacant' : 'occupied',
          motivation: prop.motivation.toLowerCase()
        },
        createdAt: serverTimestamp()
      });

      await logActivity(user.uid, ActivityType.LEAD_CREATED, `Added lead from Property Finder: ${prop.address}`);
      toast.success('Lead added successfully!');
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead');
    } finally {
      setIsAdding(null);
    }
  };

  const handleSkipTrace = async (id: string) => {
    setIsSkipTracing(id);
    try {
      const prop = results.find(p => p.id === id);
      if (!prop || !prop.owner) return;

      const [firstName, ...lastNameParts] = prop.owner.split(' ');
      const lastName = lastNameParts.join(' ');

      const response = await fetch('/api/skiptrace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          address: prop.address,
          city: prop.city,
          state: prop.state,
          zip: prop.zip
        })
      });

      if (!response.ok) throw new Error('Skip trace failed');
      const data = await response.json();

      const foundPhone = data.phone || data.results?.[0]?.phoneNumbers?.[0]?.phoneNumber;
      const foundEmail = data.email || data.results?.[0]?.emails?.[0]?.email;

      setTracedResults(prev => ({
        ...prev,
        [id]: {
          phone: foundPhone || 'Not found',
          email: foundEmail || 'Not found'
        }
      }));
    } catch (error) {
      console.error('Skip trace error:', error);
    } finally {
      setIsSkipTracing(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
            <Zap size={12} fill="currentColor" />
            PropFinder Engine v1.0
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Property Finder</h1>
          <p className="text-zinc-500 text-sm">Search millions of distressed properties and off-market deals.</p>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Search by City, Zip, or County..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['All', 'Vacant', 'Pre-Foreclosure', 'Tax Delinquent', 'Absentee Owner', 'High Equity'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
              activeFilter === filter 
                ? "bg-white text-black border-white" 
                : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Advanced Filters</h3>
              <Filter size={16} className="text-zinc-500" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Property Type</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none">
                  <option>All Types</option>
                  <option>Single Family</option>
                  <option>Multi-Family</option>
                  <option>Commercial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Min Equity %</label>
                <input type="range" className="w-full accent-blue-500" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ownership Length</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none">
                  <option>Any</option>
                  <option>5+ Years</option>
                  <option>10+ Years</option>
                  <option>20+ Years</option>
                </select>
              </div>
            </div>

            <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all">
              Apply Filters
            </button>
          </div>

          <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6 space-y-3">
            <Zap size={24} className="text-blue-500" />
            <h4 className="font-bold text-sm">Skip Trace Pro</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">Get owner phone numbers and emails instantly for $0.15 per hit.</p>
            <button className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
              {results.length > 0 ? `Showing ${results.length} properties in Miami, FL` : 'Enter a location to find deals'}
            </p>
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => setView('list')}
                className={cn("p-1.5 rounded transition-all", view === 'list' ? "bg-zinc-800 text-white" : "text-zinc-500")}
              >
                <List size={14} />
              </button>
              <button 
                onClick={() => setView('map')}
                className={cn("p-1.5 rounded transition-all", view === 'map' ? "bg-zinc-800 text-white" : "text-zinc-500")}
              >
                <MapIcon size={14} />
              </button>
            </div>
          </div>

          {view === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {results.map((prop, idx) => (
                  <motion.div
                    key={prop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all"
                  >
                    <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${prop.id}/800/450`} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {prop.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[8px] font-bold uppercase tracking-widest">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className={cn(
                        "absolute top-4 right-4 px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest",
                        prop.motivation === 'High' ? "bg-red-500 text-white" : "bg-amber-500 text-black"
                      )}>
                        {prop.motivation} Motivation
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-lg leading-tight">{prop.address}</h4>
                        <p className="text-zinc-500 text-xs">{prop.city}, {prop.state} {prop.zip}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Equity</p>
                          <p className="text-sm font-bold text-emerald-500">{prop.equity}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Owner</p>
                          <p className="text-sm font-bold truncate">{prop.owner}</p>
                        </div>
                      </div>

                      {tracedResults[prop.id] ? (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            <Zap size={10} fill="currentColor" />
                            Skip Trace Results
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-zinc-300">
                              <Phone size={12} className="text-zinc-500" />
                              {tracedResults[prop.id].phone}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-300">
                              <Mail size={12} className="text-zinc-500" />
                              {tracedResults[prop.id].email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleSkipTrace(prop.id)}
                          disabled={!!isSkipTracing}
                          className="w-full py-3 bg-blue-600/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSkipTracing === prop.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Zap size={14} fill="currentColor" />
                          )}
                          {isSkipTracing === prop.id ? 'Tracing...' : 'Skip Trace Owner ($0.15)'}
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button className="flex-1 py-3 bg-white text-black text-[10px] font-bold rounded-xl uppercase tracking-widest hover:bg-zinc-200 transition-all">
                          View Details
                        </button>
                        <button 
                          onClick={() => handleAddToLeads(prop)}
                          disabled={isAdding === prop.id}
                          className="px-4 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all disabled:opacity-50"
                        >
                          {isAdding === prop.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {results.length === 0 && !isSearching && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-800 border border-zinc-800">
                    <Home size={40} />
                  </div>
                  <div className="max-w-xs mx-auto space-y-2">
                    <h3 className="font-bold">Start your search</h3>
                    <p className="text-xs text-zinc-500">Enter a city or zip code to find distressed properties and motivated sellers.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[600px] bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden relative z-0">
              <MapContainer 
                center={[25.7617, -80.1918]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="map-tiles"
                />
                {results.map(prop => (
                  <Marker 
                    key={prop.id} 
                    position={[prop.lat!, prop.lng!]}
                  >
                    <Popup>
                      <div className="p-2 space-y-2 min-w-[200px]">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-zinc-900">{prop.address}</h3>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                            prop.motivation === 'High' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                          )}>{prop.motivation}</span>
                        </div>
                        <p className="text-xs text-zinc-600">{prop.city}, {prop.state} {prop.zip}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <DollarSign size={12} />
                          Equity: {prop.equity}
                        </div>
                        <button className="w-full mt-2 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <style>{`
                .leaflet-container {
                  background: #0a0a0a !important;
                }
                .map-tiles {
                  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
