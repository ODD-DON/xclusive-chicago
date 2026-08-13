import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Premium Experiences | XCLUSIVE Chicago',
  description: 'Party buses, boat days, and VIP table service in Chicago.',
}

export default function ExperiencesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
