import { RideActivity } from '../types';

export const SAMPLE_CYCLING_ACTIVITIES: RideActivity[] = [
  {
    id: 'act-1',
    date: '2026-10-18',
    title: 'Sortie Automnale • Pévèle & Pavés de Camphin',
    distanceKm: 74.5,
    durationMinutes: 162, // 2h42
    avgSpeedKmh: 27.6,
    avgHeartRateBpm: 142,
    avgPowerWatts: 195,
    elevationGainM: 380,
    source: 'strava',
    notes: 'Bonne sensation dans le vent d’Est. Travail régulier à 80 rpm.'
  },
  {
    id: 'act-2',
    date: '2026-10-14',
    title: 'Intervalles PMA • Boucle de la Deûle',
    distanceKm: 46.2,
    durationMinutes: 95, // 1h35
    avgSpeedKmh: 29.2,
    avgHeartRateBpm: 156,
    avgPowerWatts: 220,
    elevationGainM: 190,
    source: 'strava',
    notes: '5x 3min à I4/I5. Jambes lourdes sur la dernière série.'
  },
  {
    id: 'act-3',
    date: '2026-10-11',
    title: 'Sortie Longue • Mont Cassel & Mont des Cats',
    distanceKm: 104.8,
    durationMinutes: 245, // 4h05
    avgSpeedKmh: 25.7,
    avgHeartRateBpm: 145,
    avgPowerWatts: 188,
    elevationGainM: 920,
    source: 'strava',
    notes: 'Superbe reconnaissance du relief flamand. Montée Cassel par les pavés.'
  },
  {
    id: 'act-4',
    date: '2026-10-07',
    title: 'Récupération active • Bords de la Lys',
    distanceKm: 32.0,
    durationMinutes: 76,
    avgSpeedKmh: 25.3,
    avgHeartRateBpm: 124,
    avgPowerWatts: 145,
    elevationGainM: 85,
    source: 'strava',
    notes: 'Tourner les jambes sans forcer en Zone 1/2.'
  },
  {
    id: 'act-5',
    date: '2026-10-04',
    title: 'Rythme & Peloton • Vers Arras par le Carami',
    distanceKm: 82.4,
    durationMinutes: 172,
    avgSpeedKmh: 28.7,
    avgHeartRateBpm: 149,
    avgPowerWatts: 205,
    elevationGainM: 520,
    source: 'garmin',
    notes: 'Prise de relais face au vent du Sud-Ouest.'
  },
  {
    id: 'act-6',
    date: '2026-09-29',
    title: 'Endurance Fondamentale • Vallée de la Marque',
    distanceKm: 61.3,
    durationMinutes: 138,
    avgSpeedKmh: 26.6,
    avgHeartRateBpm: 136,
    avgPowerWatts: 180,
    elevationGainM: 270,
    source: 'garmin',
    notes: 'Sortie en aisance respiratoire totale.'
  },
  {
    id: 'act-7',
    date: '2026-09-26',
    title: 'Séance Home-Trainer • Sweet-Spot 3x12min',
    distanceKm: 38.5,
    durationMinutes: 65,
    avgSpeedKmh: 35.5,
    avgHeartRateBpm: 154,
    avgPowerWatts: 235,
    elevationGainM: 0,
    source: 'garmin',
    notes: 'Temps pluvieux dehors. Séance calibrée sur Zwift.'
  },
  {
    id: 'act-8',
    date: '2026-09-20',
    title: 'Sortie Tempo • Boucle Weppes & Fromelles',
    distanceKm: 68.9,
    durationMinutes: 146,
    avgSpeedKmh: 28.3,
    avgHeartRateBpm: 147,
    avgPowerWatts: 198,
    elevationGainM: 310,
    source: 'strava',
    notes: 'Vent de 30 km/h latéral, travail de tenue de trajectoire.'
  },
  {
    id: 'act-9',
    date: '2026-09-17',
    title: 'Ascension Mont Noir & Kemmelberg',
    distanceKm: 92.1,
    durationMinutes: 218,
    avgSpeedKmh: 25.3,
    avgHeartRateBpm: 151,
    avgPowerWatts: 202,
    elevationGainM: 860,
    source: 'strava',
    notes: 'Pentes à 14%, excellente préparation aux monts de Lille-Hardelot.'
  },
  {
    id: 'act-10',
    date: '2026-09-13',
    title: 'Foncier matinal • Forêt de Phalempin',
    distanceKm: 55.0,
    durationMinutes: 122,
    avgSpeedKmh: 27.0,
    avgHeartRateBpm: 138,
    avgPowerWatts: 185,
    elevationGainM: 210,
    source: 'strava',
    notes: 'Brouillard au départ, soleil ensuite.'
  },
  // Historique plus ancien (> 10)
  {
    id: 'act-11',
    date: '2026-09-06',
    title: 'Endurance longue • Canal de Roubaix & Espierres',
    distanceKm: 78.2,
    durationMinutes: 175,
    avgSpeedKmh: 26.8,
    avgHeartRateBpm: 139,
    avgPowerWatts: 182,
    elevationGainM: 195,
    source: 'imported_file',
    notes: 'Parcours plat très roulant.'
  },
  {
    id: 'act-12',
    date: '2026-08-30',
    title: 'Grand Tour des Collines d’Artois • Notre-Dame de Lorette',
    distanceKm: 115.6,
    durationMinutes: 274,
    avgSpeedKmh: 25.3,
    avgHeartRateBpm: 148,
    avgPowerWatts: 194,
    elevationGainM: 1120,
    source: 'imported_file',
    notes: 'Test nutrition sur 4h30 : 60g de glucides par heure validés.'
  },
  {
    id: 'act-13',
    date: '2026-08-23',
    title: 'Sprint & Relances • Circuit Citadelle',
    distanceKm: 42.0,
    durationMinutes: 88,
    avgSpeedKmh: 28.6,
    avgHeartRateBpm: 153,
    avgPowerWatts: 215,
    elevationGainM: 140,
    source: 'imported_file',
    notes: 'Relances après chaque virage.'
  },
  {
    id: 'act-14',
    date: '2026-08-16',
    title: 'Sortie Canicule matinale • Départ 7h30',
    distanceKm: 65.4,
    durationMinutes: 140,
    avgSpeedKmh: 28.0,
    avgHeartRateBpm: 141,
    avgPowerWatts: 190,
    elevationGainM: 230,
    source: 'imported_file',
    notes: 'Éviter la chaleur de l’après-midi, 2 bidons d’électrolytes bus.'
  }
];
