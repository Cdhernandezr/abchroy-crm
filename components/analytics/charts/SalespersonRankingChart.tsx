// components/analytics/charts/SalespersonRankingChart.tsx
'use client';

import 'chart.js/auto';
import { Bar } from 'react-chartjs-2';

interface SalespersonRankingChartProps { data: { labels: string[]; data: number[] }; }

export const SalespersonRankingChart: React.FC<SalespersonRankingChartProps> = ({ data }) => {
  return (
    <Bar
      data={{
        labels: data.labels,
        datasets: [{
          label: 'Ventas Totales',
          data: data.data,
          backgroundColor: 'rgba(114, 120, 242, 0.6)', // --brand-accent con transparencia
          borderColor: '#7371FF', // --brand-accent
          borderWidth: 1,
          borderRadius: 4,
        }],
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: 'rgba(255, 255, 255, 0.72)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
          y: { ticks: { color: 'rgba(255, 255, 255, 0.72)' }, grid: { display: false } },
        }
      }}
    />
  );
};