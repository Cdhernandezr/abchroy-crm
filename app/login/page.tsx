// app/login/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
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
        <h1 className={styles.title}>CRM ABCHROY</h1>
        <p className={styles.subtitle}>Inicia sesión para gestionar tu pipeline</p>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'var(--brand-primary)',
                  brandAccent: '#E87A0D',
                  defaultButtonBackground: 'var(--brand-card)',
                  defaultButtonBackgroundHover: '#1a185c',
                  inputText: 'var(--brand-text)',
                  inputBackground: 'var(--brand-dark)',
                  inputBorder: 'rgba(114, 120, 242, 0.2)',
                  inputBorderHover: 'var(--brand-accent)',
                  inputPlaceholder: 'var(--brand-muted)',
                },
                radii: {
                  borderRadius: '12px',
                  buttonBorderRadius: '12px',
                }
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