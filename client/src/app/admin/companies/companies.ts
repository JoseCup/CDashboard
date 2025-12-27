import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './companies.html',
})

export class CompaniesComponent implements OnInit {
  companies: any[] = [];
  newCompany = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.http.get<any[]>('/api/admin/companies')
      .subscribe(data => this.companies = data);
  }

  createCompany() {
    if (!this.newCompany.trim()) return;

    this.http.post('/api/admin/companies', { name: this.newCompany },{ withCredentials: true }
    )
      .subscribe(() => {
        this.newCompany = '';
        this.loadCompanies();
      });
  }
}
