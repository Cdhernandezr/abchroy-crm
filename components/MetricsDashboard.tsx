// components/MetricsDashboard.tsx
'use client'

import { FC, useMemo } from 'react'
import { TrendingUp, Target, DollarSign, Clock, Package } from 'lucide-react'
import styles from './MetricsDashboard.module.css'
import type { Deal, Stage } from '@/lib/analyticsHelpers'


interface MetricsDashboardProps { deals: Deal[]; stages: Stage[]; }

// --- Sub-componente MetricCard ---
const MetricCard: FC<{ title: string; value: string; deltaText: string; deltaClass: string }> = ({ title, value, deltaText, deltaClass }) => (
  <div className={styles.card}>
    {/* <div className={styles.iconWrapper}>{icon}</div> */}
    <div>
      <p className={styles.label}>{title}</p>
      <p className={styles.value}>{value}</p>
      <div className={`${styles.delta} ${styles.up}`}>{deltaText}</div>
    </div>
  </div>
)

// --- Componente principal con la lógica de cálculo mejorada ---
const MetricsDashboard: FC<MetricsDashboardProps> = ({ deals, stages }) => {
  // 3. LA LÓGICA DE CÁLCULO AHORA USA 'stages' Y 'std_map'
  const metrics = useMemo(() => {
    // Función auxiliar interna para determinar el estado, igual que en las analíticas
    const getStatus = (deal: Deal) => {
      const stage = stages.find(s => s.id === deal.stage_id);
      if (stage?.std_map === 'Ganado') return 'won';
      if (stage?.std_map === 'Perdido') return 'lost';
      return 'open';
    };

    const wonDeals = deals.filter(d => getStatus(d) === 'won');
    const lostDeals = deals.filter(d => getStatus(d) === 'lost');
    const openDeals = deals.filter(d => getStatus(d) === 'open');
    const createdToday = deals.filter(d => {
      const createdAt = new Date(d.created_at);
      const today = new Date();
      return createdAt.toDateString() === today.toDateString();
    }).length;

    // KPI 1: Tasa de Conversión (Ganado vs. Perdido)
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

    // KPI 2: Valor Promedio por Trato Ganado
    const totalValueWon = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const averageDealValue = wonDeals.length > 0 ? totalValueWon / wonDeals.length : 0;

    // KPI 3: Valor en Pipeline (solo oportunidades abiertas)
    const pipelineValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    // KPI 4: Total de Oportunidades (en el pipeline actual)
    const totalOpportunities = deals.length;

    return {
      totalOpportunities: String(totalOpportunities),
      createdTodayText: `+${createdToday} hoy`,
      pipelineValueText: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pipelineValue),
      conversionRateText: `${conversionRate.toFixed(0)}%`,
      averageDealValueText: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(averageDealValue),
    };
  }, [deals, stages]); // El cálculo se re-ejecuta si cambian los deals o las etapas

  return (
    <div className={styles.grid}>
      <MetricCard title="Oportunidades" value={metrics.totalOpportunities} deltaText={metrics.createdTodayText} deltaClass={styles.up} />
      <MetricCard title="Valor en Pipeline" value={metrics.pipelineValueText} deltaText="En etapas abiertas" deltaClass="" />
      <MetricCard title="Tasa de Conversión" value={metrics.conversionRateText} deltaText="Ganado vs. Cerrado" deltaClass="" />
      <MetricCard title="Valor Promedio Ganado" value={metrics.averageDealValueText} deltaText="Promedio por trato" deltaClass="" />
    </div>
  )
}

/*   return (
    <div className={styles.grid}>
      <MetricCard 
        title="Oportunidades" 
        value={metrics.totalOpportunities} 
        deltaText={metrics.createdTodayText} 
        icon={<Package size={24} />} 
      /> */


export default MetricsDashboard