<<<<<<< HEAD
//app/page.tsx
'use client'
=======
// app/page.tsx
import Image from "next/image";
>>>>>>> 31c589e1111cee983490d1889851d0c09853b79f

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Este componente ahora es la "puerta de entrada" de tu aplicación en la ruta '/'
export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      // 1. Verificamos si hay una sesión de usuario activa
      const { data: { session } } = await supabase.auth.getSession()

      // 2. Redirigimos al usuario al lugar correcto
      if (session) {
        // Si hay sesión, lo enviamos directamente al dashboard
        router.replace('/dashboard')
      } else {
        // Si no hay sesión, lo enviamos a la página de login
        router.replace('/login')
      }
    }

    checkSessionAndRedirect()
  }, [router, supabase])

  // Mientras la redirección ocurre, mostramos una pantalla de carga simple
  // para evitar un parpadeo en blanco.
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0B0A26', // Usamos un color de tu marca
      color: '#F2F2F2',
      fontFamily: 'sans-serif'
    }}>
      Cargando...
    </div>
  )
}