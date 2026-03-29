import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Phone, Mail, User, Home, Zap, DollarSign, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Fix for default marker icons in Leaflet with React
// Using CDN URLs to avoid build issues with local image imports
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

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lat: number;
  lng: number;
  owner?: string;
  status: 'available' | 'pending' | 'sold';
}

const MOCK_PROPERTIES: Property[] = [
  { id: '1', address: '123 Ocean Dr', city: 'Miami', state: 'FL', zip: '33139', price: 450000, beds: 3, baths: 2, sqft: 1800, lat: 25.7825, lng: -80.1299, status: 'available' },
  { id: '2', address: '456 Collins Ave', city: 'Miami', state: 'FL', zip: '33139', price: 620000, beds: 4, baths: 3, sqft: 2200, lat: 25.7940, lng: -80.1285, status: 'available' },
  { id: '3', address: '789 Washington Ave', city: 'Miami', state: 'FL', zip: '33139', price: 380000, beds: 2, baths: 2, sqft: 1400, lat: 25.7750, lng: -80.1320, status: 'pending' },
  { id: '4', address: '101 Alton Rd', city: 'Miami', state: 'FL', zip: '33139', price: 550000, beds: 3, baths: 2.5, sqft: 1950, lat: 25.7880, lng: -80.1410, status: 'available' },
  { id: '5', address: '202 Meridian Ave', city: 'Miami', state: 'FL', zip: '33139', price: 410000, beds: 2, baths: 1, sqft: 1200, lat: 25.7810, lng: -80.1350, status: 'available' },
];

export default function MapFinder() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipResult, setSkipResult] = useState<{ phone: string; email: string; owner: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSkipTrace = async (property: Property) => {
    setIsSkipping(true);
    setSkipResult(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSkipResult({
      owner: 'John Doe',
      phone: '(305) 555-0123',
      email: 'john.doe@example.com'
    });
    setIsSkipping(false);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif italic font-bold">Map Search</h1>
          <p className="text-zinc-500 text-sm tracking-wide">Find properties and skip trace owners directly from the map.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text"
            placeholder="Search city, zip, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden relative z-0">
          <MapContainer 
            center={[25.7825, -80.1299]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles"
            />
            {MOCK_PROPERTIES.map(prop => (
              <Marker 
                key={prop.id} 
                position={[prop.lat, prop.lng]}
                eventHandlers={{
                  click: () => setSelectedProperty(prop),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 min-w-[200px]">
                    <h3 className="font-bold text-zinc-900">{prop.address}</h3>
                    <p className="text-xs text-zinc-600">{prop.city}, {prop.state} {prop.zip}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                      <span className="text-emerald-600 font-bold">${prop.price.toLocaleString()}</span>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">{prop.beds}BD | {prop.baths}BA</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
          <AnimatePresence mode="wait">
            {selectedProperty ? (
              <motion.div
                key={selectedProperty.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Home size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedProperty.address}</h2>
                    <p className="text-zinc-500 text-sm">{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Price</p>
                    <p className="text-lg font-bold text-emerald-500">${selectedProperty.price.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Sq Ft</p>
                    <p className="text-lg font-bold">{selectedProperty.sqft.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Bedrooms</span>
                      <span className="font-bold">{selectedProperty.beds}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Bathrooms</span>
                      <span className="font-bold">{selectedProperty.baths}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Status</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        selectedProperty.status === 'available' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {selectedProperty.status}
                      </span>
                    </div>
                  </div>
                </div>

                {!skipResult ? (
                  <button
                    onClick={() => handleSkipTrace(selectedProperty)}
                    disabled={isSkipping}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isSkipping ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Skipping...
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        Skip Trace Owner
                      </>
                    )}
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Owner</p>
                        <p className="text-sm font-bold">{skipResult.owner}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <Phone size={14} className="text-emerald-500" />
                        <span className="font-mono">{skipResult.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Mail size={14} className="text-emerald-500" />
                        <span className="truncate">{skipResult.email}</span>
                      </div>
                    </div>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded-xl transition-all">
                      Add to Leads
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
                  <MapPin size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-400 font-bold">Select a Property</p>
                  <p className="text-zinc-600 text-xs">Click a marker on the map to see details and skip trace the owner.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          background: #0a0a0a !important;
        }
        .map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
      `}</style>
    </div>
  );
}
