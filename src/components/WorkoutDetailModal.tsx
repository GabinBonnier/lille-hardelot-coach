import React, { useState } from 'react';
import { ScheduledWorkout, TrainingLocation } from '../types';
import { searchFrenchCities } from '../data/cities';
import { checkDaylightSafety } from '../services/weatherService';
import { 
  X, 
  Bike, 
  Clock, 
  MapPin, 
  Zap, 
  Heart, 
  Wind, 
  Sun, 
  CloudRain, 
  AlertTriangle, 
  Check, 
  Sparkles,
  Flame,
  Coffee,
  Activity,
  Layers,
  Loader2
} from 'lucide-react';

interface WorkoutDetailModalProps {
  workout: ScheduledWorkout | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateWorkout: (updated: ScheduledWorkout) => void;
  onUpdateLocation: (dayIndex: number, loc: TrainingLocation) => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  workout,
  isOpen,
  onClose,
  onUpdateWorkout,
  onUpdateLocation
}) => {
  if (!isOpen || !workout) return null;

  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<TrainingLocation[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [targetDistance, setTargetDistance] = useState(workout.targetDistanceKm);
  const [departureHour, setDepartureHour] = useState(workout.targetDepartureHour);

  const handleSearchCity = async (q: string) => {
    setCitySearchQuery(q);
    if (q.trim().length >= 2) {
      setIsSearchingCity(true);
      const results = await searchFrenchCities(q);
      setCitySearchResults(results);
      setIsSearchingCity(false);
    }
  };

  const handleSelectCity = (loc: TrainingLocation) => {
    onUpdateLocation(workout.dayIndex, loc);
    setIsChangingLocation(false);
    setCitySearchQuery('');
  };

  const liveDurationMinutes = Math.round((Number(targetDistance) / 26) * 60);
  const liveSunset = workout.weather?.sunset || '18:48';
  const liveDaylight = checkDaylightSafety(departureHour, liveDurationMinutes, liveSunset);

  const handleSave = () => {
    onUpdateWorkout({
      ...workout,
      targetDistanceKm: Number(targetDistance),
      targetDepartureHour: departureHour,
      estimatedDurationMinutes: liveDurationMinutes,
      daylightStatus: liveDaylight
    });
    onClose();
  };

  const details = workout.workoutDetails;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-emerald-50 via-sky-50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                {workout.dayName} • {workout.dayDate}
              </span>
              <span className="text-xs font-extrabold text-slate-500">
                {workout.intensity}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {workout.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Day Location Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Lieu de départ ce {workout.dayName} :</span>
                <span className="bg-white border border-emerald-300 text-emerald-800 px-3 py-1 rounded-xl shadow-sm">
                  {workout.departureLocation?.city || 'Lille'} ({workout.departureLocation?.postalCode || '59000'})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingLocation(!isChangingLocation)}
                className="text-xs font-bold text-duo-green hover:underline"
              >
                {isChangingLocation ? 'Fermer la recherche' : 'Changer le lieu de ce jour'}
              </button>
            </div>

            {/* City search input */}
            {isChangingLocation && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tape une commune ou code postal pour ce jour (ex: Cassel, 62152 Hardelot...)"
                    value={citySearchQuery}
                    onChange={(e) => handleSearchCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-duo-green"
                    autoFocus
                  />
                  {isSearchingCity && (
                    <div className="absolute right-2.5 top-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-duo-green" />
                    </div>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 bg-white rounded-xl border border-slate-200 p-1 shadow-inner">
                  {citySearchResults.map((loc, idx) => (
                    <button
                      key={`${loc.city}-${loc.postalCode}-${idx}`}
                      type="button"
                      onClick={() => handleSelectCity(loc)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800">{loc.city} ({loc.postalCode})</span>
                      <span className="text-[10px] text-slate-400">{loc.department}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar (Adjust Distance and Departure Time) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200">
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                Distance de la séance : <span className="text-sm font-black text-emerald-800">{targetDistance} km</span>
              </label>
              <input
                type="range"
                min={20}
                max={160}
                step={5}
                value={targetDistance}
                onChange={(e) => setTargetDistance(Number(e.target.value))}
                className="w-full accent-duo-green"
              />
              <div className="flex justify-between text-[10px] text-emerald-700 font-semibold mt-1">
                <span>20 km</span>
                <span className="font-extrabold">Durée calculée : {Math.floor(liveDurationMinutes / 60)}h{liveDurationMinutes % 60 ? liveDurationMinutes % 60 : ''} (à 26 km/h)</span>
                <span>160 km</span>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-1.5">
              <label className="block text-xs font-bold text-sky-900 mb-1">
                Heure de départ conseillée :
              </label>
              <input
                type="time"
                value={departureHour}
                onChange={(e) => setDepartureHour(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-sky-200 bg-white font-bold text-slate-800"
              />
              <div className="text-[10px] text-sky-700 font-medium flex items-center justify-between">
                <span>Arrivée estimée : <strong>{liveDaylight.estimatedArrivalHour}</strong></span>
                <span>Coucher soleil : <strong>{liveSunset}</strong></span>
              </div>
            </div>
          </div>

          {/* Live Daylight Warning */}
          {liveDaylight.nightRisk ? (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                {liveDaylight.warningMessage || `Arrivée à ${liveDaylight.estimatedArrivalHour} après le coucher du soleil (${liveSunset}). Feux puissants requis ou réduis la distance !`}
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                100% de jour : Départ {departureHour} ➔ Retour à {liveDaylight.estimatedArrivalHour} avant le coucher du soleil ({liveSunset}).
              </span>
            </div>
          )}

          {/* Detailed Structure (Échauffement, Corps de séance, Retour au calme) */}
          <div className="space-y-3">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-duo-green" />
              <span>Déroulé Structuré de la Séance</span>
            </div>

            {/* 1. Échauffement */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-slate-800">Échauffement Progressif (15 à 20 min)</span>
              </div>
              <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                {details.warmup}
              </p>
            </div>

            {/* 2. Corps de séance */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-duo-green text-white text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">Corps de Séance Principal</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full uppercase">
                  {details.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-800 pl-7 leading-relaxed font-medium">
                {details.mainSet}
              </p>
              <div className="pl-7 pt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-800">
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-200">
                  ⚙️ Cadence : {details.targetCadenceRpm}
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-200">
                  💓 {details.zones}
                </span>
              </div>
            </div>

            {/* 3. Retour au calme */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold text-slate-800">Retour au Calme & Récupération (10 à 15 min)</span>
              </div>
              <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                {details.cooldown}
              </p>
            </div>
          </div>

          {/* Nutrition & Hydration advice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
            <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-0.5">
              <span className="font-extrabold block">Ravitaillement spécifique pour cette séance :</span>
              <p className="leading-relaxed">{details.nutritionHydration}</p>
            </div>
          </div>

          {/* Wind Heading Advice */}
          {workout.windRoute && (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-2.5">
              <Wind className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-sky-900 space-y-0.5">
                <span className="font-extrabold block">Stratégie Vent pour {workout.departureLocation?.city} :</span>
                <p className="leading-relaxed">{workout.windRoute.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-duo-green hover:bg-duo-darkGreen text-white font-extrabold text-xs rounded-xl shadow-md shadow-green-500/20 transition-all"
          >
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};
