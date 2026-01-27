import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service'; 


@Component({
  selector: 'app-company-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './company-users.html',
  styleUrl: './company-users.css',
})
export class CompanyUsersComponent implements OnInit {
  companies: any[] = [];
  newCompany = '';
  isPlatformAdmin = false;

  constructor(private http: HttpClient, private auth: AuthService) { } // 👈 inject AuthService

  ngOnInit() {
    this.auth.loadUser().subscribe(user => {
      this.isPlatformAdmin = user?.role === 'platform_admin';
      this.loadCompanies();
    });
  }

  //  Load companies
  loadCompanies() {
    this.http.get<any[]>('/api/admin/companies', { withCredentials: true })
      .subscribe(data => this.companies = data);
  }

  //  Create new company
  createCompany() {
    if (!this.newCompany.trim()) return;

    this.http.post('/api/admin/companies', { name: this.newCompany }, { withCredentials: true })
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

  editingCompany: any = null;
  editedName = '';

  editCompany(company: any) {
    this.editingCompany = { ...company };
    this.editedName = company.name;
  }
  saveEdit() {
    const id = this.editingCompany.id;
    this.http.put(`/api/admin/companies/${id}`, { name: this.editedName }, { withCredentials: true })
      .subscribe({
        next: () => {
          this.editingCompany = null;
          this.loadCompanies();
        },
        error: err => alert(err?.error?.message || 'Failed to update company')
      });
  }

  deleteCompany(id: number) {
    if (!this.isPlatformAdmin) {
      alert('You are not authorized to delete companies.');
      return;
    }

    if (confirm('Are you sure you want to delete this company?')) {
      this.http.delete(`/api/admin/companies/${id}`, { withCredentials: true })
        .subscribe(() => this.loadCompanies());
    }
  }

  // 🔹 Add member to company
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
      error: err => alert(err?.error?.message || 'Failed to add member')
    });
  }
}
