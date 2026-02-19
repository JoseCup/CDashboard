import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { CompanyListItem } from '../../../models/company.model';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './companies-list.html',
  styleUrl: './companies-list.css',
})
export class CompaniesListComponent implements OnInit {
  companies: CompanyListItem[] = [];
  newCompany = '';
  isPlatformAdmin = false;
  isPlatformDesigner = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

ngOnInit() {
  this.auth.loadUser().subscribe(user => {
    this.isPlatformAdmin =  user?.platformRole === 'ADMIN';
    this.isPlatformDesigner = user?.platformRole === 'DESIGNER';

    console.log('User platform role:', user?.platformRole);
    console.log('Is Platform Admin:', this.isPlatformAdmin);
    console.log('Is Platform Designer:', this.isPlatformDesigner);

    if (this.isPlatformAdmin || this.isPlatformDesigner) {
      this.loadCompanies();
    }
  });
}

loadCompanies() {
  this.http
    .get<CompanyListItem[]>('/api/admin/companies', { withCredentials: true })
    .subscribe(data => this.companies = data);
}

  createCompany() {
    if (!this.newCompany.trim()) return;

    this.http
      .post('/api/admin/companies', { name: this.newCompany }, { withCredentials: true })
      .subscribe(() => {
        this.newCompany = '';
        this.loadCompanies();
      });
  }

  deleteCompany(id: number) {
    if (!this.isPlatformAdmin) {
      alert('You are not authorized to delete companies.');
      return;
    }

    if (confirm('Are you sure you want to delete this company?')) {
      this.http
        .delete(`/api/admin/companies/${id}`, { withCredentials: true })
        .subscribe(() => this.loadCompanies());
    }
  }
}
