#!/usr/bin/env python3
"""
Strava Sync & Autonomous Plan Updater for Lille - Hardelot
Runs locally or inside GitHub Actions.
Safely extracts distance and D+ from Strava and updates public dashboard data.
Zero private GPS coordinates or sensitive tokens are stored in the output JSON.
"""

import os
import sys
import json
import time
import datetime
import urllib.request
import urllib.parse

from plan_generator import generate_lille_hardelot_plan
from adaptive_engine import evaluate_and_adapt_plan

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "dashboard_data.json")
LOCAL_CONFIG = os.path.join(os.path.dirname(BASE_DIR), "strava_config.json")


def get_strava_credentials():
    """
    Looks in GitHub Actions environment variables first, then local fallback config file.
    """
    client_id = os.environ.get("STRAVA_CLIENT_ID")
    client_secret = os.environ.get("STRAVA_CLIENT_SECRET")
    refresh_token = os.environ.get("STRAVA_REFRESH_TOKEN")

    if client_id and client_secret and refresh_token:
        print("[INFO] Using Strava credentials from environment variables (GitHub Secrets).")
        return client_id, client_secret, refresh_token

    if os.path.exists(LOCAL_CONFIG):
        print(f"[INFO] Using Strava credentials from local config: {LOCAL_CONFIG}")
        with open(LOCAL_CONFIG, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            return cfg.get("client_id"), cfg.get("client_secret"), cfg.get("refresh_token")

    raise ValueError("No Strava credentials found (neither in environment nor local config).")


def get_access_token(client_id, client_secret, refresh_token):
    print("[INFO] Refreshing Strava access token...")
    url = "https://www.strava.com/oauth/token"
    payload = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print("[OK] Token successfully refreshed.")
        return data["access_token"]


def fetch_activities(token, after_date="2026-07-01"):
    after_timestamp = int(datetime.datetime.strptime(after_date, "%Y-%m-%d").timestamp())
    activities = []
    page = 1
    per_page = 50

    print(f"[INFO] Fetching activities since {after_date}...")
    while True:
        url = f"https://www.strava.com/api/v3/athlete/activities?after={after_timestamp}&page={page}&per_page={per_page}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not data:
                    break
                activities.extend(data)
                if len(data) < per_page:
                    break
                page += 1
                time.sleep(0.5)
        except Exception as e:
            print(f"[ERROR] Could not fetch page {page}: {e}")
            break

    print(f"[OK] Fetched {len(activities)} total activities.")
    return activities


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # 1. Load or Generate Master Plan
    master_plan_file = os.path.join(DATA_DIR, "master_plan.json")
    if os.path.exists(master_plan_file):
        with open(master_plan_file, "r", encoding="utf-8") as f:
            master_plan = json.load(f)
    else:
        master_plan = generate_lille_hardelot_plan()

    # 2. Get activities from Strava or local cached raw_activities
    activities = []
    try:
        client_id, client_secret, refresh_token = get_strava_credentials()
        token = get_access_token(client_id, client_secret, refresh_token)
        activities = fetch_activities(token, after_date="2026-08-01")
    except Exception as e:
        print(f"[WARN] Strava API fetch failed: {e}")
        # Try local fallback cached activities
        local_raw = os.path.join(os.path.dirname(BASE_DIR), "data", "raw_activities.json")
        if os.path.exists(local_raw):
            print(f"[INFO] Falling back to local cached activities: {local_raw}")
            with open(local_raw, "r", encoding="utf-8") as f:
                activities = json.load(f)
        else:
            print("[WARN] No activities available. Plan will be evaluated without activities.")

    # 3. Run Adaptive Engine
    updated_plan, coach_advice = evaluate_and_adapt_plan(master_plan, activities)

    # 4. Extract safe recent rides (only public performance metrics)
    cycling_types = {"Ride", "VirtualRide", "EBikeRide", "GravelRide", "MountainBikeRide"}
    recent_rides = []
    for a in sorted(activities, key=lambda x: x.get("start_date_local", ""), reverse=True):
        if a.get("type") in cycling_types:
            recent_rides.append({
                "date": a.get("start_date_local", "")[:10],
                "name": a.get("name", "Sortie vélo"),
                "distance_km": round(a.get("distance", 0) / 1000.0, 1),
                "elevation_m": round(a.get("total_elevation_gain", 0)),
                "moving_time_min": round(a.get("moving_time", 0) / 60),
                "speed_kmh": round(a.get("average_speed", 0) * 3.6, 1)
            })
            if len(recent_rides) >= 12:
                break

    # 5. Assemble public dashboard payload
    payload = {
        "race": {
            "name": "Lille - Hardelot",
            "date": "2027-05-30",
            "target_distance_km": 160,
            "target_elevation_m": 1450,
            "profile_description": "160 km à travers les Flandres, le pays de Lumbres et le Haut Boulonnais jusqu'à la mer."
        },
        "athlete": {
            "name": "Gabin",
            "bike": "Trek"
        },
        "coach_advice": coach_advice,
        "recent_rides": recent_rides,
        "weeks": updated_plan,
        "last_sync": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"\n[SUCCESS] Public dashboard data successfully generated at {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
