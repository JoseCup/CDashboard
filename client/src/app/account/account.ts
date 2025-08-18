import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- add this
import { AuthService, Me } from '../auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-account',
  standalone: true, // standalone component
  imports: [CommonModule], // <-- tell Angular you want ngIf, etc.
  template: `
    <ng-container *ngIf="me$ | async as me; else loading">
      <h2>My Account</h2>
      <p><b>Email:</b> {{ me.email }}</p>
      <p><b>Role:</b> {{ me.role }}</p>
    </ng-container>
    <ng-template #loading>Loading…</ng-template>
  `,
})
export class AccountComponent {
  me$!: Observable<Me | null>;
  constructor(private auth: AuthService) {}
  ngOnInit() {
    this.me$ = this.auth.me$;
    this.auth.refreshMe().subscribe({ error: () => {} });
  }
}
