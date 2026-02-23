interface CalendarGame {
  day?: string;
  time?: string;
  opponent?: string;
  sheet?: string;
}

interface CalendarTrip {
  teamName: string;
  rink: { name: string; city: string; state: string };
  games?: CalendarGame[];
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toICSDate(dateStr: string, timeStr: string): string | null {
  try {
    const d = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(d.getTime())) return null;
    return (
      d.getFullYear().toString() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      '00'
    );
  } catch {
    return null;
  }
}

function addMinutes(icsDate: string, minutes: number): string {
  const y = parseInt(icsDate.slice(0, 4));
  const mo = parseInt(icsDate.slice(4, 6)) - 1;
  const da = parseInt(icsDate.slice(6, 8));
  const h = parseInt(icsDate.slice(9, 11));
  const mi = parseInt(icsDate.slice(11, 13));
  const d = new Date(y, mo, da, h, mi);
  d.setMinutes(d.getMinutes() + minutes);
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    '00'
  );
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateICS(trip: CalendarTrip): string {
  const events: string[] = [];

  for (const game of trip.games || []) {
    if (!game.day || !game.time) continue;
    const start = toICSDate(game.day, game.time);
    if (!start) continue;
    const end = addMinutes(start, 90);
    const location = `${trip.rink.name}, ${trip.rink.city}, ${trip.rink.state}`;
    const summary = game.opponent
      ? `${trip.teamName} vs ${game.opponent}`
      : `${trip.teamName} game`;
    const descParts = [];
    if (game.sheet) descParts.push(`Sheet: ${game.sheet}`);
    descParts.push('ColdStart Hockey — coldstarthockey.com');
    const description = descParts.join('\\n');

    events.push(
      [
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeICS(summary)}`,
        `LOCATION:${escapeICS(location)}`,
        `DESCRIPTION:${escapeICS(description)}`,
        `UID:${start}-${Math.random().toString(36).slice(2, 8)}@coldstarthockey.com`,
        'END:VEVENT',
      ].join('\r\n')
    );
  }

  if (events.length === 0) return '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ColdStart Hockey//Game Schedule//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
