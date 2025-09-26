// components/LogoutButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center text-sm text-gray-300 hover:text-white"
    >
      <LogOut size={16} className="mr-2" />
      Cerrar Sesión
    </button>
  )
}