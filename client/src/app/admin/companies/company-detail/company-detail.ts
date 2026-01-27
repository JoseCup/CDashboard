import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './company-detail.html',
  styleUrl: './company-detail.css',
})

export class CompanyDetailComponent implements OnInit {
  companyId!: string;
  company: any;
  isPlatformAdmin = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute
  ) { }


  ngOnInit() {
    this.companyId = this.route.snapshot.paramMap.get('companyId')!;

    this.auth.loadUser().subscribe(user => {
      this.isPlatformAdmin = user?.role === 'platform_admin';
      this.loadCompany();
    });
  }


  //  Load company
  loadCompany() {
    this.http.get<any>(`/api/admin/companies/${this.companyId}`, { withCredentials: true })
      .subscribe(data => this.company = data);
  }

  editingCompany: any = null;
  editedName = '';

  editCompany(company: any) {
    this.editingCompany = { ...company };
    this.editedName = company.name;
  }

  saveEdit() {
    if (!this.isPlatformAdmin) return;
    
    const id = this.editingCompany.id;
    this.http.put(`/api/admin/companies/${id}`, { name: this.editedName }, { withCredentials: true })
      .subscribe({
        next: () => {
          this.editingCompany = null;
          this.loadCompany();
        },
        error: err => alert(err?.error?.message || 'Failed to update company')
      });
  }

}
