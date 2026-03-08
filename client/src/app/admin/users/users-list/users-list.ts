import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { User } from '../../../models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css'
})

export class UsersListComponent implements OnInit {

  users: User[] = [];

  newEmail = '';
  newFirst = '';
  newLast = '';
  newPassword = '';
  newRole = 'USER';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {

    this.http
      .get<User[]>('/api/admin/users', { withCredentials: true })
      .subscribe(data => this.users = data);

  }

  createUser() {

    this.http.post(
      '/api/admin/users',
      {
        email: this.newEmail,
        firstName: this.newFirst,
        lastName: this.newLast,
        password: this.newPassword,
        platformRole: this.newRole
      },
      { withCredentials: true }
    ).subscribe(() => {

      this.newEmail = '';
      this.newFirst = '';
      this.newLast = '';
      this.newPassword = '';

      this.loadUsers();

    });

  }

  deleteUser(id: number) {

    if (!confirm('Delete this user permanently?')) return;

    this.http
      .delete(`/api/admin/users/${id}`, { withCredentials: true })
      .subscribe(() => this.loadUsers());

  }

}