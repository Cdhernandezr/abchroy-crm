// components/analytics/charts/SalesTrendChart.tsx
'use client';

import 'chart.js/auto';
import { Line } from 'react-chartjs-2';

interface SalesTrendChartProps { data: { labels: string[]; data: number[] }; }

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data }) => {
  return (
    <Line
      data={{
        labels: data.labels,
        datasets: [{
          label: 'Valor Ganado',
          data: data.data,
          borderColor: '#FEA20F', // --brand-primary
          backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 250);
            gradient.addColorStop(0, 'rgba(254, 162, 15, 0.4)');
            gradient.addColorStop(1, 'rgba(254, 162, 15, 0)');
            return gradient;
          },
          tension: 0.3,
          fill: true,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: 'rgba(255, 255, 255, 0.72)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
          y: { ticks: { color: 'rgba(255, 255, 255, 0.72)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
        }
      }}
    />
  );
};