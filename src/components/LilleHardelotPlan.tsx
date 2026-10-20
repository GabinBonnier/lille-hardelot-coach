import React, { useState } from 'react';
import { 
  Trophy, 
  MapPin, 
  Mountain, 
  Wind, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Zap, 
  Flame, 
  Compass, 
  Heart,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles
} from 'lucide-react';

export const LilleHardelotPlan: React.FC = () => {
  const [activeCycle, setActiveCycle] = useState<number>(1);

  // Target event date: End of May 2027
  const targetDate = new Date('2027-05-23');
  const now = new Date('2026-10-20');
  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);

  const cycles = [
    {
      id: 1,
      title: 'Cycle 1 • Socle Foncier & Endurance Hivernale',
      period: 'Novembre 2026 – Décembre 2026',
      weeks: 'Semaines 1 à 8',
      focus: 'Endurance Fondamentale (Zone 2) & Cadence de pédalage',
      description: 'L’objectif est de développer l’endurance aérobie, l’économie d’effort et la capacité à brûler les lipides sans puiser dans les réserves de glycogène.',
      weeklyTarget: '3 à 4 séances / semaine (5h à 7h)',
      keySessions: [
        { name: 'Sortie Longue Foncier', detail: '60 à 80 km à allure conversationnelle (Zone 2, FC < 75%). Cadence fluide à 85-90 rpm.' },
        { name: 'Séance Cadence / Home-Trainer', detail: '1h15 avec vélocité : 4x 5min à 105 rpm pour fluidifier le geste de pédalage.' },
        { name: 'Renforcement & Gainage', detail: '2x 20min de gainage abdos/lombaires pour résister aux 6 heures sur la selle sans mal de dos.' }
      ],
      tips: 'En cas de pluie ou de froid intense, basculez sans hésiter sur le home-trainer connecté.'
    },
    {
      id: 2,
      title: 'Cycle 2 • Force en Côte & Développement Seuil (FTP)',
      period: 'Janvier 2027 – Février 2027',
      weeks: 'Semaines 9 à 16',
      focus: 'Force sous-maximale & PMA en côte',
      description: 'Le parcours de Lille-Hardelot compte plus de 1 500m de dénivelé positif avec des bosses courtes mais répétées. On muscle les cuisses pour passer les monts sans caler.',
      weeklyTarget: '3 à 4 séances / semaine (6h à 8h)',
      keySessions: [
        { name: 'Travail de Force en Côte', detail: 'Sortie vers les collines d’Artois : 5 répétitions de côtes de 1km à 50-55 rpm assis, mains aux cocottes sans tirer sur le guidon.' },
        { name: 'Sweet-Spot (88-93% FTP)', detail: '3x 12 minutes calé juste sous le seuil anaérobie. C’est la clé pour maintenir 28 km/h sur le plat.' },
        { name: 'Endurance Moyenne', detail: '75 à 90 km avec vent de face au départ pour travailler la résistance mentale.' }
      ],
      tips: 'Adoptez une cassette adaptée (30 ou 32 dents à l’arrière) pour conserver de la vélocité sur les pentes du Haut-Pays.'
    },
    {
      id: 3,
      title: 'Cycle 3 • Montée en Volume & Simulation Épreuve',
      period: 'Mars 2027 – Avril 2027',
      weeks: 'Semaines 17 à 25',
      focus: 'Sorties de 100km, 120km et 140km + Stratégie de Nutrition',
      description: 'Phase cruciale : habituer le corps et l’estomac à rouler pendant 5 à 6 heures consécutives. Test réel des ravitaillements (glucides et électrolytes).',
      weeklyTarget: '4 séances / semaine (8h à 11h)',
      keySessions: [
        { name: 'La Grande Sortie Palier', detail: 'Progression par quinzaine : 100 km (S18), 120 km (S20), 140 km (S22). 1 000m D+ minimum.' },
        { name: 'Peloton & Prise de Relais', detail: 'Rouler en groupe pour apprendre à s’abriter du vent et économiser 30% d’énergie dans les roues.' },
        { name: 'Test Nutrition en Course', detail: 'Consommer impérativement 50g à 60g de glucides par heure (gels, barres, pâte d’amande) et 1 bidon de 500ml toutes les 1h15.' }
      ],
      tips: 'Programmez vos sorties avec le vent de face au départ (direction Ouest / Sud-Ouest) pour simuler l’approche de la côte maritime.'
    },
    {
      id: 4,
      title: 'Cycle 4 • Affûtage, Fraîcheur & Jour J (Mai 2027)',
      period: 'Mai 2027 (J-21 avant Hardelot)',
      weeks: 'Semaines 26 à 28',
      focus: 'Fraîcheur musculaire, révision du matériel & Reconnaissance',
      description: 'Le volume diminue de 40%, mais on maintient quelques déblocages courts et intenses pour garder le punch.',
      weeklyTarget: '2 à 3 sorties / semaine (4h à 5h)',
      keySessions: [
        { name: 'Déblocage J-3', detail: '1h30 avec 4 accélérations de 1 minute allure course pour ouvrir les poumons et faire tourner les jambes.' },
        { name: 'Check-up Matériel', detail: 'Pneus neufs 28mm gonflés à la bonne pression, chaîne dégraissée et cirée, freins vérifiés.' },
        { name: 'Jour J : Lille-Hardelot', detail: '160 km magiques de Lille jusqu’à la plage d’Hardelot. Gestion sage des 80 premiers kilomètres !' }
      ],
      tips: 'Le piège classique de Lille-Hardelot est de partir trop vite dans le groupe au départ de Lille. Gardez 20% sous la pédale pour les monts du km 100 au km 135 !'
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6">
      {/* Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white relative">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-300" /> Objectif Officiel 2027
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Plan d’Entraînement Maître • Lille-Hardelot 2027
            </h2>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              160 km de traversée du Nord et du Pas-de-Calais jusqu’à la mer. ~1 500m de dénivelé positif et le vent de la Côte d’Opale.
            </p>
          </div>

          {/* Countdown badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center flex flex-col items-center min-w-[170px]">
            <div className="text-3xl font-black text-yellow-300 tracking-tight">{diffDays}</div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/90">Jours Restants</div>
            <div className="text-[10px] text-white/70 mt-0.5">({diffWeeks} semaines de prépa)</div>
          </div>
        </div>
      </div>

      {/* Key Stats of the Race */}
      <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-xs text-slate-500 font-bold uppercase">Distance Totale</div>
          <div className="text-lg font-black text-slate-800 mt-0.5">~158 - 162 km</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <div className="text-xs text-amber-700 font-bold uppercase">Dénivelé Positif</div>
          <div className="text-lg font-black text-amber-900 mt-0.5">~1 520 m D+</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-center">
          <div className="text-xs text-sky-700 font-bold uppercase">Points Clés</div>
          <div className="text-lg font-black text-sky-900 mt-0.5">Mont de Thanne / Artois</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <div className="text-xs text-emerald-700 font-bold uppercase">Arrivée</div>
          <div className="text-lg font-black text-emerald-900 mt-0.5">Hardelot-Plage 🌊</div>
        </div>
      </div>

      {/* Interactive Cycle Tabs */}
      <div className="px-6">
        <div className="border-b border-slate-200 flex flex-wrap gap-2">
          {cycles.map((cycle) => (
            <button
              key={cycle.id}
              type="button"
              onClick={() => setActiveCycle(cycle.id)}
              className={`pb-3 px-3 text-xs md:text-sm font-extrabold transition-all border-b-2 ${
                activeCycle === cycle.id
                  ? 'border-duo-green text-duo-green'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Cycle {cycle.id} ({cycle.weeks})
            </button>
          ))}
        </div>
      </div>

      {/* Cycle Details */}
      <div className="px-6 pb-6">
        {cycles
          .filter((c) => c.id === activeCycle)
          .map((c) => (
            <div key={c.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-lg font-black text-slate-800">{c.title}</h4>
                  <div className="text-xs text-slate-500 font-semibold">{c.period} • {c.weeklyTarget}</div>
                </div>
                <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  Focus : {c.focus}
                </div>
              </div>

              <p className="text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {c.description}
              </p>

              {/* 3 Key Sessions */}
              <div className="space-y-2.5">
                <div className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Séances Clés Programmées :
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {c.keySessions.map((session, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:border-duo-green transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="font-bold text-slate-800 text-xs">{session.name}</div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{session.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Rouli's pro tip */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold">Conseil de Rouli : </span>
                  <span>{c.tips}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
