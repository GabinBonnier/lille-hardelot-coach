import { TrainingLocation } from '../types';

export const POPULAR_LOCATIONS: TrainingLocation[] = [
  { city: 'Lille', postalCode: '59000', lat: 50.6292, lng: 3.0573, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Villeneuve-d’Ascq', postalCode: '59650', lat: 50.6233, lng: 3.1444, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Marcq-en-Barœul', postalCode: '59700', lat: 50.6722, lng: 3.0972, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Roubaix', postalCode: '59100', lat: 50.6927, lng: 3.1778, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Tourcoing', postalCode: '59200', lat: 50.7239, lng: 3.1612, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Seclin', postalCode: '59113', lat: 50.5486, lng: 3.0306, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Armentières', postalCode: '59280', lat: 50.6878, lng: 2.8822, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Béthune', postalCode: '62400', lat: 50.5303, lng: 2.6408, department: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  { city: 'Lens', postalCode: '62300', lat: 50.4322, lng: 2.8333, department: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  { city: 'Arras', postalCode: '62000', lat: 50.2920, lng: 2.7800, department: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  { city: 'Saint-Omer', postalCode: '62500', lat: 50.7500, lng: 2.2500, department: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  { city: 'Bailleul', postalCode: '59270', lat: 50.7408, lng: 2.7347, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Cassel (Mont Cassel)', postalCode: '59670', lat: 50.8000, lng: 2.4861, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Hazebrouck', postalCode: '59190', lat: 50.7242, lng: 2.5386, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Boulogne-sur-Mer', postalCode: '62200', lat: 50.7264, lng: 1.6147, department: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  { city: 'Neufchâtel-Hardelot', postalCode: '62152', lat: 50.6347, lng: 1.6069, department: 'Pas-de-Calais (62)', region: 'Hauts-de-France' },
  { city: 'Dunkerque', postalCode: '59140', lat: 51.0343, lng: 2.3768, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Valenciennes', postalCode: '59300', lat: 50.3580, lng: 3.5233, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Douai', postalCode: '59500', lat: 50.3714, lng: 3.0800, department: 'Nord (59)', region: 'Hauts-de-France' },
  { city: 'Amiens', postalCode: '80000', lat: 49.8941, lng: 2.2957, department: 'Somme (80)', region: 'Hauts-de-France' },
  { city: 'Paris', postalCode: '75001', lat: 48.8566, lng: 2.3522, department: 'Paris (75)', region: 'Île-de-France' },
  { city: 'Lyon', postalCode: '69001', lat: 45.7640, lng: 4.8357, department: 'Rhône (69)', region: 'Auvergne-Rhône-Alpes' },
  { city: 'Marseille', postalCode: '13001', lat: 43.2965, lng: 5.3698, department: 'Bouches-du-Rhône (13)', region: 'PACA' }
];

/**
 * Recherche dynamique connectée à l'API officielle des 35 000 communes de France (geo.api.gouv.fr)
 */
export async function searchFrenchCities(query: string): Promise<TrainingLocation[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) {
    return POPULAR_LOCATIONS;
  }

  try {
    const isZip = /^[0-9]+$/.test(clean);
    const url = isZip
      ? `https://geo.api.gouv.fr/communes?codePostal=${clean}&fields=nom,code,codesPostaux,centre,departement,region&limit=25`
      : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(clean)}&fields=nom,code,codesPostaux,centre,departement,region&boost=population&limit=25`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur API Gouv Communes');

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      // Fallback local search
      return searchLocations(clean);
    }

    const results: TrainingLocation[] = [];
    for (const item of data) {
      const coords = item.centre?.coordinates || [3.0573, 50.6292];
      const lng = coords[0];
      const lat = coords[1];
      const deptCode = item.departement?.code || item.code.substring(0, 2);
      const deptNom = item.departement?.nom || '';
      const deptLabel = deptNom ? `${deptNom} (${deptCode})` : `Dép. ${deptCode}`;
      const regLabel = item.region?.nom || 'France';

      // If commune has multiple zip codes, add a record for each relevant zip
      const postalCodes: string[] = item.codesPostaux && item.codesPostaux.length > 0 ? item.codesPostaux : [item.code];
      
      for (const zip of postalCodes) {
        if (!isZip || zip.startsWith(clean)) {
          results.push({
            city: item.nom,
            postalCode: zip,
            lat,
            lng,
            department: deptLabel,
            region: regLabel
          });
        }
      }
    }

    return results.length > 0 ? results : searchLocations(clean);
  } catch (err) {
    console.warn('Fallback recherche locale communes:', err);
    return searchLocations(clean);
  }
}

export function searchLocations(query: string): TrainingLocation[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return POPULAR_LOCATIONS;
  return POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.postalCode.startsWith(clean) ||
      loc.city.toLowerCase().includes(clean) ||
      loc.department.toLowerCase().includes(clean)
  );
}
