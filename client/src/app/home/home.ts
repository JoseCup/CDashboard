import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.html',
})
export class HomeComponent {
  me: any;

  constructor(private http: HttpClient) {}

  checkMe() {
    this.http.get('/api/me', { withCredentials: true }).subscribe({
      next: (data) => (this.me = data),
      error: (err) => (this.me = err.error || { error: 'Unauthorized' }),
    });
  }
}
