export interface ParsedCalendarEvent {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  startHour: string; // HH:mm
  endHour: string; // HH:mm
  dayOfWeek: number; // 0 = Lundi, 6 = Dimanche
}

/**
 * Analyseur de fichier .ics (iCalendar Apple / Google / Outlook)
 * Gère automatiquement le décalage horaire UTC vs Heure Française (UTC+2 été / UTC+1 hiver)
 */
export function parseICS(icsContent: string): ParsedCalendarEvent[] {
  const events: ParsedCalendarEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);

  let inEvent = false;
  let summary = '';
  let dtstart = '';
  let dtend = '';
  let uid = '';

  const parseIcsDate = (val: string): { dateStr: string; timeStr: string; dayOfWeek: number } | null => {
    // Exemples courants:
    // DTSTART:20261020T063000Z (UTC)
    // DTSTART;TZID=Europe/Paris:20261020T083000 (Local)
    // DTSTART:20261020
    const isUtc = val.trim().endsWith('Z');
    const clean = val.includes(':') ? val.split(':').pop()!.trim() : val.trim();
    if (clean.length < 8) return null;

    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1; // 0-indexé
    const day = parseInt(clean.substring(6, 8), 10);

    let hour = 9;
    let min = 0;
    let sec = 0;

    if (clean.includes('T')) {
      const timePart = clean.split('T')[1].replace('Z', '');
      hour = parseInt(timePart.substring(0, 2), 10) || 0;
      min = parseInt(timePart.substring(2, 4), 10) || 0;
      sec = parseInt(timePart.substring(4, 6), 10) || 0;
    }

    let dateObj: Date;
    if (isUtc) {
      // Conversion automatique UTC -> Heure locale de l'appareil (ex: UTC+2 en France)
      dateObj = new Date(Date.UTC(year, month, day, hour, min, sec));
    } else {
      dateObj = new Date(year, month, day, hour, min, sec);
    }

    const localYear = dateObj.getFullYear();
    const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const localDay = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${localYear}-${localMonth}-${localDay}`;

    const localHour = String(dateObj.getHours()).padStart(2, '0');
    const localMin = String(dateObj.getMinutes()).padStart(2, '0');
    const timeStr = `${localHour}:${localMin}`;

    const rawDay = dateObj.getDay();
    const dayOfWeek = rawDay === 0 ? 6 : rawDay - 1;

    return { dateStr, timeStr, dayOfWeek };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      summary = 'Événement';
      dtstart = '';
      dtend = '';
      uid = `evt-${Math.random().toString(36).substring(2, 9)}`;
    } else if (line === 'END:VEVENT') {
      if (inEvent && dtstart) {
        const startParsed = parseIcsDate(dtstart);
        const endParsed = dtend ? parseIcsDate(dtend) : null;

        if (startParsed) {
          events.push({
            id: uid,
            title: summary || 'Rendez-vous',
            dateStr: startParsed.dateStr,
            startHour: startParsed.timeStr,
            endHour: endParsed ? endParsed.timeStr : '10:00',
            dayOfWeek: startParsed.dayOfWeek
          });
        }
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('SUMMARY')) {
        const parts = line.split(':');
        parts.shift();
        summary = parts.join(':').replace(/\\,/g, ',').replace(/\\;/g, ';');
      } else if (line.startsWith('DTSTART')) {
        dtstart = line;
      } else if (line.startsWith('DTEND')) {
        dtend = line;
      } else if (line.startsWith('UID:')) {
        uid = line.substring(4);
      }
    }
  }

  return events;
}
