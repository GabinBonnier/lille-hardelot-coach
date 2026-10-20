export type AuthMethod = 'strava' | 'garmin' | 'classic';

export interface UserEquipment {
  powerMeter: boolean; // Pédale ou capteur de puissance
  hrm: boolean; // Ceinture cardiaque
  cyclingComputer: boolean; // Compteur GPS (Garmin, Wahoo...)
  smartTrainer: boolean; // Home trainer connecté
}

export interface TrainingLocation {
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  department: string;
  region: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  dayOfWeek: number; // 1 = Lundi, 7 = Dimanche
  startHour: string; // '09:00'
  endHour: string; // '11:00'
  type: 'calendar_busy' | 'training_ride';
}

export type CyclingLevel = 'debutant' | 'intermediaire' | 'regulier' | 'expert';

export interface UserProfile {
  name: string;
  firstName: string;
  email: string;
  authMethod: AuthMethod;
  hasStravaPlus?: boolean;
  equipment: UserEquipment;
  location: TrainingLocation;
  appleCalendarLinked: boolean;
  
  // Questions ciblées supplémentaires
  level: CyclingLevel;
  weeklyHours: number;
  bikeType: 'route_alu' | 'route_carbone' | 'gravel' | 'autre';
  estimatedFtpWatts?: number;
  maxHeartRateBpm?: number;
  targetSpeedLilleHardelot: string; // '24-26 km/h', '27-29 km/h', '30+ km/h'
  preferredRideDays: number[]; // 1 to 7 (1 = Mon, 7 = Sun)
  
  // État de l'onboarding
  onboardingCompleted: boolean;
}

export interface RideActivity {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmh: number;
  avgHeartRateBpm?: number;
  avgPowerWatts?: number;
  elevationGainM: number;
  source: 'strava' | 'garmin' | 'imported_file';
  notes?: string;
}

export interface WeatherCondition {
  tempC: number;
  weatherCode: number;
  weatherDescription: string;
  isRainy: boolean;
  isFoggy: boolean;
  windSpeedKmh: number;
  windGustsKmh: number;
  windDirectionDeg: number;
  windDirectionCardinal: string;
  sunrise: string; // '07:15'
  sunset: string; // '19:42'
  uvIndex?: number;
}

export interface WindRouteRecommendation {
  outboundHeadingDeg: number;
  outboundHeadingName: string;
  returnHeadingDeg: number;
  returnHeadingName: string;
  explanation: string;
  reliefComment: string;
}

export interface WorkoutDetails {
  warmup: string;
  mainSet: string;
  cooldown: string;
  targetCadenceRpm: string;
  nutritionHydration: string;
  zones: string;
  difficulty: 'Accessible' | 'Modéré' | 'Exigeant' | 'Intense';
}

export interface ScheduledWorkout {
  id: string;
  dayIndex: number; // 0 to 6 (Lundi à Dimanche)
  dayDate: string; // YYYY-MM-DD
  dayName: string;
  title: string;
  targetDistanceKm: number;
  estimatedDurationMinutes: number;
  intensity: 'Endurance Fondamentale' | 'Dénivelé & Monts' | 'Rythme & Seuil' | 'Récupération Active';
  targetDepartureHour: string; // '14:00'
  departureLocation: TrainingLocation; // Localisation spécifique au jour !
  workoutDetails: WorkoutDetails; // Déroulé détaillé de la séance
  weather?: WeatherCondition;
  windRoute?: WindRouteRecommendation;
  daylightStatus: {
    nightRisk: boolean;
    estimatedArrivalHour: string;
    warningMessage?: string;
  };
  reliefCategory: 'Plaine & Faux-plat' | 'Monts & Côtes' | 'Vallonné';
  isPlannedByCyclist: boolean;
  completed?: boolean;
}
