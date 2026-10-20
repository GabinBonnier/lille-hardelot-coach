import React, { useState, useEffect } from 'react';
import { UserProfile, ScheduledWorkout, TrainingLocation, WeatherCondition } from '../types';
import { POPULAR_LOCATIONS, searchFrenchCities } from '../data/cities';
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
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface WeeklyCalendarProps {
  profile: UserProfile;
  workouts: ScheduledWorkout[];
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  onToggleRideDay: (dayIndex: number) => void;
  onChangeLocation: (location: TrainingLocation) => void;
  onRegenerateWorkouts: () => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  profile,
  workouts,
  selectedDayIndex,
  onSelectDay,
  onToggleRideDay,
  onChangeLocation,
  onRegenerateWorkouts
}) => {
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [calendarLocationSearch, setCalendarLocationSearch] = useState('');
  const [calendarCityResults, setCalendarCityResults] = useState<TrainingLocation[]>(POPULAR_LOCATIONS);
  const [isCalendarCityLoading, setIsCalendarCityLoading] = useState(false);

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

  const dayNamesShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Mock Apple Calendar events for the week to demonstrate calendar sync
  const appleCalendarMockEvents: Record<number, Array<{ title: string; hours: string; type: 'busy' }>> = {
    0: [{ title: 'Réunion d’équipe', hours: '09:00 - 10:30', type: 'busy' }],
    1: [{ title: 'Présentation client', hours: '14:00 - 16:00', type: 'busy' }],
    2: [{ title: 'Déjeuner pro', hours: '12:30 - 14:00', type: 'busy' }],
    3: [{ title: 'Bilan de projet', hours: '10:00 - 11:30', type: 'busy' }],
    4: [{ title: 'Point direction', hours: '15:00 - 16:30', type: 'busy' }],
    5: [{ title: 'Course enfants / Foot', hours: '09:00 - 11:00', type: 'busy' }],
    6: [{ title: 'Repas de famille', hours: '12:30 - 15:30', type: 'busy' }]
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
      {/* Top Bar: Availability & Departure Location controls */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-sky-50/40 to-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Title & subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-duo-green" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Planning Hebdomadaire & Synchronisation Calendrier Apple
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Positionne tes sorties selon tes disponibilités réelles. Le moteur adapte la direction face au vent, la météo et évite la nuit.
            </p>
          </div>

          {/* Location changer */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLocationSelect(!showLocationSelect)}
                className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm hover:border-duo-green text-xs font-bold text-slate-700 transition-all"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Départ : {profile.location.city} ({profile.location.postalCode})</span>
              </button>

              {showLocationSelect && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                      Changer de commune de départ
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
              <span>Optimiser Sorties & Vent</span>
            </button>
          </div>
        </div>

        {/* Days selector bar ("Quels jours voulez-vous rouler ?") */}
        <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs font-extrabold text-slate-700">
            Quels jours roulez-vous cette semaine ? (cliquez pour activer/désactiver) :
          </div>

          <div className="flex flex-wrap gap-1.5">
            {workouts.map((workout, idx) => {
              const isSelected = workout.isPlannedByCyclist;
              const isCurrentView = selectedDayIndex === idx;
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
                  <span className="w-2 h-2 rounded-full bg-current opacity-70" />
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
          const appleEvents = appleCalendarMockEvents[idx] || [];

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

                {/* Apple Calendar events badge (demonstrating integration) */}
                {profile.appleCalendarLinked && appleEvents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {appleEvents.map((evt, i) => (
                      <div
                        key={i}
                        className="text-[10px] font-medium bg-slate-100 text-slate-600 rounded-lg px-2 py-1 flex items-center justify-between"
                      >
                        <span className="truncate max-w-[85px]">• {evt.title}</span>
                        <span className="text-slate-400 text-[9px]">{evt.hours}</span>
                      </div>
                    ))}
                  </div>
                )}

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
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-duo-green" />
                        {workout.targetDistanceKm} km
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {Math.floor(workout.estimatedDurationMinutes / 60)}h{workout.estimatedDurationMinutes % 60 ? workout.estimatedDurationMinutes % 60 : ''}
                      </span>
                    </div>

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
                        <span className="flex items-center gap-1 truncate max-w-[90px]">
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

                    {/* Daylight Alert if risks dark */}
                    {workout.daylightStatus.nightRisk && (
                      <div className="text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-lg flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                        <span>Alerte nuit : départ avant {workout.targetDepartureHour}</span>
                      </div>
                    )}
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
    </div>
  );
};
