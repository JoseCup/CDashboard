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

  // Load companies from server
  loadCompanies() {
    this.http.get<any[]>('/api/admin/companies')
      .subscribe(data => this.companies = data);
  }

  // Create new company
  createCompany() {
    if (!this.newCompany.trim()) return;

    this.http.post('/api/admin/companies', { name: this.newCompany },{ withCredentials: true }
    )
      .subscribe(() => {
        this.newCompany = '';
        this.loadCompanies();
      });
  }

  // Assign admin to company
  addAdmin(company: any) {
    if (!company.adminEmail) return;

    this.http.post(
      `/api/admin/companies/${company.id}/users`,
      {
        email: company.adminEmail,
        role: 'company_admin'
      },
      { withCredentials: true }
    ).subscribe({
      next: () => {
        company.adminEmail = '';
        alert('Company admin assigned');
      },
      error: () => alert('Failed to assign admin')
    });
  }

  // Add member to company
  addMember(company: any) {
  if (!company.newMemberEmail) return;

  this.http.post(
    `/api/companies/${company.id}/members`,
    {
      email: company.newMemberEmail,
      role: company.newMemberRole || 'user'
    },
    { withCredentials: true }
  ).subscribe({
    next: () => {
      company.newMemberEmail = '';
      alert('Member added');
    },
    error: err => {
      alert(err?.error?.message || 'Failed to add member');
    }
  });
}



}
