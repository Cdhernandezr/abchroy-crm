// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'react-hot-toast'
import MainLayout from '@/components/MainLayout' // Importamos el nuevo layout

export const metadata: Metadata = {
  title: 'ABCHROY CRM',
  description: 'Gestiona tus oportunidades de venta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          {/* Usamos MainLayout para envolver todo */}
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  )
}