import { addDays, format } from 'date-fns'
import type { AccessStatus, Event } from '@/lib/types'
import { chicagoTodayStr, chicagoTimeStr } from '@/lib/date'

const LIMITED_THRESHOLD = 10

// Pure calendar-date arithmetic on an already Chicago-local 'yyyy-MM-dd'
// string -- anchored at noon so it can't land on a DST boundary.
function chicagoDateOffset(dateStr: string, days: number): string {
  return format(addDays(new Date(`${dateStr}T12:00:00`), days), 'yyyy-MM-dd')
}

export function computeAccessStatus(
  event: Pick<
    Event,
    | 'event_date'
    | 'is_active'
    | 'allocation'
    | 'waitlist_enabled'
    | 'access_status_override'
    | 'release_number'
    | 'cutoff_time'
    | 'unlock_time'
  >,
  approvedCount: number,
): AccessStatus {
  if (event.access_status_override) {
    return event.access_status_override as AccessStatus
  }

  if (!event.is_active) {
    return 'ACCESS_CLOSED'
  }

  const todayStr = chicagoTodayStr()
  const yesterdayStr = chicagoDateOffset(todayStr, -1)

  // A cutoff earlier in the clock than unlock_time (e.g. doors 9:30pm,
  // complimentary access until 12:00am) "wraps" past midnight -- that
  // midnight is the start of the *next* calendar day, not the start of
  // event_date. Checking it against event_date's own day would close
  // access all day, hours before the event even starts.
  const wrapsPastMidnight = !!event.cutoff_time && !!event.unlock_time && event.cutoff_time <= event.unlock_time

  if (event.event_date === todayStr) {
    if (event.cutoff_time && !wrapsPastMidnight && chicagoTimeStr() > event.cutoff_time) {
      return 'ACCESS_CLOSED'
    }
  } else if (event.event_date === yesterdayStr && wrapsPastMidnight) {
    // Early morning after the event -- still open until the wrapped cutoff.
    if (chicagoTimeStr() > event.cutoff_time!) {
      return 'ACCESS_CLOSED'
    }
  } else if (event.event_date < todayStr) {
    return 'ACCESS_CLOSED'
  }
  // event.event_date > todayStr: future event, nothing to close yet.

  if (event.allocation == null) {
    return event.release_number > 1 ? 'FINAL_RELEASE' : 'ACCESS_OPEN'
  }

  const remaining = event.allocation - approvedCount

  if (remaining <= 0) {
    return event.waitlist_enabled ? 'WAITLIST' : 'SOLD_OUT'
  }

  if (remaining <= LIMITED_THRESHOLD) {
    return 'LIMITED_ACCESS'
  }

  return event.release_number > 1 ? 'FINAL_RELEASE' : 'ACCESS_OPEN'
}

export function remainingPasses(
  event: Pick<Event, 'allocation'>,
  approvedCount: number,
): number | null {
  if (event.allocation == null) return null
  return Math.max(0, event.allocation - approvedCount)
}

export const ACCESS_STATUS_STYLES: Record<AccessStatus, string> = {
  ACCESS_OPEN: 'bg-green-500/20 text-green-500',
  LIMITED_ACCESS: 'bg-amber-500/20 text-amber-500',
  FINAL_RELEASE: 'bg-amber-500/20 text-amber-500',
  WAITLIST: 'bg-muted text-muted-foreground',
  SOLD_OUT: 'bg-red-500/20 text-red-500',
  ACCESS_CLOSED: 'bg-muted text-muted-foreground',
  COMING_SOON: 'bg-muted text-muted-foreground',
}

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  ACCESS_OPEN: 'Access Open',
  LIMITED_ACCESS: 'Limited Access',
  FINAL_RELEASE: 'Final Release',
  SOLD_OUT: 'Sold Out',
  WAITLIST: 'Waitlist',
  ACCESS_CLOSED: 'Access Closed',
  COMING_SOON: 'Coming Soon',
}

export function ctaLabelForStatus(status: AccessStatus): string {
  switch (status) {
    case 'ACCESS_OPEN':
      return 'Request Access'
    case 'LIMITED_ACCESS':
      return 'Request Access'
    case 'FINAL_RELEASE':
      return 'Claim Access'
    case 'WAITLIST':
      return 'Join Waitlist'
    case 'SOLD_OUT':
      return 'Sold Out'
    case 'ACCESS_CLOSED':
      return 'Access Closed'
    case 'COMING_SOON':
      return 'Join Waitlist'
    default:
      return 'Request Access'
  }
}

export function isStatusActionable(status: AccessStatus): boolean {
  return status !== 'SOLD_OUT' && status !== 'ACCESS_CLOSED'
}
