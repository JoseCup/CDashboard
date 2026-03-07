import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth.service';
import { Campaign } from '../../models/campaign.model';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './campaign-list.html',
  styleUrl: './campaign-list.css'
})
export class CampaignListComponent implements OnInit {

  campaigns: Campaign[] = [];

  companyName = '';

  companyId!: number;

  newCampaignTitle = '';

  isPlatformAdmin = false;
  isPlatformDesigner = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private auth: AuthService
  ) { }

ngOnInit() {

  this.auth.loadUser().subscribe(user => {

    const paramCompanyId = this.route.snapshot.paramMap.get('companyId');

    if (paramCompanyId) {
      this.companyId = Number(paramCompanyId);
    } else if (user?.companyId) {
      this.companyId = user.companyId;
    }

    console.log("Company ID:", this.companyId);

    this.isPlatformAdmin = user?.platformRole === 'ADMIN';
    this.isPlatformDesigner = user?.platformRole === 'DESIGNER';

    if (this.companyId) {
      this.loadCompany();
      this.loadCampaigns();
    }

  });

}

  loadCompany() {

    this.http
      .get<any>(`/api/companies/${this.companyId}`, { withCredentials: true })
      .subscribe(company => {

        this.companyName = company.name;

      });

  }

loadCampaigns() {
  this.http
    .get<Campaign[]>(`/api/campaigns/company/${this.companyId}`, { withCredentials: true })
    .subscribe(data => {
      this.campaigns = data;
    });
}

createCampaign() {
  if (!this.newCampaignTitle.trim()) return;

  this.http
    .post<Campaign>(
      `/api/campaigns/company/${this.companyId}`,
      { title: this.newCampaignTitle },
      { withCredentials: true }
    )
    .subscribe(() => {
      this.newCampaignTitle = '';
      this.loadCampaigns();
    });
}

}