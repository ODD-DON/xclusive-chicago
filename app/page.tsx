import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/340164027_737893057833813_3986126282337412231_n.jpg-6mKCMz9NNE8RpFtxi86zgsiBEEYswM.jpeg"
              alt="Xclusive Chicago"
              width={150}
              height={150}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-white">
            XCLUSIVE CHICAGO
          </h1>
          <p className="text-xl mb-4 text-gray-400">
            Experience Luxury. Experience Chicago.
          </p>
        </div>
        <div className="flex space-x-4 w-full max-w-md">
          <Link
            href="/sign-up"
            className="flex-1 bg-white hover:bg-gray-100 text-black font-bold py-3 px-6 rounded-lg transition duration-300 text-center"
          >
            Guestlist Sign Up
          </Link>
          <Link
            href="/check-in"
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition duration-300 text-center"
          >
            Check-In on Arrival
          </Link>
        </div>
      </div>
    </main>
  );
}
