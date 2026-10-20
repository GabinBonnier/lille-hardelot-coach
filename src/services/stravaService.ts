import { RideActivity } from '../types';

export interface StravaConfig {
  clientId: string;
  clientSecret: string;
}

// Retrieve from Vite env or fallback to official app credentials
export function getStravaConfig(): StravaConfig {
  const clientId =
    ((import.meta as any).env?.VITE_STRAVA_CLIENT_ID as string) ||
    localStorage.getItem('cap_hardelot_strava_client_id') ||
    '287437';
  const clientSecret =
    ((import.meta as any).env?.VITE_STRAVA_CLIENT_SECRET as string) ||
    localStorage.getItem('cap_hardelot_strava_client_secret') ||
    'f54b0443b8f14b10697e2bbc76137e5cb691a4be';
  return { clientId, clientSecret };
}

export function saveStravaConfig(clientId: string, clientSecret: string) {
  localStorage.setItem('cap_hardelot_strava_client_id', clientId.trim());
  localStorage.setItem('cap_hardelot_strava_client_secret', clientSecret.trim());
}

/**
 * Redirige l'utilisateur vers la page officielle d'autorisation OAuth Strava
 */
export function redirectToStravaAuth(clientId: string, redirectUri: string) {
  const scope = 'read,read_all,profile:read_all,activity:read_all';
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&approval_prompt=auto&scope=${scope}`;

  window.location.href = stravaAuthUrl;
}

/**
 * Échange le code temporaire d'autorisation contre un access_token Strava
 */
export async function exchangeStravaCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ athlete: any; accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Erreur échange token Strava:', errBody);
      return null;
    }

    const data = await response.json();
    return {
      athlete: data.athlete,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error('Erreur réseau Strava OAuth:', error);
    return null;
  }
}

/**
 * Récupère les vraies activités de l'athlète depuis l'API Strava
 */
export async function fetchStravaActivities(accessToken: string, perPage: number = 20): Promise<RideActivity[]> {
  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Erreur lecture activités Strava:', await response.text());
      return [];
    }

    const stravaRides = await response.json();

    // Filtre uniquement les activités de type vélo (Ride, VirtualRide, GravelRide, EBikeRide)
    const cyclingRides = stravaRides.filter((act: any) =>
      ['Ride', 'VirtualRide', 'GravelRide', 'EBikeRide', 'MountainBikeRide'].includes(act.type) ||
      ['Ride', 'VirtualRide', 'GravelRide'].includes(act.sport_type)
    );

    return cyclingRides.map((act: any) => ({
      id: `strava-${act.id}`,
      date: act.start_date_local ? act.start_date_local.substring(0, 10) : new Date().toISOString().substring(0, 10),
      title: act.name || 'Sortie Vélo',
      distanceKm: Number((act.distance / 1000).toFixed(1)),
      durationMinutes: Math.round(act.moving_time / 60),
      avgSpeedKmh: Number((act.average_speed * 3.6).toFixed(1)),
      avgHeartRateBpm: act.average_heartrate ? Math.round(act.average_heartrate) : undefined,
      avgPowerWatts: act.average_watts ? Math.round(act.average_watts) : undefined,
      elevationGainM: Math.round(act.total_elevation_gain || 0),
      source: 'strava' as const,
      notes: act.description || `Sortie Strava • Dénivelé: ${Math.round(act.total_elevation_gain || 0)}m D+`
    }));
  } catch (error) {
    console.error('Erreur récupération activités Strava:', error);
    return [];
  }
}
