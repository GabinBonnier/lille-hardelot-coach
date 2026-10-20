import React, { useState, useEffect } from 'react';
import { Mascot, MascotMood } from './Mascot';
import { UserProfile, AuthMethod, TrainingLocation, RideActivity } from '../types';
import { POPULAR_LOCATIONS, searchLocations } from '../data/cities';
import { SAMPLE_CYCLING_ACTIVITIES } from '../data/defaultActivities';
import { 
  getStravaConfig, 
  saveStravaConfig, 
  redirectToStravaAuth, 
  exchangeStravaCodeForToken, 
  fetchStravaActivities 
} from '../services/stravaService';
import { 
  Check, 
  MapPin, 
  Calendar as CalendarIcon, 
  Bike, 
  Zap, 
  Heart, 
  Gauge, 
  Upload, 
  FileText, 
  ArrowRight, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info,
  ExternalLink,
  Key,
  Loader2
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile, importedActivities: RideActivity[]) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // Steps: 0 = Auth Choice, 1 = Questionnaire (Mascot), 2 = Data Import (if classic) or Auto-Sync (if Strava/Garmin)
  const [step, setStep] = useState<number>(0);

  // Auth Form State
  const [authMethod, setAuthMethod] = useState<AuthMethod>('strava');
  const [hasStravaPlus, setHasStravaPlus] = useState<boolean>(true);
  const [firstName, setFirstName] = useState<string>('Alexandre');
  const [name, setName] = useState<string>('Dubois');
  const [email, setEmail] = useState<string>('alexandre.dubois@velo.fr');
  const [password, setPassword] = useState<string>('••••••••');

  // Questionnaire State
  const [equipment, setEquipment] = useState({
    powerMeter: true,
    hrm: true,
    cyclingComputer: true,
    smartTrainer: true
  });

  const [locationSearch, setLocationSearch] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<TrainingLocation>(POPULAR_LOCATIONS[0]); // Lille 59000
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);

  const [appleCalendarLinked, setAppleCalendarLinked] = useState<boolean>(true);
  const [cyclingLevel, setCyclingLevel] = useState<UserProfile['level']>('regulier');
  const [weeklyHours, setWeeklyHours] = useState<number>(7);
  const [bikeType, setBikeType] = useState<UserProfile['bikeType']>('route_carbone');
  const [targetSpeed, setTargetSpeed] = useState<string>('27-29 km/h');
  const [preferredDays, setPreferredDays] = useState<number[]>([3, 6, 7]); // Mercredi, Samedi, Dimanche
  const [ftpWatts, setFtpWatts] = useState<number>(240);
  const [maxHr, setMaxHr] = useState<number>(188);

  // File import state (for classic auth)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importedActivities, setImportedActivities] = useState<RideActivity[]>(SAMPLE_CYCLING_ACTIVITIES);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Strava Official OAuth State
  const [stravaConfig, setStravaConfig] = useState(getStravaConfig());
  const [showStravaModal, setShowStravaModal] = useState<boolean>(false);
  const [isStravaConnecting, setIsStravaConnecting] = useState<boolean>(false);
  const [stravaConnectedAthlete, setStravaConnectedAthlete] = useState<any>(null);
  const [stravaErrorMsg, setStravaErrorMsg] = useState<string | null>(null);

  // Handle Strava OAuth callback (?code=...) on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const cfg = getStravaConfig();

    if (code && cfg.clientId && cfg.clientSecret) {
      setIsStravaConnecting(true);
      setAuthMethod('strava');
      exchangeStravaCodeForToken(code, cfg.clientId, cfg.clientSecret).then(async (res) => {
        if (res && res.accessToken) {
          setStravaConnectedAthlete(res.athlete);
          if (res.athlete?.firstname) setFirstName(res.athlete.firstname);
          if (res.athlete?.lastname) setName(res.athlete.lastname);
          if (res.athlete?.premium) setHasStravaPlus(true);

          // Fetch real Strava activities
          const realActivities = await fetchStravaActivities(res.accessToken, 30);
          if (realActivities.length > 0) {
            setImportedActivities(realActivities);
          }
          // Clean URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsStravaConnecting(false);
        } else {
          setStravaErrorMsg("Erreur lors de l'échange du jeton Strava. Vérifiez votre Client ID & Secret.");
          setIsStravaConnecting(false);
        }
      });
    }
  }, []);

  const handleConnectOfficialStrava = () => {
    const clientId = stravaConfig.clientId || '287437';
    const redirectUri = window.location.origin + window.location.pathname;
    redirectToStravaAuth(clientId, redirectUri);
  };

  // Dynamic mascot speech based on step & inputs
  const getMascotSpeech = (): { mood: MascotMood; speech: string } => {
    if (step === 0) {
      if (authMethod === 'strava') {
        return {
          mood: 'happy',
          speech: "Salut champion ! Je suis Rouli. Prêt pour Lille-Hardelot 2027 ? Connecte ton compte Strava et je m'occupe d'analyser toutes tes sorties !"
        };
      } else if (authMethod === 'garmin') {
        return {
          mood: 'proud',
          speech: "Excellente idée ! Garmin Connect nous donnera tes métriques précises de fréquence cardiaque, puissance et charge d'entraînement."
        };
      } else {
        return {
          mood: 'coaching',
          speech: "Pas de compte Strava ni Garmin ? Aucun problème ! Crée ton profil manuellement, et on importera le fichier de ton historique juste après."
        };
      }
    }

    if (step === 1) {
      return {
        mood: 'coaching',
        speech: "Pour te bâtir un plan parfait vers Hardelot (160 km et 1500m D+), dis-moi tout sur ton matériel, ta ville de départ et ton emploi du temps !"
      };
    }

    if (step === 2) {
      if (authMethod === 'classic') {
        return {
          mood: 'happy',
          speech: "Glisse ton fichier d'activités (GPX, FIT, TCX ou export CSV Strava). Si tu n'en as pas sous la main, clique sur 'Utiliser les 14 sorties démo' !"
        };
      } else {
        return {
          mood: 'celebrating',
          speech: "Synchronisation réussie ! J'ai récupéré tes 14 dernières sorties depuis ton compte. On va faire des étincelles sur les monts d'Artois !"
        };
      }
    }

    return { mood: 'happy', speech: 'En route vers la mer !' };
  };

  const currentMascot = getMascotSpeech();

  const handleStartQuestionnaire = () => {
    setStep(1);
  };

  const handleFinishQuestionnaire = () => {
    setStep(2);
    if (authMethod !== 'classic') {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
      }, 1200);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      // Simulate reading and parsing
      setTimeout(() => {
        setImportedActivities(SAMPLE_CYCLING_ACTIVITIES);
      }, 600);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setTimeout(() => {
        setImportedActivities(SAMPLE_CYCLING_ACTIVITIES);
      }, 600);
    }
  };

  const finalizeOnboarding = () => {
    const profile: UserProfile = {
      name,
      firstName,
      email,
      authMethod,
      hasStravaPlus: authMethod === 'strava' ? hasStravaPlus : false,
      equipment,
      location: selectedLocation,
      appleCalendarLinked,
      level: cyclingLevel,
      weeklyHours,
      bikeType,
      estimatedFtpWatts: ftpWatts,
      maxHeartRateBpm: maxHr,
      targetSpeedLilleHardelot: targetSpeed,
      preferredRideDays: preferredDays,
      onboardingCompleted: true
    };

    onComplete(profile, importedActivities);
  };

  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50 p-4 md:p-8 flex flex-col items-center justify-center">
      {/* Container Card */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Top Progress bar (Duolingo style) */}
        <div className="bg-slate-100 h-3 w-full">
          <div
            className="bg-duo-green h-full transition-all duration-500 rounded-r-full"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>

        {/* Header with Mascot */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Mascot mood={currentMascot.mood} speech={currentMascot.speech} size="lg" />
          </div>
        </div>

        {/* Content body based on step */}
        <div className="p-6 md:p-8">

          {/* STEP 0: AUTHENTICATION */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Connexion & Synchronisation Cycliste
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Choisis ton moyen de connexion préféré pour synchroniser tes données d’entraînement vers Lille-Hardelot 2027.
                </p>
              </div>

              {/* 3 Auth Methods Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Strava Button */}
                <button
                  type="button"
                  onClick={() => setAuthMethod('strava')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    authMethod === 'strava'
                      ? 'border-[#fc4c02] bg-orange-50/50 shadow-md ring-2 ring-[#fc4c02]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="font-extrabold text-[#fc4c02] tracking-wider text-lg flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#fc4c02]" />
                      STRAVA
                    </span>
                    {authMethod === 'strava' && (
                      <span className="w-6 h-6 rounded-full bg-[#fc4c02] text-white flex items-center justify-center text-xs">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    Connexion directe avec ton compte d’activités.
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-100/70 px-2 py-1 rounded-lg w-fit">
                    <Sparkles className="w-3 h-3" /> Compatible Strava Plus
                  </div>
                </button>

                {/* Garmin Button */}
                <button
                  type="button"
                  onClick={() => setAuthMethod('garmin')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    authMethod === 'garmin'
                      ? 'border-[#007cc3] bg-sky-50/50 shadow-md ring-2 ring-[#007cc3]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="font-extrabold text-[#007cc3] tracking-wider text-lg flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#007cc3]" />
                      GARMIN
                    </span>
                    {authMethod === 'garmin' && (
                      <span className="w-6 h-6 rounded-full bg-[#007cc3] text-white flex items-center justify-center text-xs">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    Garmin Connect (Edge, Forerunner, Fenix).
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-100 px-2 py-1 rounded-lg w-fit">
                    <Gauge className="w-3 h-3" /> Métriques physiologiques
                  </div>
                </button>

                {/* Classic Button */}
                <button
                  type="button"
                  onClick={() => setAuthMethod('classic')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    authMethod === 'classic'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="font-extrabold text-slate-800 tracking-wider text-lg flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      CLASSIQUE
                    </span>
                    {authMethod === 'classic' && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    Nom, Email & Import de ton fichier d’activités.
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg w-fit">
                    <FileText className="w-3 h-3" /> Fichiers FIT, GPX, CSV
                  </div>
                </button>
              </div>

              {/* Form details according to selection */}
              {authMethod === 'strava' && (
                <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50/40 rounded-2xl border-2 border-orange-200 space-y-4">
                  {isStravaConnecting ? (
                    <div className="flex items-center gap-3 py-3 text-orange-800">
                      <Loader2 className="w-6 h-6 animate-spin text-[#fc4c02]" />
                      <div className="text-xs">
                        <span className="font-extrabold block text-sm">Connexion officielle à Strava en cours...</span>
                        <span>Échange du jeton d'autorisation et récupération de vos activités réelles.</span>
                      </div>
                    </div>
                  ) : stravaConnectedAthlete ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-2.5">
                          {stravaConnectedAthlete.profile_medium ? (
                            <img
                              src={stravaConnectedAthlete.profile_medium}
                              alt="Strava Avatar"
                              className="w-9 h-9 rounded-full border border-orange-300"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#fc4c02] text-white flex items-center justify-center font-bold text-xs">
                              {stravaConnectedAthlete.firstname?.[0] || 'S'}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-black text-slate-800">
                              {stravaConnectedAthlete.firstname} {stravaConnectedAthlete.lastname}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Compte officiel Strava connecté
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-orange-100 text-[#fc4c02]">
                          {stravaConnectedAthlete.premium ? 'Abonné Strava Plus ⭐' : 'Compte Gratuit'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-orange-100 flex items-center justify-between">
                        <span>Sorties vélo récupérées : <strong>{importedActivities.length} activités</strong></span>
                        <button
                          type="button"
                          onClick={handleConnectOfficialStrava}
                          className="text-[11px] text-[#fc4c02] font-bold hover:underline"
                        >
                          Changer de compte
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center sm:text-left">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 justify-center sm:justify-start">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#fc4c02]" />
                          Autorisation Officielle Strava
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          En cliquant ci-dessous, vous serez redirigé vers la page officielle sécurisée de <strong>Strava</strong> pour autoriser l'accès à vos kilomètres, vitesse, dénivelé et pulsations.
                        </p>
                      </div>

                      <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
                        <button
                          type="button"
                          onClick={handleConnectOfficialStrava}
                          className="w-full sm:w-auto px-8 py-3.5 bg-[#fc4c02] hover:bg-[#e03d00] text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-95"
                        >
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
                          </svg>
                          <span>Se connecter avec Strava</span>
                        </button>
                      </div>

                      {stravaErrorMsg && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                          ⚠️ {stravaErrorMsg}
                        </div>
                      )}
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-orange-200/50">
                    <input
                      type="checkbox"
                      checked={hasStravaPlus}
                      onChange={(e) => setHasStravaPlus(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-xs text-slate-700">
                      Activer le mode <strong>Strava Plus / Premium</strong> (analyse de segments live & courbes de puissance).
                    </span>
                  </label>
                </div>
              )}

              {authMethod === 'garmin' && (
                <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">Garmin Connect ID :</span>
                    <span className="text-xs bg-white px-3 py-1 rounded-full border border-sky-300 font-bold text-sky-700">
                      garmin_alex_nord
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Prêt à récupérer l'historique complet des sorties, la fréquence cardiaque au repos et la charge aiguë.
                  </p>
                </div>
              )}

              {authMethod === 'classic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nom</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mot de passe</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartQuestionnaire}
                  className="w-full sm:w-auto px-8 py-3.5 bg-duo-green hover:bg-duo-darkGreen text-white font-extrabold rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <span>Continuer vers le questionnaire</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: TARGETED QUESTIONNAIRE (MASCOT GUIDED) */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Profil Cycliste & Configuration
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Ces informations permettent d'adapter les intensités et les parcours selon la météo et le vent.
                </p>
              </div>

              {/* Question 1: Gear / Matériel */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  1. Quel matériel possèdes-tu actuellement ?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'powerMeter', label: 'Capteur de puissance (Pédales / Manivelle)', icon: Zap, color: 'text-amber-500' },
                    { key: 'hrm', label: 'Ceinture cardiaque (HRM poitrine/bras)', icon: Heart, color: 'text-rose-500' },
                    { key: 'cyclingComputer', label: 'Compteur GPS vélo (Garmin, Wahoo, etc.)', icon: Gauge, color: 'text-sky-500' },
                    { key: 'smartTrainer', label: 'Home trainer connecté (Zwift, etc.)', icon: Bike, color: 'text-emerald-500' }
                  ].map((item) => {
                    const isChecked = equipment[item.key as keyof typeof equipment];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setEquipment((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof equipment]
                          }))
                        }
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all ${
                          isChecked
                            ? 'border-duo-green bg-emerald-50/70 text-slate-900 ring-1 ring-duo-green'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                          {item.label}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked ? 'bg-duo-green border-duo-green text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Training Base Location (City + Postal Code verification) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  2. Ta localisation de départ d’entraînement (confirmation avec code postal) :
                </label>
                
                {/* Current selected location chip */}
                <div className="flex flex-wrap items-center gap-2 bg-emerald-100/70 text-emerald-900 border border-emerald-300 px-4 py-2.5 rounded-xl font-bold text-sm">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Base active : {selectedLocation.city} ({selectedLocation.postalCode})</span>
                  <span className="text-xs font-medium text-emerald-700">• {selectedLocation.department}</span>
                  <button
                    type="button"
                    onClick={() => setIsSearchingLocation(!isSearchingLocation)}
                    className="ml-auto text-xs bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    {isSearchingLocation ? 'Fermer la liste' : 'Changer de commune'}
                  </button>
                </div>

                {/* Search / Selection input */}
                {isSearchingLocation && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Tape une ville ou un code postal (ex: 59000, Cassel, Arras, 62400...)"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                    />

                    <div className="max-h-40 overflow-y-auto space-y-1 bg-white rounded-xl border border-slate-200 p-1">
                      {searchLocations(locationSearch).map((loc) => (
                        <button
                          key={`${loc.city}-${loc.postalCode}`}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(loc);
                            setIsSearchingLocation(false);
                            setLocationSearch('');
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            selectedLocation.postalCode === loc.postalCode
                              ? 'bg-duo-green text-white font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{loc.city} ({loc.postalCode})</span>
                          <span className="opacity-80 text-[10px]">{loc.department}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Question 3: Apple Calendar integration */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-duo-blue" />
                    3. Lier mon calendrier Apple (iCloud / Calendrier) :
                  </label>
                  <button
                    type="button"
                    onClick={() => setAppleCalendarLinked(!appleCalendarLinked)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      appleCalendarLinked ? 'bg-duo-green' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        appleCalendarLinked ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Permet de détecter tes créneaux de travail, réunions et obligations pour planifier les sorties vélo uniquement quand tu es disponible.
                </p>
                {appleCalendarLinked && (
                  <div className="text-xs bg-sky-50 text-sky-800 border border-sky-200 p-2.5 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <span>Synchronisation active avec le flux de calendrier de ton appareil Apple.</span>
                  </div>
                )}
              </div>

              {/* Question 4: Additional targeted questions */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  4. Questions complémentaires pour cibler ton plan :
                </label>

                {/* Level */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'debutant', title: 'Débutant / Reprise', desc: '< 1 500 km/an' },
                    { id: 'regulier', title: 'Cyclosportif régulier', desc: '3 000 à 6 000 km/an' },
                    { id: 'expert', title: 'Confirmé / Compétiteur', desc: '> 7 000 km/an' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setCyclingLevel(lvl.id as UserProfile['level'])}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        cyclingLevel === lvl.id
                          ? 'border-duo-green bg-emerald-50 font-bold ring-1 ring-duo-green text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{lvl.title}</div>
                      <div className="text-[11px] text-slate-500">{lvl.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Hours & Target pace */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Volume hebdomadaire disponible : <span className="font-bold text-duo-green">{weeklyHours}h / semaine</span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={15}
                      step={1}
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="w-full accent-duo-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Objectif Lille-Hardelot 2027 :
                    </label>
                    <select
                      value={targetSpeed}
                      onChange={(e) => setTargetSpeed(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-duo-green"
                    >
                      <option value="23-25 km/h">Finisher serein (23-25 km/h, ~6h30)</option>
                      <option value="27-29 km/h">Allure sportive rythmée (27-29 km/h, ~5h30)</option>
                      <option value="30+ km/h">Performance peloton 1 (30+ km/h, &lt; 5h15)</option>
                    </select>
                  </div>
                </div>

                {/* Preferred days */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jours de prédilection où tu peux rouler :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {dayNames.map((day, idx) => {
                      const dayNumber = idx + 1;
                      const isSelected = preferredDays.includes(dayNumber);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setPreferredDays(preferredDays.filter((d) => d !== dayNumber));
                            } else {
                              setPreferredDays([...preferredDays, dayNumber]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-duo-green text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FTP & Max HR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">FTP estimée (Watts) :</label>
                    <input
                      type="number"
                      value={ftpWatts}
                      onChange={(e) => setFtpWatts(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">FC Max (BPM) :</label>
                    <input
                      type="number"
                      value={maxHr}
                      onChange={(e) => setMaxHr(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-sm"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleFinishQuestionnaire}
                  className="px-8 py-3.5 bg-duo-green hover:bg-duo-darkGreen text-white font-extrabold rounded-2xl shadow-lg shadow-green-500/30 flex items-center gap-2 transition-all transform active:scale-95"
                >
                  <span>Valider mon profil</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATA IMPORT / SYNC */}
          {step === 2 && (
            <div className="space-y-6">
              {authMethod !== 'classic' ? (
                /* Auto-sync flow for Strava / Garmin */
                <div className="text-center py-8 space-y-4">
                  {isSyncing ? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 border-4 border-duo-green border-t-transparent rounded-full animate-spin" />
                      <div className="font-extrabold text-slate-800 text-lg">
                        Synchronisation avec {authMethod === 'strava' ? 'Strava' : 'Garmin'}...
                      </div>
                      <p className="text-xs text-slate-500">
                        Récupération des traces GPS, watts, BPM et distances de tes 14 dernières sorties.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-emerald-100 text-duo-green rounded-full flex items-center justify-center shadow-inner">
                        <Check className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800">
                        14 sorties synchronisées avec succès !
                      </h3>
                      <p className="text-sm text-slate-600 max-w-md">
                        Toutes tes données sont intégrées dans le moteur d’intelligence d'entraînement. Nous pouvons maintenant générer ton tableau de bord et ta carte météo.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* File upload flow for classic authentication */
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      Importer ton historique de sorties
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Pour calibrer tes zones d'allures, charge ton fichier d'activités (GPX, FIT, TCX ou export CSV).
                    </p>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-emerald-400/80 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors rounded-3xl p-8 text-center flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-12 h-12 text-duo-green mb-3" />
                    <div className="font-bold text-slate-800 text-base">
                      Glisse et dépose ton fichier ici
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Fichiers acceptés : .fit, .gpx, .tcx, .csv ou archive .zip
                    </div>

                    <label className="mt-4 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-700 shadow-sm cursor-pointer">
                      Parcourir les fichiers
                      <input
                        type="file"
                        className="hidden"
                        accept=".gpx,.fit,.tcx,.csv,.zip"
                        onChange={handleFileInput}
                      />
                    </label>

                    {uploadedFile && (
                      <div className="mt-4 flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-lg font-semibold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Fichier chargé : {uploadedFile.name} (14 sorties trouvées)</span>
                      </div>
                    )}
                  </div>

                  {/* Quick sample loader shortcut */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-2xl text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-500" />
                      <span>Tu n'as pas de fichier exporté sous la main tout de suite ?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(new File([''], 'historique_sorties_alex.gpx'));
                        setImportedActivities(SAMPLE_CYCLING_ACTIVITIES);
                      }}
                      className="px-3 py-1.5 bg-white text-duo-green font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Utiliser les 14 sorties démo
                    </button>
                  </div>
                </div>
              )}

              {/* Final button */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-sm"
                >
                  Retour
                </button>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={finalizeOnboarding}
                  className="px-8 py-4 bg-duo-green hover:bg-duo-darkGreen text-white font-black text-base rounded-2xl shadow-xl shadow-green-500/30 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  <span>Accéder à mon Tableau de Bord</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal Strava API Configuration */}
      {showStravaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#fc4c02] text-white flex items-center justify-center font-black text-lg shadow-md shadow-orange-500/30">
                  S
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Connexion Officielle à Strava
                  </h3>
                  <p className="text-xs text-slate-500">
                    Autorisation de vos activités vélo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStravaModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600 space-y-2 bg-orange-50/70 p-3.5 rounded-2xl border border-orange-200">
                <span className="font-bold text-orange-900 block text-xs">
                  Comment relier l'autorisation Strava en 1 minute :
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700">
                  <li>Ouvrez <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="text-[#fc4c02] font-bold underline inline-flex items-center gap-0.5">strava.com/settings/api <ExternalLink className="w-3 h-3 inline" /></a>.</li>
                  <li>Créez une application gratuite (nom: <strong>Cap Hardelot 2027</strong>).</li>
                  <li>Dans le champ <strong>Authorization Callback Domain</strong>, écrivez exactement : <code className="bg-white px-1.5 py-0.5 rounded border border-orange-300 font-mono font-bold text-orange-700">{window.location.hostname}</code></li>
                  <li>Copiez et collez ci-dessous votre <strong>Client ID</strong> et votre <strong>Client Secret</strong> :</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client ID Strava
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 142857"
                    value={stravaConfig.clientId}
                    onChange={(e) => setStravaConfig({ ...stravaConfig, clientId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#fc4c02]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client Secret Strava
                  </label>
                  <input
                    type="password"
                    placeholder="Ex: 4a2b9c7d8e..."
                    value={stravaConfig.clientSecret}
                    onChange={(e) => setStravaConfig({ ...stravaConfig, clientSecret: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#fc4c02]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowStravaModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  saveStravaConfig(stravaConfig.clientId, stravaConfig.clientSecret);
                  setShowStravaModal(false);
                  const redirectUri = window.location.origin + window.location.pathname;
                  redirectToStravaAuth(stravaConfig.clientId, redirectUri);
                }}
                className="px-6 py-2.5 bg-[#fc4c02] hover:bg-[#e03d00] text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Enregistrer & Autoriser sur Strava</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
