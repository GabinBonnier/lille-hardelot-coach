import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  FileText, 
  Link, 
  ShieldCheck, 
  Info,
  Sparkles
} from 'lucide-react';
import { parseICS, ParsedCalendarEvent } from '../services/icsParser';

interface CalendarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (events: ParsedCalendarEvent[]) => void;
  onClearCalendar: () => void;
}

export const CalendarImportModal: React.FC<CalendarImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onClearCalendar
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [webcalUrl, setWebcalUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const events = parseICS(text);
        if (events.length > 0) {
          setParsedCount(events.length);
          setTimeout(() => {
            onImportSuccess(events);
            onClose();
          }, 800);
        } else {
          setErrorMsg("Aucun événement valide trouvé dans ce fichier .ics.");
        }
      } catch (err) {
        setErrorMsg("Erreur lors de la lecture du fichier .ics.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemo = () => {
    const demoIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Apple Inc.//Mac OS X 10.15.7//EN
BEGIN:VEVENT
SUMMARY:Réunion de Chantier & Projet
DTSTART:20261019T090000
DTEND:20261019T113000
END:VEVENT
BEGIN:VEVENT
SUMMARY:Présentation Client
DTSTART:20261020T140000
DTEND:20261020T160000
END:VEVENT
BEGIN:VEVENT
SUMMARY:Déjeuner Professionnel
DTSTART:20261021T123000
DTEND:20261021T140000
END:VEVENT
BEGIN:VEVENT
SUMMARY:Bilan Hebdomadaire
DTSTART:20261022T100000
DTEND:20261022T113000
END:VEVENT
BEGIN:VEVENT
SUMMARY:Foot des Enfants
DTSTART:20261024T093000
DTEND:20261024T113000
END:VEVENT
BEGIN:VEVENT
SUMMARY:Repas de Famille
DTSTART:20261025T123000
DTEND:20261025T153000
END:VEVENT
END:VCALENDAR`;

    const events = parseICS(demoIcs);
    setFileName('calendrier_apple_export.ics');
    setParsedCount(events.length);
    setTimeout(() => {
      onImportSuccess(events);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                Importer mon Calendrier Apple
              </h3>
              <p className="text-xs text-slate-500">
                Détection automatique de tes créneaux libres et occupés
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Instructions how to export from Apple Calendar */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs text-sky-900 space-y-1.5">
            <span className="font-extrabold flex items-center gap-1.5 text-sky-950">
              <Info className="w-4 h-4 text-sky-600" />
              Comment exporter depuis l'application Calendrier d'Apple :
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-sky-800">
              <li><strong>Sur Mac :</strong> Ouvre Calendrier ➔ Menu <em>Fichier</em> ➔ <em>Exporter...</em> ➔ Sauvegarde le fichier <code>.ics</code>.</li>
              <li><strong>Sur iPhone :</strong> Partage ton calendrier iCloud ou envoie le fichier <code>.ics</code> par AirDrop.</li>
            </ul>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-sky-300 bg-sky-50/30 hover:bg-sky-50/70 transition-colors rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="w-8 h-8 text-sky-500 mb-2" />
            <div className="font-bold text-slate-800 text-xs sm:text-sm">
              Glisse ton fichier .ics ici
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Fichier iCalendar (.ics) généré par Apple Calendar
            </div>

            <label className="mt-3 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 shadow-sm cursor-pointer">
              Parcourir mes fichiers
              <input
                type="file"
                className="hidden"
                accept=".ics,text/calendar"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {fileName && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-xl font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{fileName} ({parsedCount} événements importés !)</span>
              </div>
            )}

            {errorMsg && (
              <div className="mt-3 text-rose-600 text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}
          </div>

          {/* Shortcut: load 6 typical events */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Pas de fichier .ics sous la main ?</span>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="text-xs font-bold text-duo-green hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Charger un exemple type</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClearCalendar();
              setFileName(null);
              setParsedCount(null);
              onClose();
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
          >
            Effacer les événements importés
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
