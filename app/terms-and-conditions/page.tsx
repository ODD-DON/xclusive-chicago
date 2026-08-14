import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions | Xclusive Chicago',
  description: 'Terms and Conditions for Xclusive Chicago guestlist services.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <Image
              src="/logo.png"
              alt="Xclusive Chicago"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: August 14, 2026</p>

        <div className="prose prose-invert prose-gold max-w-none space-y-6 text-foreground/90">
          <p className="text-muted-foreground">
            By signing up for the Xclusive Chicago guestlist and providing your phone number, you agree to receive SMS messages related to event guestlists, confirmations, reminders, and updates.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Messaging Consent</h2>
            <p className="text-muted-foreground">
              By submitting your phone number, you consent to receive transactional SMS messages from Xclusive Chicago related to your guestlist registration, including confirmations and event reminders. Message frequency may vary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Message & Data Rates</h2>
            <p className="text-muted-foreground">
              Message and data rates may apply depending on your mobile carrier.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Opt-Out Instructions</h2>
            <p className="text-muted-foreground">
              You can opt out of receiving messages at any time by replying STOP to any message. After opting out, you will no longer receive SMS communications from us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Help Instructions</h2>
            <p className="text-muted-foreground">
              For help, reply HELP or contact us at{' '}
              <a href="mailto:support@xclusivechicago.com" className="text-gold hover:underline">
                support@xclusivechicago.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">User Responsibilities</h2>
            <p className="text-muted-foreground">
              You agree to provide accurate information when signing up and understand that guestlist entry is subject to venue rules and capacity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Xclusive Chicago is not responsible for any delays or failures in message delivery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Privacy</h2>
            <p className="text-muted-foreground">
              Your information will be handled in accordance with our{' '}
              <Link href="/privacy" className="text-gold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
            <p className="text-muted-foreground">
              For any questions, contact us at:{' '}
              <a href="mailto:support@xclusivechicago.com" className="text-gold hover:underline">
                support@xclusivechicago.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
