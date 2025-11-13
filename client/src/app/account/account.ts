import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  template: `
    <div class="container my-4">
    <h2 class="mb-4">My Google Analytics Stats</h2>

    <!-- Row for charts -->
    <div class="row mb-4">
      <div class="mx-auto col-lg-10 col-md-6">
        <div class="card shadow-sm">
          <div class="card-header">Sessions Over Time</div>
          <div class="card-body">
            <canvas baseChart
              [data]="lineChartData"
              [options]="lineChartOptions"
              [type]="'line'">
            </canvas>
          </div>
        </div>
      </div>

      <div class="mx-auto col-lg-10 col-md-6">
        <div class="card shadow-sm">
          <div class="card-header">Traffic Sources</div>
          <div class="card-body">
            <canvas baseChart
              [data]="pieChartData"
              [type]="'pie'">
            </canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card shadow-sm">
      <div class="card-header">Top Landing Pages</div>
      <div class="card-body">
        <table *ngIf="stats?.rows; else loading" class="table table-striped table-bordered">
          <thead class="table-light">
            <tr>
              <th *ngFor="let d of stats.dimensionHeaders">{{ d.name }}</th>
              <th *ngFor="let m of stats.metricHeaders">{{ m.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of stats.rows">
              <td *ngFor="let d of row.dimensionValues; let i = index">
                {{ stats.dimensionHeaders[i].name === 'date' ? formatDate(d.value) : d.value }}
              </td>
              <td *ngFor="let m of row.metricValues">
                {{ formatNumber(m.value) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <ng-template #loading> Loading stats... </ng-template>
  `,
})

export class AccountComponent implements OnInit {
  stats: any;

  // Chart configs
  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = { responsive: true };
  pieChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>('/api/stats').subscribe({
      next: (data) => {
        this.stats = data;

        // 🔹 Build line chart from GA "date" dimension + activeUsers metric
        const dates = data.rows.map((r: any) => this.formatDate(r.dimensionValues[0].value));
        const activeUsers = data.rows.map((r: any) => Number(r.metricValues[0].value));

        this.lineChartData = {
          labels: dates,
          datasets: [
            {
              label: 'Active Users',
              data: activeUsers,
              borderColor: '#42A5F5',
              backgroundColor: 'rgba(66,165,245,0.2)',
              fill: true,
              tension: 0.3
            }
          ]
        };

        // 🔹 Build pie chart from GA "sessionDefaultChannelGroup" dimension + activeUsers
        const channels = data.rows.map((r: any) => r.dimensionValues[1].value); // sessionDefaultChannelGroup
        const channelUsers = data.rows.map((r: any) => Number(r.metricValues[0].value));

        this.pieChartData = {
          labels: channels,
          datasets: [
            {
              data: channelUsers,
              backgroundColor: ['#42A5F5','#66BB6A','#FFA726','#AB47BC','#FF7043']
            }
          ]
        };
      },
      error: (err) => (this.stats = err.error || { error: 'Unauthorized' })
    });
  }

  // helper: GA dates come as "YYYYMMDD" (e.g. 20250818 → 2025-08-18)
  // account.component.ts
  formatDate(gaDate: string): string {
      if (!gaDate || gaDate.length !== 8) return gaDate;
      return `${gaDate.substring(0,4)}-${gaDate.substring(4,6)}-${gaDate.substring(6,8)}`;
    }
    
  formatNumber(numStr: string): string {
    // Handle empty or non-numeric strings
    if (!numStr) return '';
    const num = Number(numStr);
    if (isNaN(num)) return numStr;

    // Format integers nicely with commas
    if (Number.isInteger(num)) {
      return num.toLocaleString();
    }

    // For floats: 3 significant figures
    return Number.parseFloat(num.toFixed(3)).toString();
  }

  getChange(row: any): string {
    const current = Number(row.metricValues[0].value);
    const previous = Number(row.metricValues[0].comparisonValue); // depends on how you map GA4 response
    if (isNaN(current) || isNaN(previous)) return '';
    const diff = ((current - previous) / previous) * 100;
    return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
  }

  getChangeColor(row: any): string {
    const current = Number(row.metricValues[0].value);
    const previous = Number(row.metricValues[0].comparisonValue);
    if (isNaN(current) || isNaN(previous)) return 'black';
    return current >= previous ? 'green' : 'red';
  }
}