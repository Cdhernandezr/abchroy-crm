/* app/dashboard/page.tsx */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import KanbanBoard from '@/components/KanbanBoard'
import MetricsDashboard from '@/components/MetricsDashboard'
import LogoutButton from '@/components/LogoutButton'
import { LayoutDashboard } from 'lucide-react' 
import styles from './Dashboard.module.css'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  // Estado para gestionar el pipeline activo
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  // Efecto para verificar la sesión del usuario al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Si no hay sesión, redirigir a la página de login
        router.push('/login')
      }
    }
    checkSession()
  }, [supabase, router])

  // Hook de React Query para obtener todos los datos necesarios para el dashboard
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['kanban-data'],
    queryFn: async () => {
      // Hacemos todas las llamadas a la base de datos en paralelo para máxima eficiencia
      const [pipelinesRes, stagesRes, dealsRes, usersRes, accountsRes] = await Promise.all([
        supabase.from('pipelines').select('*'),
        supabase.from('stages').select('*'),
        supabase.from('deals').select('*'),
        supabase.from('users').select('id, name, avatar'),
        supabase.from('accounts').select('id, name')
      ])

      // Manejo de errores para cada una de las peticiones
      if (pipelinesRes.error) throw new Error(pipelinesRes.error.message)
      if (stagesRes.error) throw new Error(stagesRes.error.message)
      if (dealsRes.error) throw new Error(dealsRes.error.message)
      if (usersRes.error) throw new Error(usersRes.error.message)
      if (accountsRes.error) throw new Error(accountsRes.error.message)

      // Si todo es exitoso, devolvemos un objeto con todos los datos
      return {
        pipelines: pipelinesRes.data,
        stages: stagesRes.data,
        deals: dealsRes.data,
        users: usersRes.data,
        accounts: accountsRes.data
      }
    },
  });
  
  // Efecto para establecer el pipeline por defecto una vez que los datos han cargado
  useEffect(() => {
    if (!selectedPipelineId && data && data.pipelines.length > 0) {
      // Seleccionamos el primer pipeline de la lista como activo
      setSelectedPipelineId(data.pipelines[0].id);
    }
  }, [data, selectedPipelineId]);

  // Manejo del estado de carga inicial
  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Cargando dashboard...</div>
  }

  // Manejo de errores en la obtención de datos
  if (isError) {
    return <div className="p-8 text-center text-red-500">Error al cargar el tablero: {error.message}</div>
  }

  // Manejo del estado vacío: si no hay pipelines, mostramos un mensaje de bienvenida y un llamado a la acción
  if (!data || data.pipelines.length === 0) {
    return (
      <main className="p-8 flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
            <LayoutDashboard size={48} className="text-gray-500 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2">Bienvenido a tu CRM</h2>
            <p className="text-gray-400 mb-6">Parece que aún no tienes pipelines. ¡Crea uno para empezar a gestionar tus oportunidades!</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Crear tu Primer Pipeline
            </button>
        </div>
      </main>
    )
  }

  return (
        <main className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-brand-light">Dashboard de Ventas</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <label htmlFor="pipeline-select" className="text-sm text-brand-muted mr-2">Pipeline:</label>
            <select
              id="pipeline-select"
              value={selectedPipelineId || ''}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              // FIX: Apply the new style
              className={styles.pipelineSelect}
            >
              {data.pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
              ))}
            </select>
          </div>
          <LogoutButton />
        </div>
      </div>
      
      <MetricsDashboard deals={data.deals} />

      <h2 className="text-2xl font-bold mb-4 mt-8">
        {data.pipelines.find(p => p.id === selectedPipelineId)?.name}
      </h2>
      
      {/* Renderizado condicional del Kanban para asegurar que selectedPipelineId no sea nulo */}
      {selectedPipelineId && (
        <KanbanBoard
          key={selectedPipelineId} // Forza el re-renderizado al cambiar de pipeline
          pipelineId={selectedPipelineId}
          allStages={data.stages}
          allDeals={data.deals}
          allUsers={data.users}
          allAccounts={data.accounts}
        />
      )}
    </main>
  )
}
