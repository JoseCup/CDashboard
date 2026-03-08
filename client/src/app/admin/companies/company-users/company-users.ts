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

  userPendingRemoval: number | null = null; // temp state to track which user is being removed

  isPlatformAdmin = false;
  isPlatformDesigner = false;
  isCompanyAdmin = false;


  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  ngOnInit() {
    this.auth.loadUser().subscribe(user => {
      this.isPlatformAdmin = user?.platformRole === 'ADMIN';
      this.isPlatformDesigner = user?.platformRole === 'DESIGNER';
      if (this.companyId) {
        this.loadUsers();
      }
    });
  }

  // load users of current company and check if current user is company admin
  loadUsers() {
    this.http
      .get<any[]>(
        `/api/admin/companies/${this.companyId}/users`,
        { withCredentials: true }
      )
      .subscribe(users => {
        this.users = users;

        const currentEmail = this.auth.user?.email;

        // Platform admins implicitly have company admin powers
        this.isCompanyAdmin =
          this.isPlatformAdmin ||
          users.some(
            u => u.email === currentEmail && u.role === 'company_admin'
          );
      });
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

  // companyAdmin update copmany user details - not User account.
  updateCompanyUser(user: any) {
    this.http.post(
      `/api/admin/companies/${this.companyId}/users`,
      {
        email: user.email,
        firstName: this.firstName,
        lastName: this.lastName,
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

  confirmRemoveUser(user: any) {
    const label = user.email || 'this user';

    const confirmed = confirm(
      `Are you sure you want to remove ${label} from this company?\n\n` +
      `They will lose access immediately.`
    );

    if (!confirmed) return;

    this.removeUser(user.id);
  }

  isSelf(user: any): boolean {
    return user.email === this.auth.user?.email;
  }

}
