// app/login/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  // Escuchamos cambios en la autenticación
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      // Si el usuario inicia sesión, lo redirigimos al dashboard
      router.push('/dashboard')
    }
  })

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">CRM Kanban</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={[]} // Puedes añadir providers como 'google', 'github', etc.
          redirectTo={`${location.origin}/auth/callback`}
        />
      </div>
    </div>
  )
}