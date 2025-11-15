import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account.html',
  styleUrls: ['./account.css'],

})
export class AccountComponent implements OnInit {
  stats: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('/api/stats').subscribe({
      next: (data) => (this.stats = data),
      error: (err) => (this.stats = err.error || { error: 'Unauthorized' }),
    });
  }

  // helper: GA dates come as "YYYYMMDD" (e.g. 20250818 → 2025-08-18)
  // account.component.ts
  formatDate(gaDate: string): string {
    if (!gaDate) return '';
    // GA4 date is YYYYMMDD → turn into YYYY-MM-DD
    const year = gaDate.substring(0, 4);
    const month = gaDate.substring(4, 6);
    const day = gaDate.substring(6, 8);
    const jsDate = new Date(`${year}-${month}-${day}`);
    return jsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    return Number.parseFloat(num.toFixed(2)).toString();
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

