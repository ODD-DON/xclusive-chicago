import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Xclusive Chicago',
  description: 'Privacy Policy for Xclusive Chicago guestlist services.',
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-gold max-w-none space-y-6 text-foreground/90">
          <p className="text-muted-foreground">
            Xclusive Chicago respects your privacy. This Privacy Policy explains how we collect, use, and protect your information.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect personal information such as your name and phone number when you voluntarily submit it through our guestlist signup forms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to send you SMS messages related to your guestlist registration, including confirmations, reminders, and event updates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">SMS Messaging</h2>
            <p className="text-muted-foreground">
              By providing your phone number, you consent to receive text messages from Xclusive Chicago. Message frequency may vary. Message and data rates may apply. You can opt out at any time by replying STOP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Security</h2>
            <p className="text-muted-foreground">
              We take reasonable measures to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions, please contact us at:{' '}
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
