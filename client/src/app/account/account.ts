import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
type TopMetrics = {
  impressions: number | null;
  ctr: number | null;
  backlinks: number | null;
  sessions: number | null;
};


@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './account.html',
  styleUrls: ['./account.css'],
})
export class AccountComponent implements OnInit {
  stats: any;

  topMetrics: TopMetrics = {
    impressions: null,
    ctr: null,
    backlinks: null,
    sessions: null
  };
  pagePerformance: {
    page: string;
    sessions: number;
    clicks: number;
    ctr: number;
  }[] = [];

  // Charts
  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = { responsive: true };

  pieChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.http.get<any>('/api/stats').subscribe({
      next: (data) => {
        this.stats = data;

        // Example: Compute total sessions
        const totalSessions = data.rows.reduce(
          (sum: number, r: any) => sum + Number(r.metricValues[0].value),
          0
        );


        // -----------------------------
        // 📊 Build Line Chart (Active Users over Time)
        // -----------------------------
        const dates = data.rows.map((r: any) =>
          this.formatDate(r.dimensionValues[0].value)
        );
        const activeUsers = data.rows.map((r: any) =>
          Number(r.metricValues[0].value)
        );

        this.lineChartData = {
          labels: dates,
          datasets: [
            {
              label: 'Active Users',
              data: activeUsers,
              borderColor: '#42A5F5',
              backgroundColor: 'rgba(66,165,245,0.2)',
              fill: true,
              tension: 0.3,
            },
          ],
        };
        // Build Page Performance table
        this.pagePerformance = this.stats.rows.map((r: any) => {
          const page = r.dimensionValues[2]?.value || 'Unknown';        // adjust index if needed
          const sessions = Math.round(Number(r.metricValues[0]?.value || 0));
          const clicks = Math.round(Number(r.metricValues[1]?.value || 0));


          const ctr = clicks && sessions ? (clicks / sessions) * 100 : 0;

          return {
            page,
            sessions,
            clicks,
            ctr: Number(ctr.toFixed(2))
          };
        });

        // -----------------------------
        // 🥧 Build Pie Chart (Users by Channel Group)
        // -----------------------------
        const channels = data.rows.map(
          (r: any) => r.dimensionValues[1]?.value ?? 'Unknown'
        );
        const channelUsers = data.rows.map((r: any) =>
          Number(r.metricValues[0].value)
        );

        this.pieChartData = {
          labels: channels,
          datasets: [
            {
              data: channelUsers,
              backgroundColor: [
                '#42A5F5',
                '#66BB6A',
                '#FFA726',
                '#AB47BC',
                '#FF7043',
              ],
            },
          ],
        };
      },

      error: (err) => {
        this.stats = err.error || { error: 'Unauthorized' };
      },
    });
  }

  // --- Helpers from your newer file ---

  formatDate(gaDate: string): string {
    if (!gaDate || gaDate.length !== 8) return gaDate;
    const year = gaDate.substring(0, 4);
    const month = gaDate.substring(4, 6);
    const day = gaDate.substring(6, 8);

    const jsDate = new Date(`${year}-${month}-${day}`);
    return jsDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatNumber(numStr: string): string {
    if (!numStr) return '';
    const num = Number(numStr);
    if (isNaN(num)) return numStr;

    if (Number.isInteger(num)) return num.toLocaleString();

    return Number.parseFloat(num.toFixed(2)).toString();
  }

  getChange(row: any): string {
    const current = Number(row.metricValues[0].value);
    const previous = Number(row.metricValues[0].comparisonValue);

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
