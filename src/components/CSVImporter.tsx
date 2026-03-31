import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Lead, LeadSource, LeadStatus } from '../types';
import { Upload, X, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

interface CSVImporterProps {
  onImport: (leads: Omit<Lead, 'id' | 'createdAt' | 'fullName' | 'ownerUid'>[]) => void;
  onClose: () => void;
}

export const CSVImporter: React.FC<CSVImporterProps> = ({ onImport, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Por favor, sube un archivo CSV válido.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error al procesar el archivo CSV.');
          return;
        }

        const validLeads = results.data.map((row: any) => ({
          firstName: row.firstName || row.nombre || '',
          lastName: row.lastName || row.apellido || '',
          phone: row.phone || row.telefono || '',
          email: row.email || row.correo || '',
          address: row.address || row.direccion || '',
          city: row.city || row.ciudad || '',
          state: row.state || row.estado || '',
          zip: row.zip || row.cp || '',
          source: (row.source || row.fuente || LeadSource.WEB) as LeadSource,
          status: (row.status || row.estado || LeadStatus.NEW) as LeadStatus,
          notes: row.notes || row.notas || '',
        }));

        setPreview(validLeads);
        setError(null);
      },
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (preview) {
      onImport(preview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Importar Leads
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6">
          {!preview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all
                ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800/50'}
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                accept=".csv"
              />
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">Haz clic o arrastra un archivo CSV</p>
                <p className="text-sm text-zinc-500 mt-1">Formatos aceptados: .csv</p>
              </div>
              <div className="mt-4 text-[10px] font-bold text-zinc-500 bg-zinc-800 px-4 py-1.5 rounded-full uppercase tracking-widest">
                Columnas sugeridas: firstName, lastName, phone, email, source, status, notes
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-400">Archivo procesado con éxito</p>
                  <p className="text-xs text-emerald-500/70">Se encontraron {preview.length} leads listos para importar.</p>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-2xl bg-zinc-950/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest">Nombre</th>
                      <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest">Email</th>
                      <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest">Fuente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {preview.slice(0, 5).map((lead, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-300 font-medium">{lead.firstName} {lead.lastName}</td>
                        <td className="px-4 py-3 text-zinc-400">{lead.email}</td>
                        <td className="px-4 py-3 text-zinc-500 uppercase tracking-tighter">{lead.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="p-3 text-center text-[10px] font-bold text-zinc-600 bg-zinc-900 uppercase tracking-widest">
                    Y {preview.length - 5} leads más...
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                  Cambiar archivo
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20"
                >
                  Confirmar Importación
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-sm font-bold text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
