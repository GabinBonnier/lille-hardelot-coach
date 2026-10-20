import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Copy, 
  Key, 
  Sparkles,
  Smartphone,
  Monitor
} from 'lucide-react';
import { isSupabaseConnected, configureSupabaseKeys } from '../services/supabaseClient';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('cap_hardelot_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('cap_hardelot_supabase_anon_key') || ''
  );
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const isConnected = isSupabaseConnected();

  const handleSave = () => {
    if (supabaseUrl && supabaseKey) {
      configureSupabaseKeys(supabaseUrl, supabaseKey);
      setSavedSuccess(true);
      setTimeout(() => {
        onConnectionSuccess();
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-sky-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                Synchronisation Cloud BDD (Supabase)
              </h3>
              <p className="text-xs text-slate-500">
                Reliez votre compte PC et votre smartphone en temps réel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status banner */}
        <div className="p-6 space-y-5">
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              isConnected
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                : 'bg-amber-50/70 border-amber-300 text-amber-900'
            }`}
          >
            {isConnected ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <Cloud className="w-6 h-6 text-amber-600 flex-shrink-0 animate-pulse" />
            )}
            <div className="text-xs">
              <span className="font-extrabold text-sm block">
                {isConnected ? 'Base de données Connectée & Active' : 'Mode Stockage Local (Hors-ligne)'}
              </span>
              <span>
                {isConnected
                  ? 'Vos séances et sorties se synchronisent automatiquement entre votre PC et votre smartphone !'
                  : 'Renseignez vos identifiants Supabase ci-dessous pour activer la liaison automatique PC ⇄ Mobile.'}
              </span>
            </div>
          </div>

          {/* Sync visual */}
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <Monitor className="w-5 h-5 text-duo-green mx-auto mb-1" />
              <div className="font-bold text-slate-800">Votre PC / Mac</div>
              <div className="text-[10px] text-slate-500">Planification des sorties & vent</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <Smartphone className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <div className="font-bold text-slate-800">Votre Smartphone</div>
              <div className="text-[10px] text-slate-500">Même compte & météo le matin</div>
            </div>
          </div>

          {/* Supabase credentials form */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supabase anon / public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
              />
            </div>
          </div>

          {/* Guide link */}
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <span>Vous n'avez pas encore de projet Supabase ? C'est 100% gratuit.</span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-duo-green font-bold flex items-center gap-1 hover:underline ml-2 whitespace-nowrap"
            >
              <span>Créer sur Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Continuer en mode local
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-duo-green hover:bg-duo-darkGreen text-white font-extrabold text-xs rounded-xl shadow-md shadow-green-500/20 transition-all flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>Enregistrer & Lier</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
