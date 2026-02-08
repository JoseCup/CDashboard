import { Component, OnInit, Input } from '@angular/core';
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

  @Input() companyId!: number;

  users: any[] = [];
  showAddUser = false;
  newUserEmail = '';
  firstName = '';
  lastName = '';
  password = '';
  newUserRole = 'user';

  isPlatformAdmin = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.auth.loadUser().subscribe(user => {
      this.isPlatformAdmin = user?.role === 'platform_admin';
      if (this.companyId) {
        this.loadUsers();
      }
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
  updateUserRole(user: any) {
  this.http.post(
    `/api/admin/companies/${this.companyId}/users`,
    {
      email: user.email,
      role: user.role
    },
    { withCredentials: true }
  ).subscribe(() => this.loadUsers());
}


  addUserAsPlatformAdmin() {
    this.http.post(
      `/api/admin/companies/${this.companyId}/users`,
      {
        email: this.newUserEmail,
        firstName: this.firstName,
        lastName: this.lastName,
        password: this.password,
        role: this.newUserRole
      },
      { withCredentials: true }
    ).subscribe(() => {
      this.newUserEmail = '';
      this.firstName = '';
      this.lastName = '';
      this.password = '';
      this.newUserRole = 'user';
      this.loadUsers();
    });
  }

  removeUser(userId: number) {
    this.http.delete(
      `/api/admin/companies/${this.companyId}/users/${userId}`,
      { withCredentials: true }
    ).subscribe(() => this.loadUsers());
  }
}
