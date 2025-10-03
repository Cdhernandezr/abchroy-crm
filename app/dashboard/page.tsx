//app/dashboard/page.tsx
'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import KanbanBoard from '@/components/KanbanBoard'
import MetricsDashboard from '@/components/MetricsDashboard'
import LogoutButton from '@/components/LogoutButton'
import { LayoutDashboard, BarChart2 } from 'lucide-react'
import styles from './Dashboard.module.css'
import type { Deal, Stage, UserProfile, Account, Activity } from '@/lib/analyticsHelpers'
import Image from 'next/image'

// Definimos la forma de los datos que esperamos de la API
interface KanbanData {
  pipelines: { id: string; name: string }[];
  stages: Stage[];
  deals: Deal[];
  users: UserProfile[];
  accounts: Account[];
  activities: Activity[];
}

export default function DashboardPage() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // La lógica de sesión no cambia
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkSession();
  }, [supabase, router]);

  const { data, isLoading, isError, error } = useQuery<KanbanData>({
    queryKey: ['kanban-data'],
    queryFn: async () => {
      // La lógica de fetching no cambia, solo aseguramos los tipos
      const [pipelinesRes, stagesRes, dealsRes, usersRes, accountsRes, activitiesRes] = await Promise.all([
        supabase.from('pipelines').select('id, name'),
        supabase.from('stages').select('*'),
        supabase.from('deals').select('*'),
        supabase.from('users').select('id, name, avatar'),
        supabase.from('accounts').select('id, name, sector'),
        supabase.from('activities').select('*'),
      ]);
      // Manejo de errores para cada una de las consultas
      if (pipelinesRes.error) throw new Error(pipelinesRes.error.message);
      if (stagesRes.error) throw new Error(stagesRes.error.message);
      if (dealsRes.error) throw new Error(dealsRes.error.message);
      if (usersRes.error) throw new Error(usersRes.error.message);
      if (accountsRes.error) throw new Error(accountsRes.error.message);
      if (activitiesRes.error) throw activitiesRes.error;

      return { pipelines: pipelinesRes.data, stages: stagesRes.data, deals: dealsRes.data, users: usersRes.data, accounts: accountsRes.data, activities: activitiesRes.data };
    },
  });
  
  // Hook para establecer el primer pipeline como seleccionado por defecto cuando los datos cargan
  useEffect(() => {
    if (!selectedPipelineId && data && data.pipelines.length > 0) {
      setSelectedPipelineId(data.pipelines[0].id);
    }
  }, [data, selectedPipelineId]);

  // CORRECCIÓN 1: Lógica de filtrado simplificada y más robusta
  const dealsForSelectedPipeline = useMemo(() => {
    // Si no hay datos o pipeline seleccionado, devolvemos un array vacío
    if (!data || !selectedPipelineId) {
      return [];
    }
    // Filtramos los deals directamente por su pipeline_id. ¡Mucho más simple!
    return data.deals.filter(deal => deal.pipeline_id === selectedPipelineId);
  }, [data, selectedPipelineId]);

  // CORRECCIÓN 2: Guard Clauses para manejar los estados de carga
  if (isLoading) {
    return <div className="p-8 text-center">Cargando dashboard...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-400">Error: {error.message}</div>;
  }
  
  // Si no hay datos (incluso después de cargar), mostramos un estado vacío
  if (!data || !selectedPipelineId) {
    return <div className="p-8 text-center">No hay datos de pipeline disponibles.</div>;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className={styles.header}>
        <div className={styles.topbar}>
          <div className={styles.titleGroup}>

                {/* 2. Reemplazamos el div decorativo por el componente Image */}
                <Image
                  src="/logo.png"
                  alt="Logo de ABCHROY"
                  width={116}
                  height={66}
                  className={styles.logoImage} // Usamos la clase para darle el tamaño y radio
                  priority // Ayuda a que el logo cargue más rápido
                />

            <div>
              <h1 className={styles.title}>CRM ABCHROY</h1>
              <p className={styles.subtitle}>Gestión de Oportunidades y Pipeline</p>
            </div>
          </div>
          <div className={styles.actions}>
            <Link 
              href={`/analytics?pipelineId=${selectedPipelineId}`} 
              className={styles.analyticsButton}
            >
              <BarChart2 size={16} />
              Analíticas
            </Link>
            <select
              id="pipeline-select"
              value={selectedPipelineId || ''}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className={styles.pipelineSelect}
            >
              {data.pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
              ))}
            </select>
            <LogoutButton />
          </div>
        </div>
        {/* Pasamos los deals ya filtrados para que las métricas sean correctas */}
        <MetricsDashboard 
          deals={dealsForSelectedPipeline} 
          stages={data.stages} 
        />
      </header>
      
      <section>
        <h2 className="text-2xl font-bold mb-4 mt-8 text-brand-light">
          {data.pipelines.find(p => p.id === selectedPipelineId)?.name}
        </h2>
        {/* Renderizamos el Kanban solo cuando tenemos todos los datos necesarios */}
        {selectedPipelineId && (
          // CORRECCIÓN 3: Pasamos las props con la seguridad de que 'data' existe
          <KanbanBoard
            key={selectedPipelineId}
            pipelineId={selectedPipelineId}
            initialDeals={dealsForSelectedPipeline}
            allStages={data.stages}
            allUsers={data.users}
            allAccounts={data.accounts}
            allActivities={data.activities} // ← Pasamos las actividades aquí
          />
        )}
      </section>
    </main>
  );
}