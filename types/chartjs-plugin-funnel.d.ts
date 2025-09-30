declare module 'chartjs-plugin-funnel' {
  import { Controller, Element } from 'chart.js';

  export class FunnelController extends Controller {
    static id: 'funnel';
  }

  export class TrapezoidElement extends Element {
    static id: 'trapezoid';
  }

  // Extiende Chart.js para registrar el nuevo tipo "funnel"
  declare module 'chart.js' {
    interface ChartTypeRegistry {
      funnel: {
        chartOptions: any;       // opciones del gráfico
        datasetOptions: any;     // opciones de dataset
        defaultDataPoint: number;
      };
    }
  }
}
