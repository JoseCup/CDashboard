import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { Campaign } from '../../../models/campaign.model';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './company-detail.html',
  styleUrl: './company-detail.css',
})

export class CompanyDetailComponent implements OnInit {

  companyId!: number;

  company: any = null;
  members: any[] = [];
  campaigns: Campaign[] = [];

  isPlatformAdmin = false;
  isPlatformDesigner = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {

    this.companyId = Number(this.route.snapshot.paramMap.get('companyId'));

    this.auth.loadUser().subscribe(user => {

      this.isPlatformAdmin = user?.platformRole === 'ADMIN';
      this.isPlatformDesigner = user?.platformRole === 'DESIGNER';

      this.loadCompany();
      this.loadMembers();
      this.loadCampaigns();

    });

  }

  // Load company info
  loadCompany() {

    this.http
      .get<any>(`/api/admin/companies/${this.companyId}`, { withCredentials: true })
      .subscribe(data => {
        this.company = data;
      });

  }

  // Load members of company
  loadMembers() {

    this.http
      .get<any[]>(`/api/admin/companies/${this.companyId}/users`, { withCredentials: true })
      .subscribe(data => {
        this.members = data;
      });

  }

  // Load campaigns
  loadCampaigns() {

    this.http
      .get<Campaign[]>(`/api/campaigns/company/${this.companyId}`, { withCredentials: true })
      .subscribe(data => {
        this.campaigns = data;
      });

  }

  // Remove member (platform admin only)
  removeMember(userId: number) {

    if (!confirm('Remove this member from the company?')) return;

    this.http
      .delete(`/api/admin/companies/${this.companyId}/users/${userId}`, { withCredentials: true })
      .subscribe(() => this.loadMembers());

  }

}