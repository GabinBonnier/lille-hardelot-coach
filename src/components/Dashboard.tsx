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
import { parseICS, ParsedCalendarEvent } from '../services/icsParser';
import { balanceWeeklyVolume, getLatestEventEnd } from '../services/smartCoachScheduler';
import { 
  Bike, 
  MapPin, 
  Wind, 
  Calendar, 
  Clock,
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

      // Récupération des cours/événements importés
      const rawIcs = localStorage.getItem('cap_hardelot_raw_ics');
      let calendarEvents: ParsedCalendarEvent[] = [];
      if (rawIcs) {
        try {
          calendarEvents = parseICS(rawIcs);
        } catch {}
      } else {
        const savedEvt = localStorage.getItem('cap_hardelot_apple_events_v1');
        if (savedEvt) {
          try {
            calendarEvents = JSON.parse(savedEvt);
          } catch {}
        }
      }

      // Volume semaine précédente (défaut 90 km -> max 99 km à +10%)
      const prevKmSaved = localStorage.getItem('cap_hardelot_prev_week_km');
      const prevKm = prevKmSaved ? Number(prevKmSaved) : 90;
      const maxAllowedKm = Math.round(prevKm * 1.10);

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

        // Vérifier si des cours/événements existent ce jour-là
        const latestClassEnd = getLatestEventEnd(calendarEvents, dayDateStr, idx);

        // Distances & types adaptés selon l'emploi du temps et la météo
        let targetDistanceKm = 40;
        let intensity: ScheduledWorkout['intensity'] = 'Endurance Fondamentale';
        let departureHour = '14:00';
        let reliefCategory: ScheduledWorkout['reliefCategory'] = 'Plaine & Faux-plat';
        let workoutDetails: ScheduledWorkout['workoutDetails'] = {
          warmup: '15 min progressif en Zone 1/2 en montant tranquillement en température.',
          mainSet: 'Endurance de base rythmée en Zone 2 avec quelques accélérations de 30 secondes pour dynamiser les jambes.',
          cooldown: '10 min retour au calme souple pour éliminer les toxines.',
          targetCadenceRpm: '85-90 rpm',
          nutritionHydration: '1 bidon de 500ml d’eau ou électrolytes légers.',
          zones: 'Zone 2 (Endurance fondamentale)',
          difficulty: 'Modéré'
        };

        if (idx === 2) {
          // Mercredi : Séance Rythme / Seuil
          // Si cours l'après-midi (ex: fin à 17h30), départ calé juste après
          if (latestClassEnd && latestClassEnd >= '16:00') {
            departureHour = '17:40';
          } else {
            departureHour = '14:30';
          }
          // Distance adaptée : 40 km (ou 28 km si on veut rentrer strictement avant la nuit)
          targetDistanceKm = 40;
          intensity = 'Rythme & Seuil';
          reliefCategory = 'Vallonné';
          workoutDetails = {
            warmup: '15 min progressif avec 3 relances courtes pour débloquer les poumons.',
            mainSet: '3 séries de 10 min en Sweet-Spot (88-92% FTP ou 82-87% FC Max) avec 4 min de récupération souple entre chaque bloc. Vitesse cible : 28-30 km/h.',
            cooldown: '12 min sur le petit plateau en tournant les jambes.',
            targetCadenceRpm: '88-92 rpm',
            nutritionHydration: '1 bidon d’électrolytes + 1 pâte de fruits au milieu de séance.',
            zones: 'Zone 3 (Tempo) & Zone 4 (Sweet-Spot)',
            difficulty: 'Exigeant'
          };
        } else if (idx === 5) {
          // Samedi
          targetDistanceKm = 45;
          intensity = 'Dénivelé & Monts';
          departureHour = '09:00';
          reliefCategory = 'Monts & Côtes';
          workoutDetails = {
            warmup: '20 min en Zone 2 en quittant l’agglomération et en affrontant le vent de face.',
            mainSet: '6 montées de bosses ou côtes (4% à 8%) réalisées assis à 55-65 rpm pour développer la force musculaire.',
            cooldown: '15 min de pédalage souple pour faire tourner les jambes.',
            targetCadenceRpm: '55-65 rpm en côte, 85-90 rpm sur le plat',
            nutritionHydration: '2 bidons (1 eau, 1 boisson d’effort) + 2 barres énergétiques.',
            zones: 'Zone 2, Zone 4 en montée & Force sous-max',
            difficulty: 'Exigeant'
          };
        } else if (idx === 6) {
          // Dimanche : Sortie Longue d'Endurance
          // Plafonné automatiquement pour respecter les +10% max (ex: 99 - 40 = 59 km)
          const wednesdayKm = 40;
          const allowedForSunday = Math.max(25, maxAllowedKm - wednesdayKm);
          targetDistanceKm = allowedForSunday; // 59 km !
          intensity = 'Endurance Fondamentale';
          departureHour = '08:30';
          reliefCategory = 'Vallonné';
          workoutDetails = {
            warmup: '25 min en endurance basse pour se mettre en jambes sans forcer.',
            mainSet: 'Sortie longue simulation Hardelot : première moitié vent de face en restant profilé mains aux cocottes, seconde moitié poussé par le vent.',
            cooldown: '15 min récupération active.',
            targetCadenceRpm: '85-92 rpm constante',
            nutritionHydration: 'Test nutrition officielle : 60g de glucides par heure + 1 bidon toutes les 1h15.',
            zones: 'Zone 2 pure (Aérobie & optimisation lipidique)',
            difficulty: 'Intense'
          };
        } else if (idx === 1) {
          // Mardi
          targetDistanceKm = 30;
          intensity = 'Récupération Active';
          departureHour = '17:40';
          reliefCategory = 'Plaine & Faux-plat';
          workoutDetails = {
            warmup: '10 min tout souple en moulinant à 95 rpm.',
            mainSet: '3x 5 min de vélocité à 100-105 rpm sans forcer sur les pédales.',
            cooldown: '10 min très léger.',
            targetCadenceRpm: '95-105 rpm',
            nutritionHydration: '1 bidon d’eau claire.',
            zones: 'Zone 1 (Récupération active)',
            difficulty: 'Accessible'
          };
        }

        // Durée calculée automatiquement à vitesse moyenne de 26 km/h
        const estDurationMinutes = Math.round((targetDistanceKm / 26) * 60);
        const daylight = checkDaylightSafety(departureHour, estDurationMinutes, weather.sunset);

        return {
          id: `w-${idx}`,
          dayIndex: idx,
          dayDate: dayDateStr,
          dayName,
          title:
            idx === 6
              ? `Sortie Longue Foncier • Plafond +10% (${targetDistanceKm} km)`
              : idx === 2
              ? 'Séance Rythme & Tenue de Vitesse'
              : idx === 5
              ? 'Sortie Prépa Lille-Hardelot • Monts & Relief'
              : 'Endurance de Base & Cadence',
          targetDistanceKm,
          estimatedDurationMinutes: estDurationMinutes,
          intensity,
          targetDepartureHour: departureHour,
          departureLocation: location,
          workoutDetails,
          weather,
          windRoute: rec,
          daylightStatus: daylight,
          reliefCategory,
          isPlannedByCyclist: isPlanned
        };
      });

      // Appliquer l'équilibrage de volume hebdomadaire (+10% max)
      const balancedWorkouts = balanceWeeklyVolume(generatedWorkouts, prevKm, 26);
      setWorkouts(balancedWorkouts);

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

  const handleUpdateDayLocation = async (dayIndex: number, loc: TrainingLocation) => {
    try {
      const dayWeather = await fetchLiveWeather(loc.lat, loc.lng);
      const dayWind = calculateWindRecommendation(dayWeather.windDirectionDeg, loc.city);

      setWorkouts((prev) =>
        prev.map((w, idx) => {
          if (idx === dayIndex) {
            const estDuration = Math.round((w.targetDistanceKm / 27) * 60);
            const daylight = checkDaylightSafety(w.targetDepartureHour, estDuration, dayWeather.sunset);
            return {
              ...w,
              departureLocation: loc,
              weather: dayWeather,
              windRoute: dayWind,
              daylightStatus: daylight
            };
          }
          return w;
        })
      );
    } catch (err) {
      console.error('Erreur mise à jour météo du jour:', err);
    }
  };

  const handleUpdateWorkout = (updated: ScheduledWorkout) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  };

  const currentSelectedWorkout = workouts[selectedDayIndex] || workouts[0];

  // Dynamic mascot speech in dashboard
  const getDashboardMascotSpeech = (): { mood: MascotMood; speech: string } => {
    if (!currentWeather) {
      return { mood: 'happy', speech: 'Chargement des données météo en temps réel...' };
    }

    // Contrôle de la règle des +10% max par semaine
    const activeKm = workouts.filter((w) => w.isPlannedByCyclist).reduce((acc, w) => acc + w.targetDistanceKm, 0);
    const prevKm = Number(localStorage.getItem('cap_hardelot_prev_week_km') || 90);
    if (activeKm > prevKm * 1.10) {
      const overloadPct = Math.round(((activeKm - prevKm) / prevKm) * 100);
      return {
        mood: 'warning',
        speech: `Attention ${profile.firstName} ! Tu prévois ${activeKm} km cette semaine (+${overloadPct}%). La règle de progression sécurisée recommande +10% max (${Math.round(prevKm * 1.1)} km) pour éviter les blessures musculaires avant Hardelot 2027 !`
      };
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
              onUpdateDayLocation={handleUpdateDayLocation}
              onUpdateWorkout={handleUpdateWorkout}
              onRegenerateWorkouts={() => loadWeatherAndBuildSchedule(profile.location)}
            />

            {/* Selected Day Status & Custom Day Location Banner */}
            {currentSelectedWorkout && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center font-black flex-shrink-0 shadow-sm">
                    <span className="text-[10px] uppercase leading-none">{currentSelectedWorkout.dayName.slice(0, 3)}</span>
                    <span className="text-sm leading-tight">{currentSelectedWorkout.dayDate.slice(8)}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black text-slate-800">
                        {currentSelectedWorkout.dayName} {currentSelectedWorkout.dayDate} • {currentSelectedWorkout.title}
                      </h4>
                      {currentSelectedWorkout.isPlannedByCyclist ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Sortie programmée
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Jour de repos
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                      <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Lieu ce jour : {currentSelectedWorkout.departureLocation?.city || profile.location.city} ({currentSelectedWorkout.departureLocation?.postalCode || profile.location.postalCode})
                      </span>
                      {currentSelectedWorkout.isPlannedByCyclist && (
                        <>
                          <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                            <Bike className="w-3.5 h-3.5 text-duo-green" />
                            {currentSelectedWorkout.targetDistanceKm} km ({Math.floor(currentSelectedWorkout.estimatedDurationMinutes / 60)}h{currentSelectedWorkout.estimatedDurationMinutes % 60 ? currentSelectedWorkout.estimatedDurationMinutes % 60 : ''})
                          </span>
                          <span className={`flex items-center gap-1 font-bold px-2.5 py-1 rounded-xl border ${
                            currentSelectedWorkout.daylightStatus.nightRisk 
                              ? 'bg-amber-50 text-amber-900 border-amber-300' 
                              : 'bg-sky-50 text-sky-900 border-sky-200'
                          }`}>
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            Départ {currentSelectedWorkout.targetDepartureHour} ➔ Arrivée {currentSelectedWorkout.daylightStatus.estimatedArrivalHour}
                            {currentSelectedWorkout.daylightStatus.nightRisk ? ' (⚠️ Crépuscule/Nuit)' : ' (☀️ De jour)'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left md:text-right text-xs text-slate-500 font-medium">
                  <div>Coucher de soleil : <strong className="text-slate-800">{currentSelectedWorkout.weather?.sunset || '18:48'}</strong></div>
                  <div className="text-[11px] text-slate-400">Orientation météo calculée depuis {currentSelectedWorkout.departureLocation?.city || profile.location.city}</div>
                </div>
              </div>
            )}

            {/* Smart Wind & Heading Map (adapté au jour et à la commune choisie ce jour) */}
            {currentSelectedWorkout && (
              <WindHeadingMap
                location={currentSelectedWorkout.departureLocation || profile.location}
                weather={currentSelectedWorkout.weather || currentWeather || {
                  tempC: 15,
                  weatherCode: 1,
                  weatherDescription: 'Ciel voilé',
                  isRainy: false,
                  isFoggy: false,
                  windSpeedKmh: 20,
                  windGustsKmh: 30,
                  windDirectionDeg: 220,
                  windDirectionCardinal: 'Sud-Ouest (SO)',
                  sunrise: '07:30',
                  sunset: '18:40'
                }}
                windRec={currentSelectedWorkout.windRoute || windRec || {
                  outboundHeadingDeg: 220,
                  outboundHeadingName: 'Sud-Ouest (SO)',
                  returnHeadingDeg: 40,
                  returnHeadingName: 'Nord-Est (NE)',
                  explanation: 'Face au vent à l’aller',
                  reliefComment: 'Relief varié'
                }}
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
