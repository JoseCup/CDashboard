import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignVersionComponent } from '../campaign-version/campaign-version';

import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CampaignVersionComponent],
  templateUrl: './campaign-detail.html',
  styleUrl: './campaign-detail.css'
})
export class CampaignDetailComponent implements OnInit {

  campaignId!: number;
  companyId!: number;

  campaign: any = null;
  versions: any[] = [];
  comments: any[] = [];

  newComment = '';

  isPlatformAdmin = false;
  isPlatformDesigner = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private auth: AuthService
  ) { }

  ngOnInit() {

    this.companyId = Number(this.route.snapshot.paramMap.get('companyId'));
    this.campaignId = Number(this.route.snapshot.paramMap.get('campaignId'));

    this.auth.loadUser().subscribe(user => {
      this.isPlatformAdmin = user?.platformRole === 'ADMIN';
      this.isPlatformDesigner = user?.platformRole === 'DESIGNER';

      this.loadCampaign();
    });

  }

  loadCampaign() {

    this.http
      .get<any>(`/api/campaigns/${this.campaignId}`, { withCredentials: true })
      .subscribe(data => {

        this.campaign = data.campaign;
        this.versions = data.versions;
        this.comments = data.comments;

      });

  }

  addComment() {

    if (!this.newComment.trim()) return;

    this.http
      .post(
        `/api/campaigns/${this.campaignId}/comments`,
        { message: this.newComment },
        { withCredentials: true }
      )
      .subscribe(() => {

        this.newComment = '';
        this.loadCampaign();

      });

  }

  approveCampaign() {

    this.http
      .post(
        `/api/campaigns/${this.campaignId}/approve`,
        {},
        { withCredentials: true }
      )
      .subscribe(() => this.loadCampaign());

  }

uploadVersion(formData: FormData) {

  this.http.post(
    `/api/campaigns/${this.campaignId}/upload`,
    formData,
    { withCredentials: true }
  )
  .subscribe(() => this.loadCampaign());

}

updateDropbox(link: string) {

  this.http.post(
    `/api/campaigns/${this.campaignId}/dropbox`,
    { dropboxLink: link },
    { withCredentials: true }
  )
  .subscribe(() => this.loadCampaign());

}

}