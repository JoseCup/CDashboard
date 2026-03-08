import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';


@Component({
  selector: 'app-company-members',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './company-members.html',
  styleUrl: './company-members.css',
})

export class CompanyMembersComponent implements OnInit {

  @Input() companyId!: number;

  members: any[] = [];

  isPlatformAdmin = false;
  isPlatformDesigner = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.auth.loadUser().subscribe(user => {
      this.isPlatformAdmin = user?.platformRole === 'ADMIN';
      this.isPlatformDesigner = user?.platformRole === 'DESIGNER';

      if (this.companyId) {
        this.loadMembers();
      }
    });
  }

  loadMembers() {
    this.http
      .get<any[]>(
        `/api/admin/companies/${this.companyId}/members`,
        { withCredentials: true }
      )
      .subscribe(data => {
        this.members = data;
      });
  }

  updateMemberRole(member: any) {
    this.http.patch(
      `/api/admin/companies/${this.companyId}/members/${member.id}`,
      { role: member.role },
      { withCredentials: true }
    ).subscribe(() => this.loadMembers());
  }

  removeMember(memberId: number) {
    if (!confirm('Remove this member from the company?')) return;

    this.http
      .delete(
        `/api/admin/companies/${this.companyId}/members/${memberId}`,
        { withCredentials: true }
      )
      .subscribe(() => this.loadMembers());
  }

}

