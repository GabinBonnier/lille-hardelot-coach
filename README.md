# 🚴 Lille - Hardelot 2027 · Planificateur & Coach Cycliste Autonome

Application 100% autonome d'entraînement cycliste pour préparer **Lille - Hardelot (30 Mai 2027 · 160 km · 1 450 m D+)**.

Programmation basée **exclusivement sur la Distance (km) et le Dénivelé (m D+)** — sans aucune contrainte de cardio/fréquence cardiaque.

---

## ⚡ Fonctionnement Autonome & Auto-Régulation

1. **Synchronisation automatique Strava** : Toutes les 12 heures (via GitHub Actions) ou à la demande en 1 clic.
2. **Vérification de la sortie** : Le moteur compare la distance et le D+ réels par rapport à l'objectif de la semaine.
3. **Rétroaction dynamique (Auto-correctifs)** :
   - **En cas de séance incomplète ou sautée** : le plan rééquilibre automatiquement la sortie longue suivante sans créer de pic dangereux.
   - **En cas de sortie trop longue / excès de D+** : le plan allège la sortie suivante de 15% à 25% pour protéger les tendons et muscles.
4. **Debriefing du Coach** : Fournit en permanence les consignes précises (braquet, alimentation, gestion du vent) pour la **toute prochaine sortie**.

---

## 🔒 Sécurité & Confidentialité (Repository Public)

Ce projet est conçu pour être hébergé en **Public sur GitHub** en toute sécurité :
- **Aucun jeton ni mot de passe dans le code** : les identifiants Strava sont stockés dans les **GitHub Secrets** chiffrés.
- **Protection de la vie privée (GPS)** : Aucune trace GPS, coordonnée géographique ou polyline n'est exportée. Seuls les chiffres globaux (distance en km, D+ en m, vitesse moyenne) sont affichés.

---

## 🚀 Mise en Ligne sur GitHub en 3 Étapes

### Étape 1 : Créer le dépôt sur GitHub
1. Créez un nouveau dépôt sur [GitHub](https://github.com/new) nommé `lille-hardelot-coach` (en Public).
2. Poussez ce dossier sur votre dépôt :
```bash
git init
git add .
git commit -m "Initial commit : Lille-Hardelot coach"
git branch -M main
git remote add origin https://github.com/VOTRE_PSEUDO/lille-hardelot-coach.git
git push -u origin main
```

### Étape 2 : Ajouter les Secrets Strava dans GitHub
Sur votre dépôt GitHub, allez dans :  
👉 **Settings** > **Secrets and variables** > **Actions** > Bouton **New repository secret**

Ajoutez ces 3 secrets :
- `STRAVA_CLIENT_ID` : `287437`
- `STRAVA_CLIENT_SECRET` : `be921272da70c41a0533e9f6d2085fc34a4fec24`
- `STRAVA_REFRESH_TOKEN` : `aa2fd4e9a3f3e7723a925699a51071a962fd41d4`

### Étape 3 : Activer GitHub Pages
Sur votre dépôt GitHub, allez dans :  
👉 **Settings** > **Pages**  
- **Source** : `Deploy from a branch`
- **Branch** : `main` / `(root)`
- Cliquez sur **Save**.

Votre site sera immédiatement en ligne à l'adresse :  
`https://VOTRE_PSEUDO.github.io/lille-hardelot-coach/`

---

## 🔄 Forcer une mise à jour manuelle
Dès que vous terminez une sortie vélo :
1. Allez sur l'onglet **Actions** de votre dépôt GitHub.
2. Cliquez sur le workflow **Sync Strava & Update Lille-Hardelot Plan**.
3. Cliquez sur **Run workflow**. En 30 secondes, le site est mis à jour avec vos nouveaux chiffres et correctifs !
