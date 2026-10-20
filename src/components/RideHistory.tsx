import React, { useState } from 'react';
import { RideActivity } from '../types';
import { 
  Bike, 
  Heart, 
  Clock, 
  Gauge, 
  Mountain, 
  Zap, 
  Calendar, 
  Search, 
  X, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface RideHistoryProps {
  activities: RideActivity[];
}

export const RideHistory: React.FC<RideHistoryProps> = ({ activities }) => {
  const [showAllModal, setShowAllModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'speed' | 'elevation'>('date');

  // Format minutes into "2h 42m"
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${String(minutes).padStart(2, '0')}`;
  };

  // 10 most recent rides for the main dashboard view
  const recent10 = activities.slice(0, 10);

  // Filtered & sorted for modal
  const filteredActivities = activities
    .filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.date.includes(searchQuery))
    .sort((a, b) => {
      if (sortBy === 'distance') return b.distanceKm - a.distanceKm;
      if (sortBy === 'speed') return b.avgSpeedKmh - a.avgSpeedKmh;
      if (sortBy === 'elevation') return b.elevationGainM - a.elevationGainM;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Calculate totals
  const totalKm = Math.round(activities.reduce((acc, act) => acc + act.distanceKm, 0));
  const avgSpeed = (
    activities.reduce((acc, act) => acc + act.avgSpeedKmh, 0) / (activities.length || 1)
  ).toFixed(1);
  const totalDplus = activities.reduce((acc, act) => acc + act.elevationGainM, 0);

  const getSourceBadge = (source: RideActivity['source']) => {
    if (source === 'strava') {
      return (
        <span className="text-[10px] font-black tracking-wider uppercase bg-[#fc4c02]/10 text-[#fc4c02] px-2 py-0.5 rounded-full border border-[#fc4c02]/20">
          Strava
        </span>
      );
    }
    if (source === 'garmin') {
      return (
        <span className="text-[10px] font-black tracking-wider uppercase bg-[#007cc3]/10 text-[#007cc3] px-2 py-0.5 rounded-full border border-[#007cc3]/20">
          Garmin
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-500/20">
        Fichier
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Bike className="w-5 h-5 text-duo-green" />
              10 Dernières Sorties Réalisées
            </h3>
            <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
              {activities.length} au total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Données synchronisées avec tes capteurs (vitesse, pulsations, D+, puissance).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          className="text-xs font-bold text-duo-green hover:text-duo-darkGreen bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all border border-emerald-200 flex items-center gap-1.5"
        >
          <span>Voir tout l'historique complet</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick stats ribbon */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/40 text-center py-3">
        <div>
          <div className="text-xs text-slate-500 font-medium">Distance cumulée</div>
          <div className="text-base font-extrabold text-slate-800">{totalKm} km</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Vitesse moyenne</div>
          <div className="text-base font-extrabold text-slate-800">{avgSpeed} km/h</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Dénivelé total</div>
          <div className="text-base font-extrabold text-slate-800">{totalDplus.toLocaleString()} m D+</div>
        </div>
      </div>

      {/* List of 10 latest rides */}
      <div className="divide-y divide-slate-100">
        {recent10.map((activity) => (
          <div
            key={activity.id}
            className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            {/* Title & Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getSourceBadge(activity.source)}
                <span className="font-bold text-slate-800 text-sm">{activity.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {activity.date}
                </span>
                {activity.notes && (
                  <span className="truncate max-w-xs text-slate-500 italic">
                    « {activity.notes} »
                  </span>
                )}
              </div>
            </div>

            {/* Metrics pills */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-semibold">
              {/* Distance */}
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-slate-800 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-duo-green" />
                <span>{activity.distanceKm} km</span>
              </div>

              {/* Time */}
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>{formatDuration(activity.durationMinutes)}</span>
              </div>

              {/* Speed */}
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                <span>{activity.avgSpeedKmh} km/h</span>
              </div>

              {/* HR */}
              {activity.avgHeartRateBpm && (
                <div className="bg-rose-50 border border-rose-200/60 px-3 py-1.5 rounded-xl text-rose-700 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>{activity.avgHeartRateBpm} bpm</span>
                </div>
              )}

              {/* Elevation */}
              <div className="bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-xl text-amber-800 flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-amber-600" />
                <span>{activity.elevationGainM} m</span>
              </div>

              {/* Power Watts */}
              {activity.avgPowerWatts && (
                <div className="bg-purple-50 border border-purple-200/60 px-2.5 py-1.5 rounded-xl text-purple-700 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-600" />
                  <span>{activity.avgPowerWatts} W</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer trigger */}
      <div className="p-4 bg-slate-50/60 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Afficher l'intégralité des {activities.length} activités archivées →
        </button>
      </div>

      {/* MODAL: View All Activities */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  Historique Complet de tes Sorties Cyclistes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recherche, filtre et analyse toutes les sorties importées.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher une sortie (ex: Cassel, Pévèle...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-duo-green"
                />
              </div>

              <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                <span className="text-slate-500 font-semibold whitespace-nowrap">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-duo-green"
                >
                  <option value="date">Date (plus récente)</option>
                  <option value="distance">Distance (plus longue)</option>
                  <option value="speed">Vitesse moyenne (plus rapide)</option>
                  <option value="elevation">Dénivelé D+ (plus difficile)</option>
                </select>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
              {filteredActivities.map((act) => (
                <div key={act.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {getSourceBadge(act.source)}
                      <span className="font-bold text-slate-800 text-sm">{act.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{act.date}</span>
                      {act.notes && <span className="text-slate-600 italic">« {act.notes} »</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800">{act.distanceKm} km</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800">{formatDuration(act.durationMinutes)}</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800">{act.avgSpeedKmh} km/h</span>
                    {act.avgHeartRateBpm && (
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200">
                        {act.avgHeartRateBpm} bpm
                      </span>
                    )}
                    <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                      {act.elevationGainM} m D+
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="px-6 py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
