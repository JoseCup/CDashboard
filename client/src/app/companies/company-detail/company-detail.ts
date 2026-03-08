import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Campaign } from '../../models/campaign.model';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './company-detail.html',
  styleUrl: './company-detail.css'
})
export class CompanyDetailComponent implements OnInit {

  company: any = null;
  members: any[] = [];
  campaigns: Campaign[] = [];

  companyId!: number;

  isPlatformAdmin = false;
  isPlatformDesigner = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit() {

    this.auth.loadUser().subscribe(user => {

      const paramCompanyId = this.route.snapshot.paramMap.get('companyId');

      if (paramCompanyId) {
        this.companyId = Number(paramCompanyId);
      } else if (user?.companyId) {
        this.companyId = user.companyId;
      }

      this.isPlatformAdmin = user?.platformRole === 'ADMIN';
      this.isPlatformDesigner = user?.platformRole === 'DESIGNER';

      if (this.companyId) {
        this.loadCompany();
        this.loadMembers();
        this.loadCampaigns();
      }

    });

  }

  loadCompany() {

    this.http
      .get<any>(`/api/companies/${this.companyId}`, { withCredentials: true })
      .subscribe(data => {
        this.company = data;
      });

  }

  loadMembers() {

    if (this.isPlatformAdmin || this.isPlatformDesigner) {

      this.http
        .get<any[]>(`/api/admin/companies/${this.companyId}/users`, { withCredentials: true })
        .subscribe(data => {
          this.members = data;
        });

    } else {

      this.http
        .get<any[]>(`/api/companies/users`, { withCredentials: true })
        .subscribe(data => {
          this.members = data;
        });

    }

  }

  loadCampaigns() {

    this.http
      .get<Campaign[]>(`/api/campaigns/company/${this.companyId}`, { withCredentials: true })
      .subscribe(data => {
        this.campaigns = data;
      });

  }

  removeMember(userId: number) {

    if (!confirm('Remove this member from the company?')) return;

    this.http
      .delete(`/api/admin/companies/${this.companyId}/members/${userId}`, { withCredentials: true })
      .subscribe(() => this.loadMembers());

  }

}