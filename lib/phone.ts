// Formats digits as the guest types so a typo is obvious before submit --
// the trailing non-digit characters (dashes) never reach validation/submit
// logic, which already strips non-digits itself.
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}
