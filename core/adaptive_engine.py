#!/usr/bin/env python3
"""
Adaptive Training Engine for Lille - Hardelot
Evaluates completed rides strictly based on DISTANCE (km) and D+ (m).
Structures each week into exactly 3 rides:
1. Mid-week Ride 1 (max 55km)
2. Mid-week Ride 2 (max 55km)
3. Weekend Ride 3 (No limit, high D+ build up)
Automatically adjusts future workouts if targets are missed or exceeded.
"""

import datetime
import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config.json")


def evaluate_and_adapt_plan(master_plan, strava_activities):
    today = datetime.date.today()

    # Filter cycling activities only
    cycling_types = {"Ride", "VirtualRide", "EBikeRide", "GravelRide", "MountainBikeRide"}
    rides = []
    for a in strava_activities:
        if a.get("type") in cycling_types:
            dt_str = a.get("start_date_local", "")[:10]
            try:
                ride_date = datetime.datetime.strptime(dt_str, "%Y-%m-%d").date()
            except Exception:
                continue
            rides.append({
                "id": a.get("id"),
                "name": a.get("name", "Sortie vélo"),
                "date": str(ride_date),
                "distance_km": round(a.get("distance", 0) / 1000.0, 1),
                "elevation_m": round(a.get("total_elevation_gain", 0)),
                "moving_time_min": round(a.get("moving_time", 0) / 60),
                "speed_kmh": round(a.get("average_speed", 0) * 3.6, 1)
            })

    # Sort rides chronologically
    rides = sorted(rides, key=lambda x: x["date"])

    cumulative_deficit_km = 0.0
    cumulative_excess_km = 0.0

    current_week_idx = 0
    next_planned_workout = None
    coach_alerts = []

    for idx, week in enumerate(master_plan):
        w_start = datetime.datetime.strptime(week["start_date"], "%Y-%m-%d").date()
        w_end = datetime.datetime.strptime(week["end_date"], "%Y-%m-%d").date()

        # Find rides that occurred in this week
        week_rides = [r for r in rides if w_start <= datetime.datetime.strptime(r["date"], "%Y-%m-%d").date() <= w_end]

        tot_km = round(sum(r["distance_km"] for r in week_rides), 1)
        tot_dplus = sum(r["elevation_m"] for r in week_rides)

        week["realized"]["total_km"] = tot_km
        week["realized"]["total_dplus"] = tot_dplus
        week["realized"]["rides_count"] = len(week_rides)
        week["realized"]["rides"] = week_rides

        target_km = week["target"]["total_km"]
        target_dplus = week["target"]["total_dplus"]

        # Tag each of the 3 rides with completion status
        target_rides = week["target"]["rides"]
        for r_idx, tr in enumerate(target_rides):
            if r_idx < len(week_rides):
                tr["status"] = "completed"
                tr["done_info"] = {
                    "distance_km": week_rides[r_idx]["distance_km"],
                    "elevation_m": week_rides[r_idx]["elevation_m"],
                    "date": week_rides[r_idx]["date"]
                }
            elif w_end < today:
                tr["status"] = "missed"
                tr["done_info"] = None
            else:
                tr["status"] = "pending"
                tr["done_info"] = None

        # Past week evaluation
        if w_end < today:
            if len(week_rides) == 0:
                week["realized"]["status"] = "missed"
                deficit = target_km
                cumulative_deficit_km += deficit
                coach_alerts.append({
                    "week": week["week_number"],
                    "type": "missed",
                    "msg": f"Semaine {week['week_number']} manquée (0 km sur {target_km} km prévus)."
                })
            elif tot_km < 0.70 * target_km:
                week["realized"]["status"] = "under"
                deficit = target_km - tot_km
                cumulative_deficit_km += deficit
                coach_alerts.append({
                    "week": week["week_number"],
                    "type": "under",
                    "msg": f"Semaine {week['week_number']} incomplète ({tot_km} km réalisés vs {target_km} km ciblés, déficit -{round(deficit, 1)} km)."
                })
            elif tot_km > 1.35 * target_km:
                week["realized"]["status"] = "over"
                excess = tot_km - target_km
                cumulative_excess_km += excess
                coach_alerts.append({
                    "week": week["week_number"],
                    "type": "over",
                    "msg": f"Semaine {week['week_number']} en sur-volume (+{round(excess, 1)} km)."
                })
            else:
                week["realized"]["status"] = "validated"

        elif w_start <= today <= w_end:
            # Current week
            current_week_idx = idx
            week["realized"]["status"] = "current"

            # Apply adaptations to weekend ride if previous deficit or excess
            if cumulative_deficit_km > 25:
                boost_km = min(round(cumulative_deficit_km * 0.2, 1), 15.0)
                target_rides[2]["distance_km"] += boost_km
                week["adjustment"]["active"] = True
                week["adjustment"]["adjusted_target_km"] = target_km + boost_km
                week["adjustment"]["reason"] = f"Compense le déficit passé (+{boost_km} km sur la sortie week-end)."
                cumulative_deficit_km -= boost_km
            elif cumulative_excess_km > 30:
                cut_km = min(round(cumulative_excess_km * 0.25, 1), 20.0)
                target_rides[2]["distance_km"] = max(target_rides[2]["distance_km"] - cut_km, 45.0)
                week["adjustment"]["active"] = True
                week["adjustment"]["adjusted_target_km"] = max(target_km - cut_km, 50.0)
                week["adjustment"]["reason"] = f"Allègement préventif (-{cut_km} km week-end) suite à la surcharge récente."
                cumulative_excess_km -= cut_km

            # Determine next ride to do
            rides_done_count = len(week_rides)
            if rides_done_count < 3:
                next_planned_workout = target_rides[rides_done_count]
                next_planned_workout["context"] = f"Sortie {rides_done_count + 1}/3 de la semaine"
            else:
                next_planned_workout = {
                    "name": "Semaine Complétée !",
                    "distance_km": 0,
                    "elevation_m": 0,
                    "role": "Les 3 sorties de la semaine sont bouclées. Repos bien mérité avant la semaine prochaine !",
                    "context": "Objectif atteint"
                }

        else:
            # Future week
            week["realized"]["status"] = "future"
            if not next_planned_workout and idx == current_week_idx + 1:
                next_planned_workout = target_rides[0]
                next_planned_workout["context"] = "Sortie 1/3 de la semaine"

    # Compute overall progress towards Lille-Hardelot
    target_race_km = 160.0
    target_race_dplus = 1450

    all_distances = [r["distance_km"] for r in rides]
    max_ride_km = max(all_distances) if all_distances else 0.0

    all_elevations = [r["elevation_m"] for r in rides]
    max_ride_elev = max(all_elevations) if all_elevations else 0

    progress_distance_pct = min(round((max_ride_km / target_race_km) * 100.0, 1), 100.0)
    progress_elev_pct = min(round((max_ride_elev / target_race_dplus) * 100.0, 1), 100.0)

    race_date = datetime.date(2027, 5, 30)
    days_remaining = (race_date - today).days

    current_week_data = master_plan[current_week_idx] if current_week_idx < len(master_plan) else master_plan[0]
    # Build sequential list of upcoming rides (one by one)
    upcoming_sequence = []
    step_num = 1

    # 1. Uncompleted rides from current week
    current_rides = current_week_data["target"]["rides"]
    for r in current_rides:
        if r.get("status") != "completed":
            is_immediate = (step_num == 1)
            timing = "Ce week-end (Samedi / Dimanche)" if "Week-end" in r["name"] or "Samedi" in r["name"] else "Cette semaine (Jeudi / Vendredi)"
            upcoming_sequence.append({
                "step": step_num,
                "week_number": current_week_data["week_number"],
                "week_theme": current_week_data["theme"],
                "name": r["name"],
                "distance_km": r["distance_km"],
                "elevation_m": r["elevation_m"],
                "type": r["type"],
                "timing": timing,
                "role": r["role"],
                "is_immediate": is_immediate
            })
            step_num += 1

    # 2. Add rides from the next 4 weeks
    for w in master_plan[current_week_idx + 1 : current_week_idx + 5]:
        for r_idx, r in enumerate(w["target"]["rides"]):
            if r_idx == 0:
                timing = f"Semaine {w['week_number']} (Mardi / Mercredi)"
            elif r_idx == 1:
                timing = f"Semaine {w['week_number']} (Jeudi / Vendredi)"
            else:
                timing = f"Semaine {w['week_number']} (Week-end)"

            upcoming_sequence.append({
                "step": step_num,
                "week_number": w["week_number"],
                "week_theme": w["theme"],
                "name": r["name"],
                "distance_km": r["distance_km"],
                "elevation_m": r["elevation_m"],
                "type": r["type"],
                "timing": timing,
                "role": r["role"],
                "is_immediate": False
            })
            step_num += 1

    next_dist = next_planned_workout.get("distance_km", 40) if next_planned_workout else 40
    next_elev = next_planned_workout.get("elevation_m", 120) if next_planned_workout else 120

    coach_advice = {
        "days_to_race": days_remaining,
        "current_week_number": current_week_data["week_number"],
        "current_week_theme": current_week_data["theme"],
        "current_week_rides_plan": current_week_data["target"]["rides"],
        "current_week_realized_rides": current_week_data["realized"]["rides"],
        "upcoming_rides_sequence": upcoming_sequence,
        "max_distance_achieved_km": max_ride_km,
        "max_elevation_achieved_m": max_ride_elev,
        "progress_distance_pct": progress_distance_pct,
        "progress_elev_pct": progress_elev_pct,
        "next_workout": {
            "title": next_planned_workout.get("name", "Prochaine Sortie"),
            "distance_km": next_dist,
            "elevation_m": next_elev,
            "role": next_planned_workout.get("role", "Endurance"),
            "context": next_planned_workout.get("context", "À réaliser maintenant"),
            "briefing": f"Séance immédiate : {next_dist} km et {next_elev}m D+. Pédalez au ressenti sans regarder la fréquence cardiaque. Emportez 1 bidon et 1 barre."
        },
        "recent_alerts": coach_alerts[-3:] if coach_alerts else []
    }

    return master_plan, coach_advice
