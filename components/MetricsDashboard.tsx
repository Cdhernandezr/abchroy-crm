'use client'

import { FC, useMemo,useState  } from 'react'
import styles from './MetricsDashboard.module.css'
import type { Deal, Stage } from '@/lib/analyticsHelpers'
import { calculateWeightedForecast } from '@/lib/analyticsHelpers' 
import { RefreshCw } from 'lucide-react'

// El sub-componente MetricCard se mantiene igual.
const MetricCard: FC<{ title: string; value: string; deltaText: string; deltaClass: string }> = ({ title, value, deltaText, deltaClass }) => (
  <div className={styles.card}>
    <div>
      <p className={styles.label}>{title}</p>
      <p className={styles.value}>{value}</p>
      <div className={`${styles.delta} ${styles.up}`}>{deltaText}</div>
    </div>
  </div>
)

interface MetricsDashboardProps {
  deals: Deal[];
  stages: Stage[];
}

const MetricsDashboard: FC<MetricsDashboardProps> = ({ deals, stages }) => {
  const [showForecast, setShowForecast] = useState(false);
  const metrics = useMemo(() => {
    // La función auxiliar para determinar el estado no cambia.
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

    // --- CÁLCULOS DE KPI ---

    // KPI : Total de Oportunidades 
    const totalOpportunities = deals.length;

    // KPI: Previsión Ponderada
    const weightedForecast = calculateWeightedForecast(deals, stages);

    // KPI : Valor en Pipeline 
    const pipelineValue = openDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    // KPI : Tasa de Conversión 
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

    // KPI : Edad Promedio de Oportunidades ABIERTAS
    const totalAgeInDays = openDeals.reduce((sum, deal) => {
        const creationDate = new Date(deal.created_at).getTime();
        const today = new Date().getTime();
        // Calculamos la diferencia en milisegundos y la convertimos a días
        const ageInDays = (today - creationDate) / (1000 * 3600 * 24);
        return sum + ageInDays;
    }, 0);
    // Calculamos el promedio
    const averageAge = openDeals.length > 0 ? totalAgeInDays / openDeals.length : 0;

    // Devolvemos los valores formateados para la UI
    return {
      totalOpportunities: String(totalOpportunities),
      createdTodayText: `+${createdToday} hoy`,
      pipelineValueText: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pipelineValue),
      weightedForecastText: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(weightedForecast),
      conversionRateText: `${conversionRate.toFixed(0)}%`,
      averageAgeText: `${averageAge.toFixed(0)}d`,
    };
  }, [deals, stages]);

  return (
    <div className={styles.grid}>
      <MetricCard title="Oportunidades" value={metrics.totalOpportunities} deltaText={metrics.createdTodayText} deltaClass={styles.up} />
      {/* <MetricCard title="Valor en Pipeline" value={metrics.pipelineValueText} deltaText="En etapas abiertas" deltaClass="" /> */}
      <div className={styles.card}>
        <div className={styles.labelContainer}>
          <p className={styles.label}>
            {showForecast ? "Previsión Ponderada" : "Valor en Pipeline"}
          </p>
          <label className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              checked={showForecast} 
              onChange={() => setShowForecast(!showForecast)} 
            />
            <span className={styles.track}>
              <span className={styles.thumb}></span>
            </span>
          </label>
        </div>
        <p className={styles.value}>
          {showForecast ? metrics.weightedForecastText : metrics.pipelineValueText}
        </p>
        <div className={styles.delta}> {/* CORRECCIÓN: Ahora usará el color --brand-muted por defecto */}
          {showForecast ? "Estimación para este mes" : "Suma de oportunidades abiertas"}
        </div>
      </div>
      <MetricCard title="Tasa de Conversión" value={metrics.conversionRateText} deltaText="Ganado vs. Cerrado" deltaClass="" />
      <MetricCard title="Edad Promedio" value={metrics.averageAgeText} deltaText="Desde creación" deltaClass="" />
    </div>
  )
}

export default MetricsDashboard