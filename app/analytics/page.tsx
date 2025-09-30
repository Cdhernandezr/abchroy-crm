// app/analytics/page.tsx
'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation' // 1. Importar hooks de enrutamiento
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { processFunnelData, processSalesByPeriod, processSalespersonRanking, processSalesBySector, processGoalVsActual, processWinLossAnalysis } from '@/lib/analyticsHelpers'
import type { Deal, Stage, UserProfile, Account, Goal } from '@/lib/analyticsHelpers'

type PipelineInfo = {
  id: string;
  name: string;
}

// Importamos todos los componentes
import styles from './Analytics.module.css'
import ChartCard from '@/components/analytics/ChartCard'
import { FunnelChart } from '@/components/analytics/charts/FunnelChart'
import { SalesTrendChart } from '@/components/analytics/charts/SalesTrendChart'
import { SalespersonRankingChart } from '@/components/analytics/charts/SalespersonRankingChart'
import { SalesBySectorChart } from '@/components/analytics/charts/SalesBySectorChart'
import { GoalGaugeChart } from '@/components/analytics/charts/GoalGaugeChart'
import { WinLossChart } from '@/components/analytics/charts/WinLossChart'

export default function AnalyticsPage() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const pipelineId = searchParams.get('pipelineId')
    const { data: allPipelines } = useQuery<PipelineInfo[]>({
    queryKey: ['all-pipelines-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pipelines').select('id, name');
      if (error) throw error;
      return data;
    },
  });

  // Obtenemos todos los datos necesarios, filtrados por el pipelineId desde el servidor
  const { data: rawData, isLoading, isError, error } = useQuery({
    queryKey: ['analytics-data', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return null;

      const currentYear = new Date().getFullYear();
      
      const [dealsRes, stagesRes, usersRes, accountsRes, goalsRes] = await Promise.all([
        supabase.from('deals').select('*').eq('pipeline_id', pipelineId),
        supabase.from('stages').select('*').eq('pipeline_id', pipelineId),
        supabase.from('users').select('id, name'),
        supabase.from('accounts').select('id, name, sector'),
        supabase.from('goals').select('*').eq('year', currentYear)
      ]);

      if (dealsRes.error) throw dealsRes.error;
      if (stagesRes.error) throw stagesRes.error;
      if (usersRes.error) throw usersRes.error;
      if (accountsRes.error) throw accountsRes.error;
      if (goalsRes.error) throw goalsRes.error;

      return {
        deals: dealsRes.data as Deal[],
        stages: stagesRes.data as Stage[],
        users: usersRes.data as UserProfile[],
        accounts: accountsRes.data as Account[],
        goals: goalsRes.data as Goal[],
      };
    },
    enabled: !!pipelineId, // La query solo se ejecuta si hay un pipelineId
  });

  // Procesamos los datos crudos para que los gráficos puedan entenderlos
  const chartData = useMemo(() => {
    if (!rawData) return null;
    return {
      funnel: processFunnelData(rawData.deals, rawData.stages),
      salesByPeriod: processSalesByPeriod(rawData.deals, rawData.stages), // <-- Añadir stages
      salespersonRanking: processSalespersonRanking(rawData.deals, rawData.users, rawData.stages), // <-- Añadir stages
      salesBySector: processSalesBySector(rawData.deals, rawData.accounts, rawData.stages), // <-- Añadir stages
      goalVsActual: processGoalVsActual(rawData.deals, rawData.goals, rawData.stages), // <-- Añadir stages
      winLoss: processWinLossAnalysis(rawData.deals, rawData.accounts, rawData.stages), // <-- Añadir stages
    };
  }, [rawData]);

  const handlePipelineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPipelineId = e.target.value;
    // Navegamos a la misma página pero con un nuevo parámetro en la URL
    // Esto hará que la query 'analytics-data' se vuelva a ejecutar con el nuevo ID
    router.push(`${pathname}?pipelineId=${newPipelineId}`);
  };

  // Manejo de estados de carga, error o falta de datos
  if (!pipelineId) {
    return (
        <main className={styles.main}>
            <div style={{textAlign: 'center', margin: 'auto'}}>
                <h2 style={{fontSize: '20px', marginBottom: '16px'}}>Selecciona un Pipeline</h2>
                <p style={{color: 'var(--brand-muted)', marginBottom: '24px'}}>Para ver las analíticas, primero debes seleccionar un pipeline en el dashboard.</p>
                <Link href="/dashboard" className={styles.backLink}><ArrowLeft size={16} /> Volver al Dashboard</Link>
            </div>
        </main>
    );
  }

  if (isLoading) {
    return <div className={styles.main}>Cargando datos de analíticas...</div>;
  }

  if (isError) {
    return <div className={`${styles.main} text-red-400`}>Error al cargar datos: {error.message}</div>;
  }

  if (!chartData) {
    return <div className={styles.main}>No hay datos disponibles para mostrar en este pipeline.</div>;
  }
  const selectedPipelineName = allPipelines?.find(p => p.id === pipelineId)?.name || "Cargando...";
  // Renderizado final del panel de analíticas
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
            <h1 className={styles.title}>Panel de Analíticas</h1>
            <p className={styles.subtitle}>{selectedPipelineName}</p>
        </div>
        <div className={styles.actions}>
            {/* 4. AÑADIMOS EL SELECTOR DE PIPELINE */}
            <select
              value={pipelineId || ''}
              onChange={handlePipelineChange}
              className={styles.pipelineSelect} // Reutilizamos el estilo del dashboard
              disabled={!allPipelines}
            >
              <option value="">Selecciona un pipeline...</option>
              {allPipelines?.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
              ))}
            </select>
            <Link href="/dashboard" className={styles.backLink}>
              <ArrowLeft size={16} />
              Volver al Dashboard
            </Link>
        </div>
      </header>
      
      {/* 5. Mostramos el estado de carga o los gráficos */}
      {isLoading ? (
        <div style={{textAlign: 'center', paddingTop: '50px'}}>Cargando gráficos para {selectedPipelineName}...</div>
      ) : !chartData ? (
        <div style={{textAlign: 'center', paddingTop: '50px'}}>Selecciona un pipeline para ver sus analíticas.</div>
      ) : (
        <div className={styles.chartsGrid}>
          <ChartCard title="Pipeline de Ventas (Embudo)">
            <FunnelChart data={chartData.funnel} />
          </ChartCard>
          
          <ChartCard title="KPI vs Meta (Mes Actual)">
            <GoalGaugeChart data={chartData.goalVsActual} />
          </ChartCard>

          <div className={styles.spanFull}>
            <ChartCard title="Ventas Ganadas por Período (Últimas 8 Semanas)">
              <SalesTrendChart data={chartData.salesByPeriod} />
            </ChartCard>
          </div>

          <div className={styles.spanFull}>
            <ChartCard title="Ranking de Vendedores por Valor Ganado">
              <SalespersonRankingChart data={chartData.salespersonRanking} />
            </ChartCard>
          </div>

          <ChartCard title="Ventas por Sector">
            <SalesBySectorChart data={chartData.salesBySector} />
          </ChartCard>
          
          <ChartCard title="Análisis de Oportunidades (Ganadas vs. Perdidas)">
            <WinLossChart data={chartData.winLoss} />
          </ChartCard>
        </div>
      )}
    </main>
  );
}