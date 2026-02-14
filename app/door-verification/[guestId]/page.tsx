import { getGuestById } from "../../services/supabaseService"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DoorVerification({ params }: { params: { guestId: string } }) {
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

  if (!guest || !guest.club) {
    return <ErrorComponent message="Unable to retrieve complete reservation details. Please contact support." />
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black to-gray-900">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <Link href="/">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/340164027_737893057833813_3986126282337412231_n.jpg-6mKCMz9NNE8RpFtxi86zgsiBEEYswM.jpeg"
            alt="Xclusive Chicago"
            width={100}
            height={100}
            className="mx-auto mb-6"
          />
        </Link>
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Door Verification</h1>
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-2xl font-bold text-gray-800 mb-2">
            {guest.firstName} {guest.lastName} +{Math.max(guest.menCount + guest.womenCount - 1, 0)}
          </p>
          <p className="text-lg text-gray-600">Guest ID: {guest.id}</p>
        </div>
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-700">
            <span className="font-bold">Date:</span> {guest.date}
          </p>
          <p className="text-lg text-gray-700">
            <span className="font-bold">Club:</span> {guest.club.name}
          </p>
          <p className="text-md text-gray-600">{guest.club.address}</p>
        </div>
        <div className="mb-6">
          <img
            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(guest.voucherCode)}&scale=2&height=100&width=250&backgroundcolor=ffffff&padding=10`}
            alt="Verification Barcode"
            className="mx-auto w-full max-w-[250px] h-[100px] object-contain"
          />
        </div>
        <div className="bg-yellow-400 text-black text-4xl font-mono p-4 rounded-lg mb-6">{guest.voucherCode}</div>
        <p className="text-sm text-gray-600">
          This is your verified check-in. Please show this screen to the staff at the entrance. They may scan the
          barcode for verification.
        </p>
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

