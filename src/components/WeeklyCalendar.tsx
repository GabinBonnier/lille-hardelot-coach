import React, { useState, useEffect } from 'react';
import { UserProfile, ScheduledWorkout, TrainingLocation, WeatherCondition } from '../types';
import { POPULAR_LOCATIONS, searchFrenchCities } from '../data/cities';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import { CalendarImportModal } from './CalendarImportModal';
import { ParsedCalendarEvent, parseICS } from '../services/icsParser';
import { syncCalendarFromUrl } from '../services/calendarSubscription';
import { balanceWeeklyVolume } from '../services/smartCoachScheduler';
import { checkDaylightSafety } from '../services/weatherService';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  CloudRain, 
  Sun, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Bike, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Upload,
  Info,
  ChevronDown
} from 'lucide-react';

interface WeeklyCalendarProps {
  profile: UserProfile;
  workouts: ScheduledWorkout[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  onToggleRideDay: (dayIndex: number) => void;
  onChangeLocation: (location: TrainingLocation) => void;
  onUpdateDayLocation: (dayIndex: number, location: TrainingLocation) => void;
  onUpdateWorkout: (updated: ScheduledWorkout) => void;
  onRegenerateWorkouts: () => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  profile,
  workouts,
  selectedDayIndex,
  onSelectDay,
  onToggleRideDay,
  onChangeLocation,
  onUpdateDayLocation,
  onUpdateWorkout,
  onRegenerateWorkouts
}) => {
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [calendarLocationSearch, setCalendarLocationSearch] = useState('');
  const [calendarCityResults, setCalendarCityResults] = useState<TrainingLocation[]>(POPULAR_LOCATIONS);
  const [isCalendarCityLoading, setIsCalendarCityLoading] = useState(false);

  // Per-day location selector state
  const [editingLocationDayIndex, setEditingLocationDayIndex] = useState<number | null>(null);
  const [dayLocationSearch, setDayLocationSearch] = useState('');
  const [dayCityResults, setDayCityResults] = useState<TrainingLocation[]>(POPULAR_LOCATIONS);
  const [isDayLocationLoading, setIsDayLocationLoading] = useState(false);

  // Modals state
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedWorkoutModal, setSelectedWorkoutModal] = useState<ScheduledWorkout | null>(null);
  const [expandedCalendarDays, setExpandedCalendarDays] = useState<Record<number, boolean>>({});
  const [calendarSubUrl, setCalendarSubUrl] = useState<string>(
    () => localStorage.getItem('cap_hardelot_calendar_sub_url') || ''
  );
  const [isRefreshingCalendar, setIsRefreshingCalendar] = useState(false);

  // Auto-refresh calendar on load if live subscription URL is configured
  useEffect(() => {
    if (calendarSubUrl) {
      setIsRefreshingCalendar(true);
      syncCalendarFromUrl(calendarSubUrl)
        .then((res) => {
          setIsRefreshingCalendar(false);
          if (res.events && res.events.length > 0) {
            setImportedEvents(res.events);
            localStorage.setItem('cap_hardelot_apple_events_v1', JSON.stringify(res.events));
          }
        })
        .catch(() => {
          setIsRefreshingCalendar(false);
        });
    }
  }, [calendarSubUrl]);

  const handleManualCalendarRefresh = async () => {
    if (!calendarSubUrl) return;
    setIsRefreshingCalendar(true);
    try {
      const res = await syncCalendarFromUrl(calendarSubUrl);
      setIsRefreshingCalendar(false);
      if (res.events && res.events.length > 0) {
        setImportedEvents(res.events);
        localStorage.setItem('cap_hardelot_apple_events_v1', JSON.stringify(res.events));
      }
    } catch {
      setIsRefreshingCalendar(false);
    }
  };

  // Apple Calendar imported events
  const [importedEvents, setImportedEvents] = useState<ParsedCalendarEvent[]>(() => {
    const rawIcs = localStorage.getItem('cap_hardelot_raw_ics');
    if (rawIcs) {
      try {
        const reParsed = parseICS(rawIcs);
        if (reParsed.length > 0) return reParsed;
      } catch (e) {}
    }
    const saved = localStorage.getItem('cap_hardelot_apple_events_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', title: 'Réunion d’équipe', startHour: '09:00', endHour: '10:30', dayOfWeek: 0, dateStr: '2026-10-19' },
      { id: '2', title: 'Présentation client', startHour: '14:00', endHour: '16:00', dayOfWeek: 1, dateStr: '2026-10-20' },
      { id: '3', title: 'Déjeuner pro', startHour: '12:30', endHour: '14:00', dayOfWeek: 2, dateStr: '2026-10-21' },
      { id: '4', title: 'Bilan de projet', startHour: '10:00', endHour: '11:30', dayOfWeek: 3, dateStr: '2026-10-22' },
      { id: '5', title: 'Foot enfants', startHour: '09:00', endHour: '11:00', dayOfWeek: 5, dateStr: '2026-10-24' },
      { id: '6', title: 'Repas de famille', startHour: '12:30', endHour: '15:30', dayOfWeek: 6, dateStr: '2026-10-25' }
    ];
  });

  // Previous week volume for progressive overload calculation (+10% rule)
  const [previousWeekKm, setPreviousWeekKm] = useState<number>(() => {
    const saved = localStorage.getItem('cap_hardelot_prev_week_km');
    return saved ? Number(saved) : 90;
  });

  // Calculate current week active distance
  const currentWeekKm = workouts
    .filter((w) => w.isPlannedByCyclist)
    .reduce((sum, w) => sum + w.targetDistanceKm, 0);

  // Progressive volume calculation
  const maxAllowedKm = Math.round(previousWeekKm * 1.10); // +10% max rule!
  const volumeDiffKm = currentWeekKm - previousWeekKm;
  const volumePercent = previousWeekKm > 0 ? Math.round((volumeDiffKm / previousWeekKm) * 100) : 0;
  const isOverload = currentWeekKm > maxAllowedKm;

  useEffect(() => {
    let cancel = false;
    const timer = setTimeout(() => {
      setIsCalendarCityLoading(true);
      searchFrenchCities(calendarLocationSearch).then((res) => {
        if (!cancel) {
          setCalendarCityResults(res);
          setIsCalendarCityLoading(false);
        }
      });
    }, 200);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [calendarLocationSearch]);

  // Debounced search for per-day location picker
  useEffect(() => {
    let cancel = false;
    const timer = setTimeout(() => {
      setIsDayLocationLoading(true);
      searchFrenchCities(dayLocationSearch).then((res) => {
        if (!cancel) {
          setDayCityResults(res);
          setIsDayLocationLoading(false);
        }
      });
    }, 200);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [dayLocationSearch]);

  const handleAdjustWorkoutKm = (w: ScheduledWorkout, delta: number) => {
    const newKm = Math.max(15, Math.min(160, w.targetDistanceKm + delta));
    const durationMinutes = Math.round((newKm / 26) * 60);
    const sunset = w.weather?.sunset || '18:48';
    const daylight = checkDaylightSafety(w.targetDepartureHour, durationMinutes, sunset);

    const updated: ScheduledWorkout = {
      ...w,
      targetDistanceKm: newKm,
      estimatedDurationMinutes: durationMinutes,
      daylightStatus: daylight
    };
    onUpdateWorkout(updated);
  };

  const handleAutoBalanceVolume = () => {
    const balanced = balanceWeeklyVolume(workouts, previousWeekKm, 26);
    balanced.forEach((w) => onUpdateWorkout(w));
  };

  const handleChangePreviousWeekKm = (newVal: number) => {
    const clamped = Math.max(20, Math.min(250, newVal));
    setPreviousWeekKm(clamped);
    localStorage.setItem('cap_hardelot_prev_week_km', clamped.toString());
  };

  const handleImportCalendarSuccess = (events: ParsedCalendarEvent[]) => {
    setImportedEvents(events);
    localStorage.setItem('cap_hardelot_apple_events_v1', JSON.stringify(events));
    const savedUrl = localStorage.getItem('cap_hardelot_calendar_sub_url');
    if (savedUrl) {
      setCalendarSubUrl(savedUrl);
    }
  };

  const handleClearCalendar = () => {
    setImportedEvents([]);
    setCalendarSubUrl('');
    localStorage.removeItem('cap_hardelot_apple_events_v1');
    localStorage.removeItem('cap_hardelot_raw_ics');
    localStorage.removeItem('cap_hardelot_calendar_sub_url');
  };

  const dayNamesShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
      
      {/* Top Bar: Controls & Actions */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-sky-50/40 to-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-duo-green" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Planning Hebdomadaire & Synchronisation Apple
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Positionne tes sorties selon tes disponibilités réelles. Chaque jour peut avoir son propre lieu de départ !
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Apple Calendar Import & Sync Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  {calendarSubUrl 
                    ? 'Calendrier en Direct (Actif)' 
                    : importedEvents.length > 0 
                      ? 'Calendrier Importé' 
                      : 'Lier mon Calendrier'}
                </span>
                {importedEvents.length > 0 && (
                  <span className={`w-2 h-2 rounded-full ${calendarSubUrl ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
                )}
              </button>

              {calendarSubUrl && (
                <button
                  type="button"
                  onClick={handleManualCalendarRefresh}
                  disabled={isRefreshingCalendar}
                  title="Rafraîchir les cours maintenant"
                  className="p-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-2xl text-sky-700 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCalendar ? 'animate-spin text-sky-500' : ''}`} />
                </button>
              )}
            </div>

            {/* Global location changer */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLocationSelect(!showLocationSelect)}
                className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm hover:border-duo-green text-xs font-bold text-slate-700 transition-all"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Base : {profile.location.city} ({profile.location.postalCode})</span>
              </button>

              {showLocationSelect && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      Changer la commune de base
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLocationSelect(false)}
                      className="text-xs text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Ville ou code postal (ex: Cassel, 62152, Hardelot...)"
                    value={calendarLocationSearch}
                    onChange={(e) => setCalendarLocationSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                    autoFocus
                  />

                  <div className="text-[10px] text-slate-400 font-semibold px-1">
                    {isCalendarCityLoading ? 'Recherche...' : `${calendarCityResults.length} commune(s) trouvée(s)`}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                    {calendarCityResults.map((loc, idx) => (
                      <button
                        key={`${loc.city}-${loc.postalCode}-${idx}`}
                        type="button"
                        onClick={() => {
                          onChangeLocation(loc);
                          setShowLocationSelect(false);
                          setCalendarLocationSearch('');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white hover:shadow-sm flex items-center justify-between transition-all ${
                          profile.location.postalCode === loc.postalCode && profile.location.city === loc.city
                            ? 'bg-emerald-100 text-emerald-900 font-bold'
                            : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold">{loc.city}</span>{' '}
                          <span className="text-slate-400 font-mono text-[10px]">({loc.postalCode})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{loc.department}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onRegenerateWorkouts}
              className="flex items-center gap-1.5 bg-duo-green hover:bg-duo-darkGreen text-white px-3.5 py-2 rounded-2xl shadow-sm text-xs font-black transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réaligner Vent</span>
            </button>
          </div>
        </div>

        {/* PROGRESSIVE OVERLOAD BAR (RÈGLE DES 10% MAX PAR SEMAINE) */}
        <div className="mt-5 p-4 rounded-2xl border transition-all bg-white shadow-sm space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-duo-green" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Progression du Volume Hebdomadaire (Règle des +10% max)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Stepper Semaine N-1 */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                <span className="text-slate-500 font-medium">Semaine passée :</span>
                <button
                  type="button"
                  onClick={() => handleChangePreviousWeekKm(previousWeekKm - 5)}
                  className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200"
                  title="Diminuer"
                >
                  -
                </button>
                <strong className="font-extrabold text-slate-800">{previousWeekKm} km</strong>
                <button
                  type="button"
                  onClick={() => handleChangePreviousWeekKm(previousWeekKm + 5)}
                  className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200"
                  title="Augmenter"
                >
                  +
                </button>
              </div>

              <span className="font-extrabold text-slate-800">
                Cette semaine : <strong className={isOverload ? 'text-rose-600' : 'text-duo-green'}>{currentWeekKm} km</strong>
              </span>

              <span className="text-slate-500 font-medium hidden sm:inline">
                (Plafond +10% : <strong>{maxAllowedKm} km</strong>)
              </span>

              <span
                className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                  isOverload
                    ? 'bg-rose-100 text-rose-700'
                    : volumePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {volumePercent >= 0 ? `+${volumePercent}%` : `${volumePercent}%`}
              </span>
            </div>
          </div>

          {/* Progress visual bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isOverload ? 'bg-rose-500' : 'bg-duo-green'
              }`}
              style={{ width: `${Math.min((currentWeekKm / (maxAllowedKm * 1.15 || 1)) * 100, 100)}%` }}
            />
          </div>

          {/* Smart volume budget details & overload alert */}
          {(() => {
            const otherDaysKm = workouts
              .filter((w) => w.isPlannedByCyclist && w.dayIndex !== 6)
              .reduce((sum, w) => sum + w.targetDistanceKm, 0);
            const remainingBudgetForSunday = Math.max(0, maxAllowedKm - otherDaysKm);

            return (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="text-slate-700">
                    💡 <strong>Règle d'or :</strong> Avec <strong>{otherDaysKm} km</strong> prévus en semaine, ton dimanche est plafonné à <strong>{remainingBudgetForSunday} km max</strong> pour ne pas dépasser les <strong>{maxAllowedKm} km</strong> (+10% max).
                  </div>

                  {isOverload && (
                    <button
                      type="button"
                      onClick={handleAutoBalanceVolume}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 flex-shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ajuster le dimanche à {remainingBudgetForSunday} km</span>
                    </button>
                  )}
                </div>

                {isOverload ? (
                  <div className="flex items-start gap-2 text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Alerte Surcharge (+{volumePercent}%) :</strong> Vous prévoyez {currentWeekKm} km alors que votre plafond sécuritaire est de <strong>{maxAllowedKm} km (+10%)</strong>. Risque accru de tendinite ou de fatigue !
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/70 p-2 rounded-xl text-[11px] font-medium border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      <strong>Volume parfaitement équilibré :</strong> La progression respecte le plafond de {maxAllowedKm} km (+10% max).
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Days selector bar */}
        <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs font-extrabold text-slate-700">
            Jours cochés cette semaine (cliquez pour activer/désactiver) :
          </div>

          <div className="flex flex-wrap gap-1.5">
            {workouts.map((workout, idx) => {
              const isSelected = workout.isPlannedByCyclist;
              return (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => onToggleRideDay(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-duo-green text-white shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span>{dayNamesShort[idx]}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Week Calendar Grid (7 columns Monday -> Sunday) */}
      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-7 gap-3">
        {workouts.map((workout, idx) => {
          const isSelected = selectedDayIndex === idx;
          const isRideDay = workout.isPlannedByCyclist;
          
          // Filter imported Apple events strictly for this day (date matching or dayOfWeek)
          const rawDayEvents = importedEvents.filter((e) => {
            if (e.dateStr && e.dateStr.length >= 8) {
              return e.dateStr === workout.dayDate;
            }
            return e.dayOfWeek === idx;
          });

          // Deduplicate if identical title and startHour
          const dayAppleEvents = rawDayEvents.filter((evt, i, arr) => 
            arr.findIndex((x) => x.title === evt.title && x.startHour === evt.startHour) === i
          );

          const dayLoc = workout.departureLocation || profile.location;
          const isExpanded = !!expandedCalendarDays[idx];

          return (
            <div
              key={workout.id}
              onClick={() => onSelectDay(idx)}
              className={`rounded-2xl border transition-all cursor-pointer flex flex-col justify-between p-3.5 ${
                isSelected
                  ? 'border-duo-green ring-2 ring-duo-green/30 bg-emerald-50/30 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {workout.dayName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {workout.dayDate.substring(5)}
                  </span>
                </div>

                {/* Per-Day Departure Location Selector */}
                <div className="relative mt-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLocationDayIndex(editingLocationDayIndex === idx ? null : idx);
                      setDayLocationSearch('');
                    }}
                    className="w-full flex items-center justify-between gap-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs group"
                    title={`Lieu de départ pour ce ${workout.dayName}`}
                  >
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{dayLoc.city} ({dayLoc.postalCode})</span>
                    </span>
                    <span className="text-[9px] text-emerald-600 font-extrabold flex-shrink-0 group-hover:underline">
                      Changer ▾
                    </span>
                  </button>

                  {/* Inline Dropdown for this specific day */}
                  {editingLocationDayIndex === idx && (
                    <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          Lieu du {workout.dayName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingLocationDayIndex(null)}
                          className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Tape une commune ou code postal..."
                        value={dayLocationSearch}
                        onChange={(e) => setDayLocationSearch(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                        autoFocus
                      />

                      <div className="max-h-36 overflow-y-auto space-y-0.5 bg-slate-50/50 rounded-lg p-1 border border-slate-100">
                        {isDayLocationLoading ? (
                          <div className="p-2 text-center text-[10px] text-slate-400">Recherche...</div>
                        ) : dayCityResults.length === 0 ? (
                          <div className="p-2 text-center text-[10px] text-slate-400">Aucune commune trouvée</div>
                        ) : (
                          dayCityResults.map((loc, cityIdx) => (
                            <button
                              key={`${loc.city}-${loc.postalCode}-${cityIdx}`}
                              type="button"
                              onClick={() => {
                                onUpdateDayLocation(idx, loc);
                                setEditingLocationDayIndex(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-[11px] hover:bg-emerald-100 flex items-center justify-between transition-all ${
                                dayLoc.postalCode === loc.postalCode && dayLoc.city === loc.city
                                  ? 'bg-emerald-100 font-bold text-emerald-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              <span className="truncate font-semibold">{loc.city} ({loc.postalCode})</span>
                              <span className="text-[9px] text-slate-400 ml-1">{loc.department}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apple Calendar Events Compact & Collapsible Badge */}
                {dayAppleEvents.length > 0 && (() => {
                  const sorted = [...dayAppleEvents].sort((a, b) => a.startHour.localeCompare(b.startHour));
                  const earliest = sorted[0].startHour;
                  const latest = sorted[sorted.length - 1].endHour || sorted[sorted.length - 1].startHour;

                  return (
                    <div className="mt-2 bg-sky-50/90 border border-sky-200/80 rounded-xl p-2 text-xs space-y-1.5 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-sky-900 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                          {sorted.length} {sorted.length > 1 ? 'cours / créneaux' : 'créneau'}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-sky-700 bg-white/90 px-1.5 py-0.5 rounded border border-sky-200">
                          {earliest} - {latest}
                        </span>
                      </div>

                      {/* Availability Hint */}
                      <div className="text-[9px] text-sky-800 font-medium leading-tight">
                        {latest <= '17:00' ? (
                          <span className="text-emerald-700 font-bold">✨ Libre dès {latest}</span>
                        ) : earliest >= '13:00' ? (
                          <span className="text-emerald-700 font-bold">✨ Matin libre avant {earliest}</span>
                        ) : (
                          <span className="text-sky-700">Journée chargée</span>
                        )}
                      </div>

                      {/* Toggle button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCalendarDays((prev) => ({ ...prev, [idx]: !prev[idx] }));
                        }}
                        className="text-[9px] font-bold text-sky-600 hover:text-sky-900 hover:underline flex items-center justify-between w-full pt-1 border-t border-sky-200/60"
                      >
                        <span>{isExpanded ? 'Masquer la liste ▴' : 'Voir les créneaux ▾'}</span>
                      </button>

                      {/* Collapsible scrollable list */}
                      {isExpanded && (
                        <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                          {sorted.map((evt, i) => (
                            <div
                              key={i}
                              className="text-[9px] font-medium bg-white text-slate-700 border border-sky-100 rounded-lg px-2 py-1 flex items-center justify-between gap-1 shadow-2xs"
                              title={evt.title}
                            >
                              <span className="truncate max-w-[85px] font-semibold">• {evt.title}</span>
                              <span className="text-sky-600 font-mono text-[8px] whitespace-nowrap">
                                {evt.startHour}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Workout Card or Rest Day */}
                {isRideDay ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-2">
                    {/* Title & Intensity */}
                    <div>
                      <div className="text-[11px] font-black text-slate-800 leading-tight">
                        {workout.title}
                      </div>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        {workout.intensity}
                      </span>
                    </div>

                    {/* Distance & Time */}
                    {/* Quick Distance Stepper */}
                    <div 
                      className="flex items-center justify-between bg-emerald-50/70 p-1 rounded-lg border border-emerald-200" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleAdjustWorkoutKm(workout, -5)}
                        className="w-5 h-5 rounded bg-white hover:bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200 shadow-2xs active:scale-95 transition-all"
                        title="Diminuer de 5 km"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-duo-green" />
                        {workout.targetDistanceKm} km
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustWorkoutKm(workout, 5)}
                        className="w-5 h-5 rounded bg-white hover:bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200 shadow-2xs active:scale-95 transition-all"
                        title="Augmenter de 5 km"
                      >
                        +
                      </button>
                    </div>

                    {/* Auto-calculated Duration & Time slots */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-600" />
                          Durée : {Math.floor(workout.estimatedDurationMinutes / 60)}h{workout.estimatedDurationMinutes % 60 ? workout.estimatedDurationMinutes % 60 : ''} (à 26 km/h)
                        </span>
                      </div>
                      <div className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[9px] flex items-center justify-between">
                        <span>Départ {workout.targetDepartureHour}</span>
                        <span>➔</span>
                        <span className="font-bold">Arrivée {workout.daylightStatus.estimatedArrivalHour}</span>
                      </div>
                    </div>

                    {/* Daylight Alert / Sunset verification */}
                    {workout.daylightStatus.nightRisk ? (
                      <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[9px] font-bold leading-tight">
                        ⚠️ Arrivée à {workout.daylightStatus.estimatedArrivalHour} (coucher à {workout.weather?.sunset || '18:48'}). Feux puissants requis !
                      </div>
                    ) : (
                      <div className="p-1 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[9px] font-semibold flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span>100% de jour (coucher {workout.weather?.sunset || '18:48'})</span>
                      </div>
                    )}

                    {/* Weather badge */}
                    {workout.weather && (
                      <div
                        className={`text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center justify-between ${
                          workout.weather.isRainy
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : workout.weather.isFoggy
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-sky-50 text-sky-800 border border-sky-200'
                        }`}
                      >
                        <span className="flex items-center gap-1 truncate max-w-[95px]">
                          {workout.weather.isRainy ? (
                            <CloudRain className="w-3 h-3 text-rose-500" />
                          ) : (
                            <Sun className="w-3 h-3 text-amber-500" />
                          )}
                          {workout.weather.tempC}°C • {workout.weather.weatherDescription}
                        </span>
                      </div>
                    )}

                    {/* Wind pill */}
                    {workout.weather && (
                      <div className="text-[10px] font-semibold bg-slate-50 text-slate-700 px-2 py-1 rounded-lg flex items-center gap-1 border border-slate-200/80">
                        <Wind className="w-3 h-3 text-sky-500" />
                        <span className="truncate">{workout.weather.windSpeedKmh} km/h • {workout.weather.windDirectionCardinal}</span>
                      </div>
                    )}

                    {/* Button: View workout details */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkoutModal(workout);
                      }}
                      className="w-full mt-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-duo-green font-bold rounded-lg text-[10px] border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Séance détaillée & Vitesse</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 py-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                    <span className="text-xs font-semibold block">Repos & Récupération</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRideDay(idx);
                      }}
                      className="mt-2 text-[10px] font-bold text-duo-green hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Programmer
                    </button>
                  </div>
                )}
              </div>

              {/* Day Footer Selector Indicator */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className={`font-bold ${isSelected ? 'text-duo-green' : 'text-slate-400'}`}>
                  {isSelected ? '● Sélectionné sur la carte' : 'Cliquer pour afficher'}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-duo-green' : 'text-slate-300'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Detailed Workout & Day Location */}
      <WorkoutDetailModal
        workout={selectedWorkoutModal}
        isOpen={!!selectedWorkoutModal}
        onClose={() => setSelectedWorkoutModal(null)}
        onUpdateWorkout={(updated) => {
          onUpdateWorkout(updated);
          setSelectedWorkoutModal(null);
        }}
        onUpdateLocation={(dayIdx, loc) => {
          onUpdateDayLocation(dayIdx, loc);
          if (selectedWorkoutModal) {
            setSelectedWorkoutModal({
              ...selectedWorkoutModal,
              departureLocation: loc
            });
          }
        }}
      />

      {/* MODAL: Apple Calendar Import */}
      <CalendarImportModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        onImportSuccess={handleImportCalendarSuccess}
        onClearCalendar={handleClearCalendar}
      />
    </div>
  );
};
