// Vercel functions run in UTC. Comparing event_date (a Chicago-local
// calendar date) against a UTC "today" hides same-day events for roughly
// half the day, any time after 7pm Central rolls the UTC date over before
// the Chicago date does. Always derive "today" from the venue's timezone.
export function chicagoTodayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
}

// 24-hour "HH:MM:SS" current time in Chicago, comparable lexicographically
// against a Postgres time column (e.g. an event's cutoff_time).
export function chicagoTimeStr(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())
}
