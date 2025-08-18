import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- add this
import { CommonModule } from '@angular/common'; // <-- needed for *ngIf
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], // <-- include both
  template: `
    <h2>Login</h2>
    <form (ngSubmit)="submit()">
      <input [(ngModel)]="email" name="email" placeholder="email" required />
      <input
        [(ngModel)]="password"
        name="password"
        type="password"
        placeholder="password"
        required
      />
      <button>Login</button>
      <p style="color:red" *ngIf="error">{{ error }}</p>
    </form>
  `,
})
export class LoginComponent {
  email = 'admin@example.com';
  password = 'ChangeMeNow!';
  error = '';
  constructor(private auth: AuthService, private router: Router) {}
  submit() {
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/account']),
      error: (e) => (this.error = e?.error?.message ?? 'Login failed'),
    });
  }
}
