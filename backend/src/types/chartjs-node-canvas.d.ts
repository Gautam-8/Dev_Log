declare module 'chartjs-node-canvas' {
  import { ChartConfiguration } from 'chart.js';

  export class ChartJSNodeCanvas {
    constructor(options: { width: number; height: number });
    renderToBuffer(configuration: ChartConfiguration): Promise<Buffer>;
  }
} 