#!/usr/bin/env python3
"""
Adaptive Training Engine for Lille - Hardelot
Evaluates completed rides strictly based on DISTANCE (km) and D+ (m).
Automatically adjusts future workouts if targets are missed or exceeded.
Generates dynamic coach debriefing and next workout directives.
"""

import datetime
import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config.json")


def evaluate_and_adapt_plan(master_plan, strava_activities):
    """
    master_plan: list of week dicts
    strava_activities: list of dicts (from Strava API or local cache)
    """
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

    # Map rides to weeks in master_plan
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

        # Is this a past week, current week, or future week?
        if w_end < today:
            # Past week : Evaluate compliance
            if len(week_rides) == 0:
                week["realized"]["status"] = "missed"
                deficit = target_km
                cumulative_deficit_km += deficit
                coach_alerts.append({
                    "week": week["week_number"],
                    "type": "missed",
                    "msg": f"Semaine {week['week_number']} manquée (0 km sur {target_km} km prévus). Répercussion sur la progression."
                })
            elif tot_km < 0.70 * target_km:
                week["realized"]["status"] = "under"
                deficit = target_km - tot_km
                cumulative_deficit_km += deficit
                coach_alerts.append({
                    "week": week["week_number"],
                    "type": "under",
                    "msg": f"Semaine {week['week_number']} sous-dosée ({tot_km} km réalisés vs {target_km} km ciblés, déficit de -{round(deficit, 1)} km)."
                })
            elif tot_km > 1.35 * target_km:
                week["realized"]["status"] = "over"
                excess = tot_km - target_km
                cumulative_excess_km += excess
                coach_alerts.append({
                    "week": week["week_number"],
                    "type": "over",
                    "msg": f"Semaine {week['week_number']} en sur-volume ({tot_km} km vs {target_km} km prévus, +{round(excess, 1)} km)."
                })
            else:
                week["realized"]["status"] = "validated"

        elif w_start <= today <= w_end:
            # Current week
            current_week_idx = idx
            week["realized"]["status"] = "current"

            # Apply adaptations to current week based on previous cumulative deficit or excess
            if cumulative_deficit_km > 25:
                # Add moderate compensation to current week long ride (+10% max)
                boost_km = min(round(cumulative_deficit_km * 0.25, 1), 15.0)
                week["adjustment"]["active"] = True
                week["adjustment"]["adjusted_target_km"] = target_km + boost_km
                week["adjustment"]["reason"] = f"Compense le déficit passé (+{boost_km} km progressifs)."
                cumulative_deficit_km -= boost_km
            elif cumulative_excess_km > 30:
                # Lighten current week to prevent fatigue
                cut_km = min(round(cumulative_excess_km * 0.3, 1), 20.0)
                week["adjustment"]["active"] = True
                week["adjustment"]["adjusted_target_km"] = max(target_km - cut_km, 40.0)
                week["adjustment"]["reason"] = f"Allègement de récupération (-{cut_km} km) suite à la surcharge récente."
                cumulative_excess_km -= cut_km

            # Determine next ride for current week
            if len(week_rides) == 0:
                next_planned_workout = week["target"]["mid_week_ride"] or week["target"]["long_ride"]
                next_planned_workout["context"] = "Première sortie de la semaine"
            elif len(week_rides) == 1:
                next_planned_workout = week["target"]["long_ride"]
                next_planned_workout["context"] = "Sortie clé du week-end"
            else:
                next_planned_workout = {
                    "distance_km": 40,
                    "elevation_m": 150,
                    "label": "Sortie bonus / Récupération active",
                    "context": "Volume de la semaine déjà bien engagé !"
                }

        else:
            # Future week
            week["realized"]["status"] = "future"
            if not next_planned_workout and idx == current_week_idx + 1:
                next_planned_workout = week["target"]["mid_week_ride"] or week["target"]["long_ride"]

    # Compute overall progress towards Lille-Hardelot
    target_race_km = 160.0
    target_race_dplus = 1450

    # Max single ride distance achieved so far
    all_distances = [r["distance_km"] for r in rides]
    max_ride_km = max(all_distances) if all_distances else 0.0

    all_elevations = [r["elevation_m"] for r in rides]
    max_ride_elev = max(all_elevations) if all_elevations else 0

    progress_distance_pct = min(round((max_ride_km / target_race_km) * 100.0, 1), 100.0)
    progress_elev_pct = min(round((max_ride_elev / target_race_dplus) * 100.0, 1), 100.0)

    # Days remaining until race
    race_date = datetime.date(2027, 5, 30)
    days_remaining = (race_date - today).days

    # Formulate Coach Next Advice
    current_week_data = master_plan[current_week_idx] if current_week_idx < len(master_plan) else master_plan[0]
    next_dist = next_planned_workout["distance_km"] if next_planned_workout else 55
    next_elev = next_planned_workout["elevation_m"] if next_planned_workout else 250

    coach_advice = {
        "days_to_race": days_remaining,
        "current_week_number": current_week_data["week_number"],
        "current_week_theme": current_week_data["theme"],
        "max_distance_achieved_km": max_ride_km,
        "max_elevation_achieved_m": max_ride_elev,
        "progress_distance_pct": progress_distance_pct,
        "progress_elev_pct": progress_elev_pct,
        "next_workout": {
            "title": next_planned_workout.get("label", "Prochaine Sortie"),
            "distance_km": next_dist,
            "elevation_m": next_elev,
            "context": next_planned_workout.get("context", "À réaliser d'ici dimanche"),
            "briefing": f"Objectif simple et sans cardio : couvrir {next_dist} km avec environ {next_elev} m de D+. Gérez votre allure au ressenti, braquet souple dans les montées. Emportez 1 bidon et 1 barre par heure d'effort."
        },
        "recent_alerts": coach_alerts[-3:] if coach_alerts else []
    }

    return master_plan, coach_advice
