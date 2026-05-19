import './globals.css'

export const metadata = {
  title: 'BeautyLab',
  description: 'Gestionale Beauty'
}

export default function RootLayout({
  children
}) {
  return (
    <html lang="it">

      <body className="bg-gray-100">

        {children}

      </body>

    </html>
  )
}