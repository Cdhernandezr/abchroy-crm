// components/MetricsDashboard.tsx
'use client'

import { FC, useMemo } from 'react'
import { TrendingUp, Target, DollarSign, Clock } from 'lucide-react'

type Deal = {
  value: number | null;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface MetricsDashboardProps {
  deals: Deal[];
}

const MetricCard: FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex items-center">
    <div className="bg-gray-700 p-3 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
)

const MetricsDashboard: FC<MetricsDashboardProps> = ({ deals }) => {
  // Usamos useMemo para que las métricas solo se recalculen si los 'deals' cambian
  const metrics = useMemo(() => {
    const wonDeals = deals.filter(d => d.status === 'Cerrada' && d.closed_at !== null && (d.value || 0) > 0);
    const lostDeals = deals.filter(d => d.status === 'Cerrada' && d.closed_at !== null && (d.value || 0) === 0); // Asumiendo que perdidos tienen valor 0 o se marcan de otra forma

    // 1. Tasa de Conversión
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

    // 2. Valor Promedio de Trato
    const totalValueWon = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const averageDealValue = wonDeals.length > 0 ? totalValueWon / wonDeals.length : 0;

    // 3. Ciclo de Venta Promedio (en días)
    let totalSalesCycleDays = 0;
    wonDeals.forEach(deal => {
      const creationDate = new Date(deal.created_at).getTime();
      const closingDate = new Date(deal.closed_at!).getTime();
      const diffDays = (closingDate - creationDate) / (1000 * 3600 * 24);
      totalSalesCycleDays += diffDays;
    });
    const averageSalesCycle = wonDeals.length > 0 ? totalSalesCycleDays / wonDeals.length : 0;

    return {
      conversionRate: `${conversionRate.toFixed(1)}%`,
      averageDealValue: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(averageDealValue),
      averageSalesCycle: `${averageSalesCycle.toFixed(1)} días`,
      totalValueWon: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValueWon)
    }
  }, [deals])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricCard title="Tasa de Conversión" value={metrics.conversionRate} icon={<Target size={24} />} />
      <MetricCard title="Valor Total Ganado" value={metrics.totalValueWon} icon={<DollarSign size={24} />} />
      <MetricCard title="Ciclo de Venta Promedio" value={metrics.averageSalesCycle} icon={<Clock size={24} />} />
      <MetricCard title="Valor Promedio por Trato" value={metrics.averageDealValue} icon={<TrendingUp size={24} />} />
    </div>
  )
}

export default MetricsDashboard