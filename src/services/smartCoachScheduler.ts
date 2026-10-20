import { ScheduledWorkout, UserProfile, TrainingLocation, WeatherCondition } from '../types';
import { ParsedCalendarEvent } from './icsParser';
import { checkDaylightSafety } from './weatherService';

export interface DaylightCalculationResult {
  durationMinutes: number;
  departureHour: string;
  arrivalHour: string;
  sunsetHour: string;
  nightRisk: boolean;
  minutesInDark: number;
  safeMaxDistanceKm: number;
  recommendationMessage: string;
}

/**
 * Calcule automatiquement la durée, l'heure d'arrivée et la sécurité crépusculaire
 */
export function calculateDaylightAndDuration(
  distanceKm: number,
  departureHourStr: string,
  sunsetStr: string = '18:48',
  avgSpeedKmH: number = 26
): DaylightCalculationResult {
  const durationMinutes = Math.round((distanceKm / avgSpeedKmH) * 60);

  const [depH, depM] = departureHourStr.split(':').map(Number);
  const totalDepMinutes = (depH || 14) * 60 + (depM || 0);
  const totalArrivalMinutes = totalDepMinutes + durationMinutes;

  const arrH = Math.floor(totalArrivalMinutes / 60) % 24;
  const arrM = totalArrivalMinutes % 60;
  const arrivalHour = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;

  const [sunH, sunM] = sunsetStr.split(':').map(Number);
  const sunsetMinutes = (sunH || 18) * 60 + (sunM || 48);

  const daylightLeftMinutes = sunsetMinutes - totalDepMinutes;
  const nightRisk = totalArrivalMinutes >= sunsetMinutes - 10;
  const minutesInDark = Math.max(0, totalArrivalMinutes - sunsetMinutes);

  // Distance maximale recommandée pour rentrer 10 minutes avant le coucher du soleil
  const safeMinutes = Math.max(0, daylightLeftMinutes - 10);
  const safeMaxDistanceKm = Math.max(15, Math.floor((safeMinutes / 60) * avgSpeedKmH));

  let recommendationMessage = '';
  if (minutesInDark > 0) {
    recommendationMessage = `⚠️ Nuit : Arrivée à ${arrivalHour} (${minutesInDark} min après le coucher de soleil à ${sunsetStr}). Éclairages puissants obligatoires ou limite la sortie à ${safeMaxDistanceKm} km pour rentrer de jour.`;
  } else if (nightRisk) {
    recommendationMessage = `Arrivée à ${arrivalHour} au crépuscule (${sunsetStr}). Prévoyez des feux de signalisation par précaution.`;
  } else {
    recommendationMessage = `☀️ 100% de jour : Départ ${departureHourStr} ➔ Arrivée ${arrivalHour} (avant le coucher de soleil à ${sunsetStr}).`;
  }

  return {
    durationMinutes,
    departureHour: departureHourStr,
    arrivalHour,
    sunsetHour: sunsetStr,
    nightRisk,
    minutesInDark,
    safeMaxDistanceKm,
    recommendationMessage
  };
}

/**
 * Trouve l'heure de fin du dernier cours/événement du jour
 */
export function getLatestEventEnd(events: ParsedCalendarEvent[], dayDateStr: string, dayIndex: number): string | null {
  const dayEvents = events.filter((e) => {
    if (e.dateStr && e.dateStr.length >= 8) {
      return e.dateStr === dayDateStr;
    }
    return e.dayOfWeek === dayIndex;
  });

  if (dayEvents.length === 0) return null;

  const sorted = [...dayEvents].sort((a, b) => (b.endHour || b.startHour).localeCompare(a.endHour || a.startHour));
  return sorted[0].endHour || sorted[0].startHour;
}

/**
 * Équilibre le volume hebdomadaire selon la règle absolue des +10% max par semaine.
 * Si le cycliste fait une séance en semaine (ex: 40 km le mercredi), la sortie longue du dimanche
 * est automatiquement plafonnée pour que Total Semaine <= previousWeekKm * 1.10.
 */
export function balanceWeeklyVolume(
  workouts: ScheduledWorkout[],
  previousWeekKm: number,
  avgSpeedKmH: number = 26
): ScheduledWorkout[] {
  const maxAllowedKm = Math.round(previousWeekKm * 1.10);
  const activeWorkouts = workouts.filter((w) => w.isPlannedByCyclist);

  if (activeWorkouts.length === 0) return workouts;

  // Trouver la sortie longue (généralement dimanche idx 6, ou samedi idx 5, ou la plus longue)
  let longRideIdx = workouts.findIndex((w) => w.dayIndex === 6 && w.isPlannedByCyclist);
  if (longRideIdx === -1) {
    longRideIdx = workouts.findIndex((w) => w.dayIndex === 5 && w.isPlannedByCyclist);
  }
  if (longRideIdx === -1) {
    // Prendre la plus grande distance active
    let maxDist = -1;
    workouts.forEach((w, i) => {
      if (w.isPlannedByCyclist && w.targetDistanceKm > maxDist) {
        maxDist = w.targetDistanceKm;
        longRideIdx = i;
      }
    });
  }

  // Calcul de la somme des autres jours actifs
  const otherDaysSum = workouts
    .filter((w, i) => w.isPlannedByCyclist && i !== longRideIdx)
    .reduce((sum, w) => sum + w.targetDistanceKm, 0);

  // Distance maximale allouée à la sortie longue
  const allowedForLongRide = Math.max(25, maxAllowedKm - otherDaysSum);

  return workouts.map((w, idx) => {
    let targetDistanceKm = w.targetDistanceKm;

    if (idx === longRideIdx && w.isPlannedByCyclist) {
      // Ajuster automatiquement la sortie longue pour respecter les 10%
      targetDistanceKm = Math.min(w.targetDistanceKm, allowedForLongRide);
    }

    const durationMinutes = Math.round((targetDistanceKm / avgSpeedKmH) * 60);
    const sunset = w.weather?.sunset || '18:48';
    const daylight = checkDaylightSafety(w.targetDepartureHour, durationMinutes, sunset);

    return {
      ...w,
      targetDistanceKm,
      estimatedDurationMinutes: durationMinutes,
      daylightStatus: daylight
    };
  });
}
