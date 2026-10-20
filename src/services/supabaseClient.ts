import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, RideActivity } from '../types';

// Check either from environment variables or custom local config
const getEnvOrLocal = (envVar: string, localKey: string): string => {
  return ((import.meta as any).env?.[envVar] as string) || localStorage.getItem(localKey) || '';
};

let supabaseUrl = getEnvOrLocal('VITE_SUPABASE_URL', 'cap_hardelot_supabase_url');
let supabaseAnonKey = getEnvOrLocal('VITE_SUPABASE_ANON_KEY', 'cap_hardelot_supabase_anon_key');

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      client = createClient(supabaseUrl, supabaseAnonKey);
      return client;
    } catch (err) {
      console.warn('Erreur initialisation Supabase client:', err);
    }
  }
  return null;
}

export function isSupabaseConnected(): boolean {
  return !!getSupabase();
}

export function configureSupabaseKeys(url: string, key: string) {
  supabaseUrl = url.trim();
  supabaseAnonKey = key.trim();
  localStorage.setItem('cap_hardelot_supabase_url', supabaseUrl);
  localStorage.setItem('cap_hardelot_supabase_anon_key', supabaseAnonKey);
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
}

// -----------------------------------------------------------------------------
// CLOUD AUTHENTICATION & DATA SYNC
// -----------------------------------------------------------------------------

export async function cloudSignInOrSignUp(email: string, pass: string): Promise<{ user: any; error: any }> {
  const sb = getSupabase();
  if (!sb) return { user: null, error: new Error('Supabase non configuré') };

  // First try signing in
  const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({
    email,
    password: pass
  });

  if (!signInError && signInData.user) {
    return { user: signInData.user, error: null };
  }

  // If user doesn't exist, sign up
  if (signInError && (signInError.message.includes('Invalid login') || signInError.message.includes('not found'))) {
    const { data: signUpData, error: signUpError } = await sb.auth.signUp({
      email,
      password: pass
    });
    return { user: signUpData.user, error: signUpError };
  }

  return { user: null, error: signInError };
}

export async function cloudSignOut(): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    await sb.auth.signOut();
  }
}

export async function fetchCloudProfile(userId: string): Promise<UserProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      name: data.last_name || '',
      firstName: data.first_name || '',
      email: data.email || '',
      authMethod: data.auth_method || 'classic',
      hasStravaPlus: data.has_strava_plus || false,
      equipment: data.equipment,
      location: data.location,
      appleCalendarLinked: data.apple_calendar_linked,
      level: data.level,
      weeklyHours: data.weekly_hours,
      bikeType: data.bike_type,
      estimatedFtpWatts: data.estimated_ftp_watts,
      maxHeartRateBpm: data.max_heart_rate_bpm,
      targetSpeedLilleHardelot: data.target_speed_lille_hardelot,
      preferredRideDays: data.preferred_ride_days,
      onboardingCompleted: data.onboarding_completed
    };
  } catch (e) {
    console.error('Erreur lecture profil Supabase:', e);
    return null;
  }
}

export async function saveCloudProfile(userId: string, profile: UserProfile): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('profiles').upsert({
      id: userId,
      first_name: profile.firstName,
      last_name: profile.name,
      email: profile.email,
      auth_method: profile.authMethod,
      has_strava_plus: profile.hasStravaPlus,
      equipment: profile.equipment,
      location: profile.location,
      apple_calendar_linked: profile.appleCalendarLinked,
      level: profile.level,
      weekly_hours: profile.weeklyHours,
      bike_type: profile.bikeType,
      estimated_ftp_watts: profile.estimatedFtpWatts,
      max_heart_rate_bpm: profile.maxHeartRateBpm,
      target_speed_lille_hardelot: profile.targetSpeedLilleHardelot,
      preferred_ride_days: profile.preferredRideDays,
      onboarding_completed: profile.onboardingCompleted,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Erreur sauvegarde profil:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erreur sauvegarde profil:', e);
    return false;
  }
}

export async function fetchCloudActivities(userId: string): Promise<RideActivity[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      title: d.title,
      distanceKm: Number(d.distance_km),
      durationMinutes: Number(d.duration_minutes),
      avgSpeedKmh: Number(d.avg_speed_kmh),
      avgHeartRateBpm: d.avg_heart_rate_bpm,
      avgPowerWatts: d.avg_power_watts,
      elevationGainM: d.elevation_gain_m,
      source: d.source,
      notes: d.notes
    }));
  } catch (e) {
    console.error('Erreur fetch activités Supabase:', e);
    return null;
  }
}

export async function saveCloudActivities(userId: string, activities: RideActivity[]): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  try {
    const rows = activities.map((a) => ({
      user_id: userId,
      date: a.date,
      title: a.title,
      distance_km: a.distanceKm,
      duration_minutes: a.durationMinutes,
      avg_speed_kmh: a.avgSpeedKmh,
      avg_heart_rate_bpm: a.avgHeartRateBpm,
      avg_power_watts: a.avgPowerWatts,
      elevation_gain_m: a.elevationGainM,
      source: a.source,
      notes: a.notes
    }));

    const { error } = await sb.from('activities').insert(rows);
    if (error) {
      console.warn('Erreur insert activités:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erreur save activités:', e);
    return false;
  }
}
