import './globals.css'

export const metadata = {
  title: 'Plataforma Freelancer',
  description: 'Conecta con los mejores freelancers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
