// components/analytics/charts/WinLossChart.tsx
'use client';

import 'chart.js/auto';
import { Bar } from 'react-chartjs-2';

interface WinLossChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  };
}

export const WinLossChart: React.FC<WinLossChartProps> = ({ data }) => {
  return (
    <Bar
      data={{
        labels: data.labels,
        datasets: [
          {
            ...data.datasets[0],
            backgroundColor: '#4CE5B1', // --brand-success
            borderRadius: 4,
          },
          {
            ...data.datasets[1],
            backgroundColor: '#FF6B6B', // --brand-danger
            borderRadius: 4,
          }
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
          },
          legend: {
            position: 'top',
            labels: {
              color: 'rgba(255, 255, 255, 0.72)', // --brand-muted
            }
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: 'rgba(255, 255, 255, 0.72)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            stacked: true,
            ticks: { color: 'rgba(255, 255, 255, 0.72)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
        },
      }}
    />
  );
};