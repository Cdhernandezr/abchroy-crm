// components/analytics/charts/FunnelChart.tsx
'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
// ✅ Importar los elementos correctos del nuevo plugin
import { FunnelController, TrapezoidElement } from 'chartjs-chart-funnel';

// ✅ Registrar Chart.js + los controladores del funnel
ChartJS.register(CategoryScale, LinearScale, Tooltip, Legend, FunnelController, TrapezoidElement);

interface FunnelChartProps {
  data: {
    labels: string[];
    data: number[];
  };
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  return (
    <Chart
      type='funnel'
      data={{
        labels: data.labels,
        datasets: [{
          data: data.data,
          // Usamos una gama de colores basada en tu --brand-accent
          backgroundColor: [
            '#7371FF', // --brand-accent
            '#8A88FF',
            '#A1A0FF',
            '#B9B8FF',
            '#D0CFFF'
          ],
          borderWidth: 0,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0B0A26', // --brand-dark
            titleColor: 'rgba(255, 255, 255, 0.72)', // --brand-muted
            bodyColor: '#F2F2F2', // --brand-light
            callbacks: {
              // ✅ Tipado seguro para funnel
              label: (context: TooltipItem<'funnel'>) =>
                ` ${context.label}: ${context.formattedValue} Oportunidades`,
            },
          },
        },
      }}
    />
  );
};
