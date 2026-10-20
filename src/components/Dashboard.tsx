import React, { useState, useEffect } from 'react';
import { UserProfile, RideActivity, ScheduledWorkout, TrainingLocation, WeatherCondition, WindRouteRecommendation } from '../types';
import { Mascot, MascotMood } from './Mascot';
import { RideHistory } from './RideHistory';
import { WeeklyCalendar } from './WeeklyCalendar';
import { WindHeadingMap } from './WindHeadingMap';
import { LilleHardelotPlan } from './LilleHardelotPlan';
import { SupabaseModal } from './SupabaseModal';
import { isSupabaseConnected } from '../services/supabaseClient';
import { fetchLiveWeather, calculateWindRecommendation, checkDaylightSafety } from '../services/weatherService';
import { 
  Bike, 
  MapPin, 
  Wind, 
  Calendar, 
  Trophy, 
  Settings, 
  Compass, 
  Zap, 
  Heart, 
  Gauge, 
  RefreshCw, 
  ShieldCheck,
  AlertTriangle,
  User,
  Sliders,
  Database,
  Cloud
} from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  activities: RideActivity[];
  onUpdateProfile: (profile: UserProfile) => void;
  onResetOnboarding: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  activities,
  onUpdateProfile,
  onResetOnboarding
}) => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'plan2027' | 'profile'>('cockpit');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(5); // Default to Samedi (Index 5)
  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherCondition | null>(null);
  const [windRec, setWindRec] = useState<WindRouteRecommendation | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);

  // Generate initial weekly schedule based on profile
  useEffect(() => {
    loadWeatherAndBuildSchedule(profile.location);
  }, [profile.location]);

  const loadWeatherAndBuildSchedule = async (location: TrainingLocation) => {
    setIsLoadingWeather(true);
    try {
      const weather = await fetchLiveWeather(location.lat, location.lng);
      setCurrentWeather(weather);
      const rec = calculateWindRecommendation(weather.windDirectionDeg, location.city);
      setWindRec(rec);

      // Build 7 days of schedule
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const today = new Date();
      // Calculate current week Monday
      const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
      const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);

      const generatedWorkouts: ScheduledWorkout[] = days.map((dayName, idx) => {
        const rideDate = new Date(monday);
        rideDate.setDate(monday.getDate() + idx);
        const dayDateStr = rideDate.toISOString().split('T')[0];

        // Is this day preferred by user?
        const dayNumber = idx + 1; // 1 to 7
        const isPlanned = profile.preferredRideDays.includes(dayNumber);

        // Distances & types adapted to the day
        let targetDistanceKm = 50;
        let intensity: ScheduledWorkout['intensity'] = 'Endurance Fondamentale';
        let departureHour = '14:00';
        let reliefCategory: ScheduledWorkout['reliefCategory'] = 'Plaine & Faux-plat';

        if (idx === 2) {
          // Mercredi
          targetDistanceKm = 55;
          intensity = 'Rythme & Seuil';
          departureHour = '14:30';
          reliefCategory = 'Vallonné';
        } else if (idx === 5) {
          // Samedi
          targetDistanceKm = 85;
          intensity = 'Dénivelé & Monts';
          departureHour = '09:00';
          reliefCategory = 'Monts & Côtes';
        } else if (idx === 6) {
          // Dimanche
          targetDistanceKm = 105;
          intensity = 'Endurance Fondamentale';
          departureHour = '08:30';
          reliefCategory = 'Vallonné';
        } else if (idx === 1) {
          // Mardi
          targetDistanceKm = 40;
          intensity = 'Récupération Active';
          departureHour = '17:30';
          reliefCategory = 'Plaine & Faux-plat';
        }

        const estDurationMinutes = Math.round((targetDistanceKm / 27) * 60);
        const daylight = checkDaylightSafety(departureHour, estDurationMinutes, weather.sunset);

        return {
          id: `w-${idx}`,
          dayIndex: idx,
          dayDate: dayDateStr,
          dayName,
          title:
            idx === 5
              ? 'Sortie Prépa Lille-Hardelot • Monts & Relief'
              : idx === 6
              ? 'Sortie Longue Foncier • Face au Vent'
              : idx === 2
              ? 'Séance Rythme & Tenue de Vitesse'
              : 'Endurance de Base & Cadence',
          targetDistanceKm,
          estimatedDurationMinutes: estDurationMinutes,
          intensity,
          targetDepartureHour: departureHour,
          weather,
          windRoute: rec,
          daylightStatus: daylight,
          reliefCategory,
          isPlannedByCyclist: isPlanned
        };
      });

      setWorkouts(generatedWorkouts);

      // Select Saturday or first planned day
      const firstActive = generatedWorkouts.findIndex((w) => w.isPlannedByCyclist);
      if (firstActive !== -1) {
        setSelectedDayIndex(firstActive);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleToggleRideDay = (dayIndex: number) => {
    setWorkouts((prev) =>
      prev.map((w, idx) => {
        if (idx === dayIndex) {
          return { ...w, isPlannedByCyclist: !w.isPlannedByCyclist };
        }
        return w;
      })
    );
    setSelectedDayIndex(dayIndex);
  };

  const handleChangeLocation = (loc: TrainingLocation) => {
    onUpdateProfile({
      ...profile,
      location: loc
    });
  };

  const currentSelectedWorkout = workouts[selectedDayIndex] || workouts[0];

  // Dynamic mascot speech in dashboard
  const getDashboardMascotSpeech = (): { mood: MascotMood; speech: string } => {
    if (!currentWeather) {
      return { mood: 'happy', speech: 'Chargement des données météo en temps réel...' };
    }

    if (currentSelectedWorkout?.daylightStatus?.nightRisk) {
      return {
        mood: 'warning',
        speech: `Attention champion ! Pour la sortie de ${currentSelectedWorkout.targetDistanceKm} km à ${profile.location.city}, tu risques d'arriver après le coucher du soleil (${currentWeather.sunset}). Pars plus tôt ou équipe-toi de feux !`
      };
    }

    if (currentWeather.isRainy) {
      return {
        mood: 'warning',
        speech: `Pluie prévue sur ${profile.location.city} ! N'oublie pas ta veste étanche et baisse la pression de tes pneus de 0.5 bar pour éviter de glisser.`
      };
    }

    if (currentWeather.windSpeedKmh >= 25) {
      return {
        mood: 'riding',
        speech: `Bon vent de ${currentWeather.windSpeedKmh} km/h (${currentWeather.windDirectionCardinal}) ! Pars cap ${windRec?.outboundHeadingName} vent de face, et profite du retour vent dans le dos pour voler !`
      };
    }

    return {
      mood: 'proud',
      speech: `Conditions idéales sur ${profile.location.city} (${currentWeather.tempC}°C). Chaque coup de pédale te rapproche de la ligne d'arrivée à Hardelot en 2027 !`
    };
  };

  const mascotVoice = getDashboardMascotSpeech();

  return (
    <div className="min-h-screen bg-slate-100/70 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-duo-green flex items-center justify-center text-white shadow-md shadow-green-500/20">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                  Cap Hardelot 2027
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  IA Coach
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Entraînement intelligent • Météo & Stratégie Vent
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('cockpit')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'cockpit'
                  ? 'bg-duo-green text-white shadow-md shadow-green-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Cockpit & Carte</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plan2027')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'plan2027'
                  ? 'bg-duo-green text-white shadow-md shadow-green-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Plan Hardelot 2027</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-duo-green text-white shadow-md shadow-green-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Mon Profil</span>
            </button>

            {/* Cloud BDD sync status button */}
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                isSupabaseConnected()
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isSupabaseConnected() ? 'BDD Connectée' : 'Lier BDD (Cloud)'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Mascot Daily Encouragement Banner */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <Mascot mood={mascotVoice.mood} speech={mascotVoice.speech} size="md" />

          {/* Quick weather status right */}
          {currentWeather && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl flex-shrink-0">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{profile.location.city}</div>
                <div className="text-[11px] text-slate-500">
                  {currentWeather.tempC}°C • Vent {currentWeather.windSpeedKmh} km/h ({currentWeather.windDirectionCardinal})
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                {currentWeather.windDirectionCardinal.slice(0, 2)}
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: COCKPIT & MAP */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            {/* Weekly Calendar */}
            <WeeklyCalendar
              profile={profile}
              workouts={workouts}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={(idx) => setSelectedDayIndex(idx)}
              onToggleRideDay={handleToggleRideDay}
              onChangeLocation={handleChangeLocation}
              onRegenerateWorkouts={() => loadWeatherAndBuildSchedule(profile.location)}
            />

            {/* Smart Wind & Heading Map */}
            {currentWeather && windRec && currentSelectedWorkout && (
              <WindHeadingMap
                location={profile.location}
                weather={currentWeather}
                windRec={windRec}
                targetDistanceKm={currentSelectedWorkout.targetDistanceKm}
                departureHour={currentSelectedWorkout.targetDepartureHour}
                estimatedArrivalHour={currentSelectedWorkout.daylightStatus.estimatedArrivalHour}
                nightRisk={currentSelectedWorkout.daylightStatus.nightRisk}
                nightWarning={currentSelectedWorkout.daylightStatus.warningMessage}
              />
            )}

            {/* 10 Last Activities History Component */}
            <RideHistory activities={activities} />
          </div>
        )}

        {/* TAB 2: LILLE-HARDELOT 2027 ROADMAP */}
        {activeTab === 'plan2027' && <LilleHardelotPlan />}

        {/* TAB 3: USER PROFILE & SENSORS */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  Profil & Capteurs Cycliste
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connecté via{' '}
                  <span className="font-extrabold uppercase text-duo-green">
                    {profile.authMethod}
                  </span>{' '}
                  • {profile.firstName} {profile.name} ({profile.email})
                </p>
              </div>

              <button
                type="button"
                onClick={onResetOnboarding}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                Reconfigurer / Recommencer l'Onboarding
              </button>
            </div>

            {/* Hardware Grid */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                Matériel Connecté Détecté
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-700">Capteur Puissance</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      profile.equipment.powerMeter
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {profile.equipment.powerMeter ? 'Actif' : 'Non'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-slate-700">Ceinture Cardiaque</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      profile.equipment.hrm
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {profile.equipment.hrm ? 'Actif' : 'Non'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-slate-700">Compteur GPS</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      profile.equipment.cyclingComputer
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {profile.equipment.cyclingComputer ? 'Actif' : 'Non'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">Home-Trainer Connecté</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      profile.equipment.smartTrainer
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {profile.equipment.smartTrainer ? 'Actif' : 'Non'}
                  </span>
                </div>
              </div>
            </div>

            {/* Training Target & Physiologic Zones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <div className="text-xs text-emerald-800 font-bold uppercase">FTP Estimée</div>
                <div className="text-2xl font-black text-slate-800 mt-1">{profile.estimatedFtpWatts || 240} Watts</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Seuil fonctionnel de puissance</div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                <div className="text-xs text-rose-800 font-bold uppercase">Fréquence Cardiaque Max</div>
                <div className="text-2xl font-black text-slate-800 mt-1">{profile.maxHeartRateBpm || 188} BPM</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Plafond aérobie / anaérobie</div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
                <div className="text-xs text-sky-800 font-bold uppercase">Objectif Allure Hardelot</div>
                <div className="text-2xl font-black text-slate-800 mt-1">{profile.targetSpeedLilleHardelot}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Allure moyenne visée sur 160 km</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Supabase Cloud Database Sync Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionSuccess={() => {
          // Re-render and notify
        }}
      />
    </div>
  );
};
