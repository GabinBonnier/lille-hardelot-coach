-- ==============================================================================
-- CAP HARDELOT 2027 • SCHÉMA POSTGRESQL SUPABASE
-- À copier-coller dans l'onglet 'SQL Editor' de votre projet Supabase
-- ==============================================================================

-- 1. Table des Profils Utilisateurs (reliée à l'authentification Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  auth_method TEXT DEFAULT 'classic', -- 'strava', 'garmin', 'classic'
  has_strava_plus BOOLEAN DEFAULT false,
  equipment JSONB DEFAULT '{"powerMeter": true, "hrm": true, "cyclingComputer": true, "smartTrainer": true}'::jsonb,
  location JSONB DEFAULT '{"city": "Lille", "postalCode": "59000", "lat": 50.6292, "lng": 3.0573, "department": "Nord (59)", "region": "Hauts-de-France"}'::jsonb,
  apple_calendar_linked BOOLEAN DEFAULT true,
  level TEXT DEFAULT 'regulier',
  weekly_hours INTEGER DEFAULT 7,
  bike_type TEXT DEFAULT 'route_carbone',
  estimated_ftp_watts INTEGER DEFAULT 240,
  max_heart_rate_bpm INTEGER DEFAULT 188,
  target_speed_lille_hardelot TEXT DEFAULT '27-29 km/h',
  preferred_ride_days INTEGER[] DEFAULT ARRAY[3, 6, 7], -- 1 = Lundi, 7 = Dimanche
  onboarding_completed BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des Activités Réalisées (historique des sorties)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  distance_km NUMERIC(6,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  avg_speed_kmh NUMERIC(5,2) NOT NULL,
  avg_heart_rate_bpm INTEGER,
  avg_power_watts INTEGER,
  elevation_gain_m INTEGER DEFAULT 0,
  source TEXT DEFAULT 'strava', -- 'strava', 'garmin', 'imported_file'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Activation de la Sécurité Ligne par Ligne (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 4. Politiques de sécurité (chaque utilisateur ne lit et n'écrit que ses propres données)
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent voir leurs propres activités"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs activités"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier ou supprimer leurs activités"
  ON public.activities FOR ALL
  USING (auth.uid() = user_id);
