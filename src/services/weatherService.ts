import { WeatherCondition, WindRouteRecommendation } from '../types';

export function getCardinalDirection(deg: number): string {
  const normalized = (deg % 360 + 360) % 360;
  const directions = [
    'Nord (N)',
    'Nord-Nord-Est (NNE)',
    'Nord-Est (NE)',
    'Est-Nord-Est (ENE)',
    'Est (E)',
    'Est-Sud-Est (ESE)',
    'Sud-Est (SE)',
    'Sud-Sud-Est (SSE)',
    'Sud (S)',
    'Sud-Sud-Ouest (SSO)',
    'Sud-Ouest (SO)',
    'Ouest-Sud-Ouest (OSO)',
    'Ouest (O)',
    'Ouest-Nord-Ouest (ONO)',
    'Nord-Ouest (NO)',
    'Nord-Nord-Ouest (NNO)'
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

export function calculateWindRecommendation(windFromDeg: number, city: string = 'Lille'): WindRouteRecommendation {
  // Le vent météo indique d'OÙ vient le vent.
  // Par exemple 220° = vent de Sud-Ouest.
  // Pour faire la première moitié "face au vent", il faut rouler vers la provenance du vent (220°).
  const outboundDeg = Math.round(windFromDeg % 360);
  // Retour vent dans le dos = direction opposée (outbound + 180)
  const returnDeg = Math.round((windFromDeg + 180) % 360);

  const outboundName = getCardinalDirection(outboundDeg);
  const returnName = getCardinalDirection(returnDeg);

  // Topographie selon la direction autour de la métropole lilloise / Nord-Pas-de-Calais
  let reliefComment = '';
  if (outboundDeg >= 200 && outboundDeg <= 260) {
    reliefComment = 'Direction Artois & Béthunois : terrain vallonné avec successions de bosses. Idéal pour habituer les cuisses au dénivelé de Lille-Hardelot.';
  } else if (outboundDeg >= 270 && outboundDeg <= 340) {
    reliefComment = 'Direction Flandres intérieures (Cassel, Mont des Cats) : secteur avec des monts raides (jusqu’à 8-10%). Excellent travail de PMA en côte.';
  } else if (outboundDeg >= 40 && outboundDeg <= 130) {
    reliefComment = 'Direction Plaine de la Lys / Vallée de la Scarpe : parcours roulant et plat. Idéal pour travailler la cadence et l’endurance de base sans à-coups.';
  } else {
    reliefComment = 'Direction Pévèle & Weppes : faux-plats montants réguliers et routes de campagne protégées.';
  }

  return {
    outboundHeadingDeg: outboundDeg,
    outboundHeadingName: outboundName,
    returnHeadingDeg: returnDeg,
    returnHeadingName: returnName,
    explanation: `Partez cap ${outboundName} (${outboundDeg}°) pour affronter le vent pendant que vous avez de l'énergie. Faites demi-tour pour revenir cap ${returnName} (${returnDeg}°), vous rentrerez poussé par le vent !`,
    reliefComment
  };
}

export function checkDaylightSafety(
  departureHourStr: string,
  durationMinutes: number,
  sunsetStr: string = '18:45'
): { nightRisk: boolean; estimatedArrivalHour: string; warningMessage?: string } {
  const [depH, depM] = departureHourStr.split(':').map(Number);
  const totalDepMinutes = depH * 60 + depM;
  const totalArrivalMinutes = totalDepMinutes + durationMinutes;

  const arrH = Math.floor(totalArrivalMinutes / 60) % 24;
  const arrM = totalArrivalMinutes % 60;
  const estimatedArrivalHour = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;

  const [sunH, sunM] = sunsetStr.split(':').map(Number);
  const sunsetMinutes = sunH * 60 + sunM;

  // Si l'arrivée est prévue dans les 15 minutes avant le coucher du soleil ou après
  const nightRisk = totalArrivalMinutes >= sunsetMinutes - 15;

  let warningMessage: string | undefined = undefined;
  if (nightRisk) {
    const diffMin = totalArrivalMinutes - sunsetMinutes;
    if (diffMin > 0) {
      warningMessage = `Arrivée estimée à ${estimatedArrivalHour}, soit ${diffMin} min après le coucher de soleil (${sunsetStr}). Risque important de rouler dans le noir ! Éclairages obligatoires ou décalez le départ.`;
    } else {
      warningMessage = `Arrivée à ${estimatedArrivalHour} juste au crépuscule (${sunsetStr}). Prévoyez des feux avant/arrière pour votre sécurité.`;
    }
  }

  return {
    nightRisk,
    estimatedArrivalHour,
    warningMessage
  };
}

export async function fetchLiveWeather(lat: number, lng: number): Promise<WeatherCondition> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Open-Meteo response not ok');
    
    const data = await response.json();
    const current = data.current_weather;
    const daily = data.daily;

    const weatherCode = current.weathercode;
    const windSpeedKmh = Math.round(current.windspeed);
    const windDirectionDeg = Math.round(current.winddirection);
    const windGustsKmh = Math.round(daily?.windgusts_10m_max?.[0] || windSpeedKmh * 1.3);

    // Weather code translation
    // 0 = Clear, 1-3 = Part cloudy, 45,48 = Fog, 51-67 = Rain, 80-82 = Showers
    const isRainy = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
    const isFoggy = weatherCode === 45 || weatherCode === 48;

    let weatherDesc = 'Temps sec & ciel dégagé';
    if (weatherCode === 0) weatherDesc = 'Grand soleil';
    else if (weatherCode <= 3) weatherDesc = 'Ciel voilé à nuageux';
    else if (isFoggy) weatherDesc = 'Brouillard / Visibilité réduite';
    else if (isRainy) weatherDesc = 'Pluie ou averses prévues';
    else if (weatherCode >= 71) weatherDesc = 'Chutes de neige';

    const rawSunrise = daily?.sunrise?.[0] || '2026-10-20T07:30';
    const rawSunset = daily?.sunset?.[0] || '2026-10-20T18:40';
    
    const sunrise = rawSunrise.includes('T') ? rawSunrise.split('T')[1].substring(0, 5) : '07:30';
    const sunset = rawSunset.includes('T') ? rawSunset.split('T')[1].substring(0, 5) : '18:40';

    return {
      tempC: Math.round(current.temperature),
      weatherCode,
      weatherDescription: weatherDesc,
      isRainy,
      isFoggy,
      windSpeedKmh,
      windGustsKmh,
      windDirectionDeg,
      windDirectionCardinal: getCardinalDirection(windDirectionDeg),
      sunrise,
      sunset
    };
  } catch (err) {
    console.warn('Fallback to local weather forecast for Hauts-de-France', err);
    // Realist default fallback for North of France
    return {
      tempC: 14,
      weatherCode: 2,
      weatherDescription: 'Éclaircies et vent modéré',
      isRainy: false,
      isFoggy: false,
      windSpeedKmh: 24,
      windGustsKmh: 38,
      windDirectionDeg: 230, // Vent Sud-Ouest typique
      windDirectionCardinal: getCardinalDirection(230),
      sunrise: '07:45',
      sunset: '18:35'
    };
  }
}
