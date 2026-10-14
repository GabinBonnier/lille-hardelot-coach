#!/usr/bin/env python3
"""
Plan Generator for Lille - Hardelot (160 km, 1450m D+)
Generates a 32-week periodized progression based SOLELY on:
- Distance (km)
- Elevation Gain (D+ in meters)
No heart rate constraints, no complicated zones. Pure cycling volume & climbing progression.
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

    # Progressive volume template:
    # Phase 1 : Automne (Oct - Déc) : Consolidation 55km -> 80km, 250m -> 500m D+
    # Phase 2 : Hiver (Jan - Fév) : Capacité d'endurance 75km -> 100km, 400m -> 750m D+
    # Phase 3 : Printemps (Mars - Avril) : Spécifique Monts des Flandres / Collines 95km -> 130km, 700m -> 1100m D+
    # Phase 4 : Affûtage & Répétition (Mai) : Simulation 145km (1300m D+) puis relâchement avant course

    milestones = [
        # (week_idx, target_long_km, target_long_dplus, mid_week_km, mid_week_dplus, is_deload, theme)
        # S42 (Actuelle)
        (1, 55, 200, 35, 100, False, "Reprise & Régularité"),
        (2, 60, 250, 40, 120, False, "Montée en distance 60 km"),
        (3, 65, 300, 40, 150, False, "Cap des 65 km"),
        (4, 50, 200, 30, 80, True, "Semaine d'assimilation (Deload)"),

        # Bloc 2 : Novembre
        (5, 70, 350, 42, 150, False, "Entrée sur les 70 km"),
        (6, 75, 400, 45, 180, False, "Dénivelé progressif (400m D+)"),
        (7, 80, 450, 45, 200, False, "Cap des 80 km"),
        (8, 60, 250, 35, 100, True, "Semaine de décharge active"),

        # Bloc 3 : Décembre
        (9, 80, 450, 45, 180, False, "Maintien du rythme hivernal"),
        (10, 85, 500, 45, 200, False, "Monts & faux-plats (500m D+)"),
        (11, 90, 550, 48, 220, False, "Cap des 90 km"),
        (12, 65, 300, 35, 120, True, "Trêve des fêtes (Régénération)"),

        # Bloc 4 : Janvier 2027
        (13, 85, 450, 45, 180, False, "Reprise post-fêtes"),
        (14, 90, 550, 48, 220, False, "Stabilisation 90 km"),
        (15, 95, 600, 50, 250, False, "Approche des 100 km"),
        (16, 70, 350, 38, 150, True, "Assimilation hivernale"),

        # Bloc 5 : Février 2027
        (17, 100, 650, 50, 250, False, "Le cap mythique : 100 km !"),
        (18, 105, 700, 52, 280, False, "Endurance 105 km & D+"),
        (19, 110, 800, 55, 300, False, "Chantier dénivelé 800m D+"),
        (20, 75, 400, 40, 150, True, "Récupération & recharge"),

        # Bloc 6 : Mars 2027
        (21, 110, 800, 52, 280, False, "Rythme de printemps"),
        (22, 115, 850, 55, 320, False, "Sortie longue 115 km"),
        (23, 120, 950, 58, 350, False, "Cap des 120 km (Cassel / Flandres)"),
        (24, 80, 450, 40, 180, True, "Assimilation pré-avril"),

        # Bloc 7 : Avril 2027 (Le bloc clé spécifique)
        (25, 125, 1000, 55, 320, False, "Spécifique D+ : 1000m franchis"),
        (26, 130, 1100, 58, 350, False, "La barre des 130 km"),
        (27, 138, 1200, 60, 380, False, "Grosse répétition 138 km"),
        (28, 90, 500, 45, 200, True, "Décharge avant dernière ligne droite"),

        # Bloc 8 : Mai 2027 (Simulation & Affûtage)
        (29, 145, 1300, 55, 300, False, "Répétition Générale Lille-Hardelot (145 km)"),
        (30, 120, 900, 50, 250, False, "Dernière grosse sortie"),
        (31, 80, 500, 40, 180, True, "Affûtage (Baisse de volume -35%)"),
        (32, 50, 250, 30, 100, True, "Semaine de course (Jus & Fraîcheur)"),
        (33, 160, 1450, 0, 0, False, "JOUR J : LILLE - HARDELOT (160 km / 1450m D+)")
    ]

    curr_monday = start_date
    for item in milestones:
        w_idx, l_km, l_dplus, m_km, m_dplus, is_deload, theme = item
        w_sunday = curr_monday + datetime.timedelta(days=6)
        total_km = l_km + m_km
        total_dplus = l_dplus + m_dplus

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
                "long_ride": {
                    "distance_km": l_km,
                    "elevation_m": l_dplus,
                    "label": "Sortie Longue Clé (Week-end)"
                },
                "mid_week_ride": {
                    "distance_km": m_km,
                    "elevation_m": m_dplus,
                    "label": "Sortie Rythme Semaine"
                } if m_km > 0 else None
            },
            # Realized will be filled dynamically by Strava sync
            "realized": {
                "total_km": 0.0,
                "total_dplus": 0,
                "rides_count": 0,
                "status": "pending",  # pending, completed, warning_under, warning_over
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
    print(f"Master plan for Lille-Hardelot successfully generated ({len(plan)} weeks) to {out_file}")
