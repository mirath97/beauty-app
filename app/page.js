import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Dashboard
      </h1>

      <p className="text-gray-500">
        Benvenuta nel gestionale
      </p>

      <div className="flex gap-4">
        <Link href="/calendar" className="bg-pink-500 text-white px-4 py-2 rounded-xl">
          Vai al calendario
        </Link>

        <Link href="/clients" className="bg-gray-200 px-4 py-2 rounded-xl">
          Clienti
        </Link>
      </div>

    </div>
  )
}