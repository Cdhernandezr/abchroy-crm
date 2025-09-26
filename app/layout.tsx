//app/layout.tsx
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google' // Importamos la fuente optimizada
import './globals.css' // **LA LÍNEA MÁS IMPORTANTE: Importa todos nuestros estilos**
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'react-hot-toast'

// Configuración de la fuente
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'CRM Kanban',
  description: 'Gestiona tus oportunidades de venta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      {/* Aplicamos la clase de la fuente al body */}
      <body className={jakarta.className}>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  )
}