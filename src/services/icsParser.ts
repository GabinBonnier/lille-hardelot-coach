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
    // Format attendu: 20261020T143000Z ou 20261020T143000 ou TZID=...:20261020T143000
    const clean = val.includes(':') ? val.split(':').pop()! : val;
    if (clean.length < 8) return null;

    const year = clean.substring(0, 4);
    const month = clean.substring(4, 6);
    const day = clean.substring(6, 8);
    const dateStr = `${year}-${month}-${day}`;

    let timeStr = '09:00';
    if (clean.includes('T')) {
      const timePart = clean.split('T')[1];
      const hour = timePart.substring(0, 2);
      const min = timePart.substring(2, 4);
      timeStr = `${hour}:${min}`;
    }

    const d = new Date(`${dateStr}T${timeStr}:00`);
    // getDay() renvoie 0 pour Dimanche, on convertit en 0 = Lundi ... 6 = Dimanche
    const rawDay = d.getDay();
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
      if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8).replace(/\\,/g, ',').replace(/\\;/g, ';');
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
