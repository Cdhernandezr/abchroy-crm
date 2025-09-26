// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider' // Importamos el proveedor
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={inter.className}>
        {/* Envolvemos la app con el QueryProvider */}
        <QueryProvider>
          {children}
          <Toaster position="top-right" /> {/* 2. Añadir el componente Toaster */}
        </QueryProvider>
      </body>
    </html>
  )
}