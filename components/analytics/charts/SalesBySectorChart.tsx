// components/analytics/charts/SalesBySectorChart.tsx
'use client';

import 'chart.js/auto';
import { Doughnut } from 'react-chartjs-2';

interface SalesBySectorChartProps { data: { labels: string[]; data: number[] }; }

export const SalesBySectorChart: React.FC<SalesBySectorChartProps> = ({ data }) => {
  return (
    <Doughnut
      data={{
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: [
            '#7371FF', // --brand-accent
            '#FEA20F', // --brand-primary
            '#4CE5B1', // --brand-success
            '#FF6B6B', // --brand-danger
            '#a1a0ff'  // Un tono más claro del accent
          ],
          borderColor: '#14133a', // --brand-card
          borderWidth: 4,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.72)', // --brand-muted
              padding: 20,
            }
          },
        },
      }}
    />
  );
};