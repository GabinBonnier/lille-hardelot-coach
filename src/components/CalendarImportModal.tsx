import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Upload, 
  Check, 
  AlertCircle, 
  X, 
  FileText, 
  Link as LinkIcon, 
  ShieldCheck, 
  Info,
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { parseICS, ParsedCalendarEvent } from '../services/icsParser';
import { syncCalendarFromUrl } from '../services/calendarSubscription';

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

  const [activeTab, setActiveTab] = useState<'link' | 'file'>('link');
  const [webcalUrl, setWebcalUrl] = useState(
    localStorage.getItem('cap_hardelot_calendar_sub_url') || ''
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncingUrl, setIsSyncingUrl] = useState(false);

  const handleSyncUrl = async () => {
    if (!webcalUrl.trim()) {
      setErrorMsg('Veuillez renseigner un lien de calendrier valide.');
      return;
    }

    setIsSyncingUrl(true);
    setErrorMsg(null);

    const result = await syncCalendarFromUrl(webcalUrl);
    setIsSyncingUrl(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else if (result.events.length > 0) {
      setParsedCount(result.events.length);
      setTimeout(() => {
        onImportSuccess(result.events);
        onClose();
      }, 700);
    } else {
      setErrorMsg('Aucun événement trouvé dans ce calendrier.');
    }
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const events = parseICS(text);
        if (events.length > 0) {
          localStorage.setItem('cap_hardelot_raw_ics', text);
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
                Calendrier d'Emploi du Temps
              </h3>
              <p className="text-xs text-slate-500">
                Liaison en direct pour les mises à jour automatiques
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

        {/* Tab switch */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => { setActiveTab('link'); setErrorMsg(null); }}
            className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Lien en Direct (Auto-Update)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('file'); setErrorMsg(null); }}
            className={`pb-2.5 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Fichier .ics (Export Fixe)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* TAB 1: Live Webcal / Subscription URL */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-1.5">
                <span className="font-extrabold flex items-center gap-1.5 text-sky-950">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Mises à jour automatiques de tes cours
                </span>
                <p className="text-[11px] leading-relaxed text-sky-800">
                  En collant le lien d'abonnement de ton école/université (ADE, Celcat, Ent, iCloud ou Google), l'application <strong>se mettra à jour toute seule</strong> à chaque changement de salle, cours annulé ou décalé !
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lien d'abonnement (URL iCal / Webcal)
                </label>
                <input
                  type="text"
                  placeholder="https://planning.univ-lille.fr/...ics ou webcal://..."
                  value={webcalUrl}
                  onChange={(e) => setWebcalUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Astuce : dans ton planning de fac/IUT, clique sur « S’abonner » ou « Exporter iCal » et copie le lien d'abonnement URL.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSyncUrl}
                disabled={isSyncingUrl}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSyncingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synchronisation avec ton école...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Activer la synchronisation automatique</span>
                  </>
                )}
              </button>

              {parsedCount && (
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs px-3 py-2 rounded-xl font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Calendrier synchronisé en direct ({parsedCount} créneaux trouvés) !</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Static .ics file upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
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
                  Export ponctuel depuis Apple Calendar
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

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">Exemple de démonstration ?</span>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-xs font-bold text-duo-green hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Charger un exemple</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClearCalendar();
              localStorage.removeItem('cap_hardelot_calendar_sub_url');
              localStorage.removeItem('cap_hardelot_raw_ics');
              setFileName(null);
              setParsedCount(null);
              onClose();
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
          >
            Effacer mon calendrier
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
