import { redirect } from 'next/navigation'

// Superseded by /my, which does the same phone lookup but keeps guests
// logged in across visits instead of a one-time search. Kept as a redirect
// so any link or bookmark to the old URL still lands somewhere useful.
export default function LookupRedirect() {
  redirect('/my')
}
