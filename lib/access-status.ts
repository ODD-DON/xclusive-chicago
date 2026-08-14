import type { AccessStatus, Event } from '@/lib/types'
import { chicagoTodayStr, chicagoTimeStr } from '@/lib/date'

const LIMITED_THRESHOLD = 10

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
  >,
  approvedCount: number,
): AccessStatus {
  if (event.access_status_override) {
    return event.access_status_override as AccessStatus
  }

  const todayStr = chicagoTodayStr()

  if (!event.is_active || event.event_date < todayStr) {
    return 'ACCESS_CLOSED'
  }

  // Complimentary access closes at cutoff_time on the event's own date,
  // even though the request wizard would otherwise stay open all day.
  if (event.event_date === todayStr && event.cutoff_time && chicagoTimeStr() > event.cutoff_time) {
    return 'ACCESS_CLOSED'
  }

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
