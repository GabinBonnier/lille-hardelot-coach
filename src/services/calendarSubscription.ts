import { parseICS, ParsedCalendarEvent } from './icsParser';

export async function syncCalendarFromUrl(rawUrl: string): Promise<{ events: ParsedCalendarEvent[]; error?: string }> {
  const cleanUrl = rawUrl.trim().replace(/^webcal:\/\//i, 'https://');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return { events: [], error: 'L’adresse doit commencer par https:// ou webcal://' };
  }

  // Tenter plusieurs méthodes pour contourner les blocages CORS éventuels
  const methods = [
    // 1. Notre fonction Serverless Vercel / Vite dev middleware
    `/api/calendar?url=${encodeURIComponent(cleanUrl)}`,
    // 2. Fallback direct vers Vercel si exécuté hors du domaine de prod
    `https://lille-hardelot-coach.vercel.app/api/calendar?url=${encodeURIComponent(cleanUrl)}`,
    // 3. Fetch direct (si l'université autorise CORS)
    cleanUrl
  ];

  for (const endpoint of methods) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'text/calendar, text/plain, */*'
        }
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.includes('BEGIN:VCALENDAR')) {
          localStorage.setItem('cap_hardelot_calendar_sub_url', rawUrl.trim());
          localStorage.setItem('cap_hardelot_raw_ics', text);
          const events = parseICS(text);
          return { events };
        }
      }
    } catch (err) {
      // Tenter le endpoint suivant
    }
  }

  return { events: [], error: 'Impossible de joindre le calendrier à cette adresse. Vérifiez le lien ou vos accès.' };
}
