import React, { useState, useEffect } from 'react';
import { UserProfile, RideActivity } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { SAMPLE_CYCLING_ACTIVITIES } from './data/defaultActivities';

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

  // Save changes to localStorage
  const handleCompleteOnboarding = (newProfile: UserProfile, importedActs: RideActivity[]) => {
    setProfile(newProfile);
    setActivities(importedActs);
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
    localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(importedActs));
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
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
