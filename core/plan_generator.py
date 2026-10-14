#!/usr/bin/env python3
"""
Plan Generator for Lille - Hardelot (160 km, 1450m D+)
Structured around 3 rides per week:
- Ride 1 (Mid-week): 30 to 45 km, max 55 km (Pace & Cadence)
- Ride 2 (Mid-week): 35 to 50 km, max 55 km (Endurance & Rollers)
- Ride 3 (Weekend): NO LIMIT (Long ride building up to 145 km and 1300m D+)
"""

import datetime
import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config.json")


def generate_lille_hardelot_plan():
    start_date = datetime.date(2026, 10, 12)  # Monday S42
    race_date = datetime.date(2027, 5, 30)    # Race Sunday (Lille-Hardelot)

    # 33 weeks total
    weeks = []

    # Format: (week_idx, r1_km, r1_dplus, r2_km, r2_dplus, r3_weekend_km, r3_weekend_dplus, is_deload, theme)
    # Notice: r1 and r2 are ALWAYS <= 55 km. r3 has NO LIMIT.
    milestones = [
        # Bloc 1 : Automne (Octobre - Novembre 2026) - Base & Régularité
        (1, 35, 100, 40, 120, 55, 200, False, "Reprise & Régularité 3 sorties"),
        (2, 38, 110, 42, 130, 60, 250, False, "Montée en distance 60 km le W-E"),
        (3, 40, 120, 45, 150, 65, 300, False, "Cap des 65 km le W-E"),
        (4, 30, 80, 35, 100, 50, 200, True, "Semaine d'assimilation (Deload)"),

        # Bloc 2 : Novembre 2026 - Vers les 80 km le week-end
        (5, 42, 130, 45, 150, 70, 350, False, "Entrée sur les 70 km le W-E"),
        (6, 45, 150, 48, 160, 75, 400, False, "Dénivelé progressif (400m D+)"),
        (7, 45, 150, 50, 180, 80, 450, False, "Cap des 80 km le W-E"),
        (8, 35, 100, 38, 110, 60, 250, True, "Semaine de décharge active"),

        # Bloc 3 : Décembre 2026 - Maintien du rythme
        (9, 45, 140, 50, 170, 80, 450, False, "Maintien du rythme hivernal"),
        (10, 45, 150, 50, 180, 85, 500, False, "Monts & faux-plats (500m D+)"),
        (11, 48, 160, 52, 190, 90, 550, False, "Cap des 90 km le W-E"),
        (12, 35, 100, 40, 120, 65, 300, True, "Trêve des fêtes (Régénération)"),

        # Bloc 4 : Janvier 2027 - Vers les 100 km
        (13, 45, 150, 50, 180, 85, 450, False, "Reprise post-fêtes"),
        (14, 48, 160, 52, 190, 90, 550, False, "Stabilisation 90 km W-E"),
        (15, 50, 170, 55, 200, 95, 600, False, "Approche des 100 km le W-E"),
        (16, 38, 120, 42, 140, 70, 350, True, "Assimilation hivernale"),

        # Bloc 5 : Février 2027 - Le cap mythique des 100 km W-E
        (17, 50, 170, 55, 200, 100, 650, False, "Le cap mythique : 100 km le W-E !"),
        (18, 50, 180, 55, 210, 105, 700, False, "Endurance 105 km & 700m D+"),
        (19, 52, 190, 55, 220, 110, 800, False, "Chantier dénivelé 800m D+"),
        (20, 40, 120, 45, 140, 75, 400, True, "Récupération & recharge"),

        # Bloc 6 : Mars 2027 - Rythme de printemps
        (21, 50, 180, 55, 210, 110, 800, False, "Rythme de printemps"),
        (22, 52, 190, 55, 220, 115, 850, False, "Sortie longue 115 km"),
        (23, 55, 200, 55, 230, 120, 950, False, "Cap des 120 km (Cassel / Flandres)"),
        (24, 40, 120, 45, 150, 80, 450, True, "Assimilation pré-avril"),

        # Bloc 7 : Avril 2027 - Gros bloc spécifique
        (25, 52, 190, 55, 220, 125, 1000, False, "Spécifique D+ : 1000m W-E franchis"),
        (26, 55, 200, 55, 230, 130, 1100, False, "La barre des 130 km le W-E"),
        (27, 55, 210, 55, 240, 138, 1200, False, "Grosse répétition 138 km W-E"),
        (28, 42, 140, 45, 150, 90, 500, True, "Décharge avant dernière ligne droite"),

        # Bloc 8 : Mai 2027 - Répétition générale & Affûtage
        (29, 52, 190, 55, 220, 145, 1300, False, "Répétition Générale Lille-Hardelot (145 km)"),
        (30, 50, 170, 50, 180, 120, 900, False, "Dernière grosse sortie longue"),
        (31, 40, 130, 45, 140, 80, 500, True, "Affûtage (Baisse de volume -35%)"),
        (32, 35, 100, 35, 100, 50, 250, True, "Semaine de course (Jus & Fraîcheur)"),
        (33, 0, 0, 0, 0, 160, 1450, False, "JOUR J : LILLE - HARDELOT (160 km / 1450m D+)")
    ]

    curr_monday = start_date
    for item in milestones:
        w_idx, r1_k, r1_d, r2_k, r2_d, r3_k, r3_d, is_deload, theme = item
        w_sunday = curr_monday + datetime.timedelta(days=6)
        total_km = r1_k + r2_k + r3_k
        total_dplus = r1_d + r2_d + r3_d

        weeks.append({
            "week_number": w_idx,
            "iso_week": curr_monday.isocalendar().week,
            "year": curr_monday.year,
            "start_date": str(curr_monday),
            "end_date": str(w_sunday),
            "theme": theme,
            "is_deload": is_deload,
            "target": {
                "total_km": total_km,
                "total_dplus": total_dplus,
                "rides": [
                    {
                        "id": 1,
                        "name": "Sortie 1 (Mardi / Mercredi)",
                        "type": "Semaine (max 55km)",
                        "distance_km": r1_k,
                        "elevation_m": r1_d,
                        "role": "Rythme & Cadence (jambes souples)"
                    },
                    {
                        "id": 2,
                        "name": "Sortie 2 (Jeudi / Vendredi)",
                        "type": "Semaine (max 55km)",
                        "distance_km": r2_k,
                        "elevation_m": r2_d,
                        "role": "Endurance & Faux-plats"
                    },
                    {
                        "id": 3,
                        "name": "Sortie 3 (Samedi / Dimanche)",
                        "type": "Week-end (Sans limite)",
                        "distance_km": r3_k,
                        "elevation_m": r3_d,
                        "role": "Sortie Clé Lille-Hardelot (Volume & D+)"
                    }
                ]
            },
            "realized": {
                "total_km": 0.0,
                "total_dplus": 0,
                "rides_count": 0,
                "status": "pending",
                "rides": []
            },
            "adjustment": {
                "active": False,
                "original_target_km": total_km,
                "adjusted_target_km": total_km,
                "reason": None
            }
        })
        curr_monday += datetime.timedelta(days=7)

    return weeks


if __name__ == "__main__":
    plan = generate_lille_hardelot_plan()
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "master_plan.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=2)
    print(f"Master plan for Lille-Hardelot successfully updated with 3 rides/week structure to {out_file}")
