import { getGuestById } from "../../services/supabaseService"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Confirmation({ params }: { params: { guestId: string } }) {
  let guest
  let error = null

  try {
    guest = await getGuestById(params.guestId)
    if (!guest) {
      error = "Guest not found. Please check your reservation details and try again."
    }
  } catch (err) {
    console.error("Error fetching guest:", err)
    error = "An error occurred while fetching your reservation. Please try again later."
  }

  if (error) {
    return <ErrorComponent message={error} />
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <Link href="/">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/340164027_737893057833813_3986126282337412231_n.jpg-6mKCMz9NNE8RpFtxi86zgsiBEEYswM.jpeg"
          alt="Xclusive Chicago"
          width={150}
          height={150}
          className="mb-8"
        />
      </Link>
      <div className="gold-border rounded-lg max-w-2xl w-full">
        <div className="bg-black rounded-lg p-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">Thank You, {guest.firstName}!</h1>
          <p className="text-xl text-gray-400 mb-6">Your reservation has been confirmed.</p>
          <div className="bg-yellow-400 text-black p-4 rounded-md mb-6">
            <h2 className="text-2xl font-bold mb-2">Your Voucher Code</h2>
            <p className="text-3xl font-mono">{guest.voucherCode}</p>
          </div>
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">
            <h3 className="text-xl font-bold mb-2">IMPORTANT INSTRUCTIONS</h3>
            <ol className="list-decimal list-inside text-left space-y-2">
              <li>Arrive at {guest.club?.name} before 11:00 PM.</li>
              <li className="font-bold">
                On your way to the club, use the "Check-In on Arrival" feature on our website.
              </li>
              <li>Enter your voucher code to get your redemption.</li>
              <li>Show the confirmation screen to the staff at the entrance.</li>
            </ol>
          </div>
          <div className="text-gray-300 space-y-4">
            <p className="font-bold text-lg">
              Your voucher is valid only for {guest.date} at {guest.club?.name}.
            </p>
            <p className="text-md">Club Address: {guest.club?.address}</p>
            <p>
              Failure to follow these instructions may result in denied entry. If you have any questions, please contact
              our support team.
            </p>
          </div>
          <div className="mt-8 p-4 bg-purple-600 rounded-md">
            <h3 className="text-2xl font-bold mb-2 text-white">Capture the Moment!</h3>
            <p className="text-white">
              Don't forget to take amazing photos of your night out and tag us on Instagram{" "}
              <a
                href="https://www.instagram.com/xclusivechicago"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                @xclusivechicago
              </a>
              . Share your Xclusive experience and you might be featured on our page!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorComponent({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <Link href="/">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/340164027_737893057833813_3986126282337412231_n.jpg-6mKCMz9NNE8RpFtxi86zgsiBEEYswM.jpeg"
          alt="Xclusive Chicago"
          width={150}
          height={150}
          className="mb-8"
        />
      </Link>
      <div className="bg-red-600 text-white p-8 rounded-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="mb-6">{message}</p>
        <Link href="/" passHref>
          <Button variant="secondary" className="w-full">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

