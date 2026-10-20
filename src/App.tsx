import React, { useState, useEffect } from 'react';
import { UserProfile, RideActivity } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { SAMPLE_CYCLING_ACTIVITIES } from './data/defaultActivities';
import { 
  getSupabase, 
  fetchCloudProfile, 
  fetchCloudActivities, 
  saveCloudProfile, 
  saveCloudActivities 
} from './services/supabaseClient';

const STORAGE_PROFILE_KEY = 'cap_hardelot_user_profile_v1';
const STORAGE_ACTIVITIES_KEY = 'cap_hardelot_activities_v1';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [activities, setActivities] = useState<RideActivity[]>(() => {
    const saved = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return SAMPLE_CYCLING_ACTIVITIES;
  });

  // Check Supabase Cloud sync on mount
  useEffect(() => {
    const checkCloud = async () => {
      const sb = getSupabase();
      if (!sb) return;

      const { data } = await sb.auth.getUser();
      if (data?.user) {
        const cloudProf = await fetchCloudProfile(data.user.id);
        const cloudActs = await fetchCloudActivities(data.user.id);

        if (cloudProf) {
          setProfile(cloudProf);
          localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(cloudProf));
        }
        if (cloudActs && cloudActs.length > 0) {
          setActivities(cloudActs);
          localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(cloudActs));
        }
      }
    };
    checkCloud();
  }, []);

  // Save changes to localStorage and Cloud if connected
  const handleCompleteOnboarding = async (newProfile: UserProfile, importedActs: RideActivity[]) => {
    setProfile(newProfile);
    setActivities(importedActs);
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
    localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(importedActs));

    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getUser();
      if (data?.user) {
        await saveCloudProfile(data.user.id, newProfile);
        await saveCloudActivities(data.user.id, importedActs);
      }
    }
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));

    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getUser();
      if (data?.user) {
        await saveCloudProfile(data.user.id, updated);
      }
    }
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem(STORAGE_PROFILE_KEY);
    setProfile(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {!profile || !profile.onboardingCompleted ? (
        <Onboarding onComplete={handleCompleteOnboarding} />
      ) : (
        <Dashboard
          profile={profile}
          activities={activities}
          onUpdateProfile={handleUpdateProfile}
          onResetOnboarding={handleResetOnboarding}
        />
      )}
    </div>
  );
};

export default App;
