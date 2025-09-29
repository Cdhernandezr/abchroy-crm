// app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Este componente será la página de inicio (ruta '/')
export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      // 1. Obtenemos la sesión del usuario
      const { data: { session } } = await supabase.auth.getSession()

      // 2. Redirigimos basado en si existe o no la sesión
      if (session) {
        // Si hay sesión, el usuario está logueado -> vamos al dashboard
        router.replace('/dashboard')
      } else {
        // Si no hay sesión, el usuario no está logueado -> vamos al login
        router.replace('/login')
      }
    }

    checkSessionAndRedirect()
  }, [supabase, router]) // Las dependencias del efecto

  // Mientras se verifica la sesión, mostramos una pantalla de carga simple
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0B0A26',
      color: '#F2F2F2',
      fontFamily: 'sans-serif'
    }}>
      Cargando...
    </div>
  )
}