// Vercel functions run in UTC. Comparing event_date (a Chicago-local
// calendar date) against a UTC "today" hides same-day events for roughly
// half the day, any time after 7pm Central rolls the UTC date over before
// the Chicago date does. Always derive "today" from the venue's timezone.
export function chicagoTodayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
}
