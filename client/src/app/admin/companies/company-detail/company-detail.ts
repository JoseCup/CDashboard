import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { CompanyUsersComponent } from '../company-users/company-users';
import { Campaign } from '../../../models/campaign.model';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CompanyUsersComponent],
  templateUrl: './company-detail.html',
  styleUrl: './company-detail.css',
})

export class CompanyDetailComponent implements OnInit {
  companyId!: number;

  company: any = null;
  users: any[] = [];
  campaigns: Campaign[] = [];

  showAddUser = false;

  newUserEmail = '';
  newUserRole = 'user';

  isPlatformAdmin = false;
  isPlatformDesigner = false;

  // Campaigns array to hold the company's campaigns

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute
  ) { }


  ngOnInit() {
    // this.companyId = this.route.snapshot.paramMap.get('companyId')!;
    this.companyId = Number(this.route.snapshot.paramMap.get('companyId')!);

    this.loadCompany();
    this.loadCampaigns();

    this.auth.loadUser().subscribe(user => {
      this.isPlatformAdmin = user?.platformRole === 'ADMIN';
      this.isPlatformDesigner = user?.platformRole === 'DESIGNER';
      this.loadCompany();
    });
  }

  // Campaign Loader
  loadCampaigns() {
  this.http
    .get<Campaign[]>(`/api/campaigns/company/${this.companyId}`, { withCredentials: true })
    .subscribe(data => {
      this.campaigns = data;
    });
}

  //  Load company
  loadCompany() {
    this.http
      .get<any>(`/api/admin/companies/${this.companyId}`, { withCredentials: true })
      .subscribe(data => {
        console.log('Company API response:', data);
        this.company = data;
      });
  }


  editingCompany: any = null;
  editedName = '';

  editCompany(company: any) {
    this.editingCompany = { ...company };
    this.editedName = company.name;
  }

  saveCompany() {
    if (!this.isPlatformAdmin) return;

    this.http
      .put(
        `/api/admin/companies/${this.companyId}`,
        {
          name: this.company.name,
          website: this.company.website,
          contactEmail: this.company.contactEmail
        },
        { withCredentials: true }
      )
      .subscribe({
        next: () => alert('Company updated'),
        error: err => alert(err?.error?.message || 'Update failed')
      });
  }
  loadUsers() {
    this.http
      .get<any[]>(
        `/api/admin/companies/${this.companyId}/users`,
        { withCredentials: true }
      )
      .subscribe(users => this.users = users);
  }


  addUser() {
  if (!this.newUserEmail) return;

  this.http
    .post(
      `/api/admin/companies/${this.companyId}/members`,
      {
        email: this.newUserEmail,
        role: this.newUserRole
      },
      { withCredentials: true }
    )
    .subscribe({
      next: () => {
        this.newUserEmail = '';
        this.newUserRole = 'user';
        this.showAddUser = false;
        this.loadUsers();
      },
      error: err => {
        alert(err?.error?.message || 'Failed to add user');
      }
    });
}

  updateUserRole(user: any) {
    this.http
      .post(
        `/api/admin/companies/${this.companyId}/users`,
        {
          email: user.email,
          role: user.role
        },
        { withCredentials: true }
      )
      .subscribe();
  }

  removeMember(userId: number) {
    if (!confirm('Remove this member from the company?')) return;

    this.http
      .delete(
        `/api/admin/companies/${this.companyId}/members/${userId}`,
        { withCredentials: true }
      )
      .subscribe(() => this.loadUsers());
  }


}
