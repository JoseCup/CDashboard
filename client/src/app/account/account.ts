import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 👈 add this
import { AuthService, Me } from '../auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule], // 👈  tell Angular you want ngIf, etc.
  templateUrl: './account.html',
})
export class AccountComponent {
  me$!: Observable<Me | null>;
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.me$ = this.auth.me$;
    this.auth.refreshMe().subscribe({ error: () => {} });
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
