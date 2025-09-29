'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
// Importamos los nuevos estilos
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      router.push('/dashboard')
    }
  })

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>CRM Kanban</h1>
        <p className={styles.subtitle}>Inicia sesión para gestionar tus oportunidades</p>
        <Auth
          supabaseClient={supabase}
          // Usamos la prop 'appearance' para estilizar el interior del componente de Supabase
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'var(--brand-primary)',
                  brandAccent: '#E87A0D',
                  defaultButtonBackground: 'var(--brand-dark)',
                  defaultButtonBackgroundHover: '#1a185c',
                  inputText: 'var(--brand-light)',
                  inputBackground: 'var(--brand-dark)',
                  inputBorder: 'rgba(114, 120, 242, 0.2)',
                  inputBorderHover: 'var(--brand-accent)',
                  inputPlaceholder: 'var(--brand-muted)',
                },
              }
            }
          }}
          theme="dark"
          providers={[]}
        />
      </div>
    </div>
  )
}