// components/analytics/charts/GoalGaugeChart.tsx
'use client';

import 'chart.js/auto';
import { Doughnut } from 'react-chartjs-2';

interface GoalGaugeChartProps { data: { goal: number; actual: number; percentage: number }; }

export const GoalGaugeChart: React.FC<GoalGaugeChartProps> = ({ data }) => {
  const remaining = Math.max(0, data.goal - data.actual);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Doughnut
        data={{
          labels: ['Alcanzado', 'Restante'],
          datasets: [{
            data: [data.actual, remaining],
            backgroundColor: [
              '#4CE5B1', // --brand-success
              'rgba(255, 255, 255, 0.1)' // Un gris muy sutil
            ],
            borderWidth: 0,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          circumference: 180,
          rotation: 270,
          cutout: '75%',
          plugins: { tooltip: { enabled: false } },
        }}
      />
      <div style={{ position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#4CE5B1' /* --brand-success */ }}>
          {data.percentage.toFixed(0)}%
        </div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.72)' /* --brand-muted */ }}>
          Alcanzado
        </div>
      </div>
    </div>
  );
};