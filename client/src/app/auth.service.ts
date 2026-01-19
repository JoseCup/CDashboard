// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, tap } from 'rxjs';

export type Me = { id: number; email: string; role: string; name?: string };

// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<Me | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadUser(): Observable<Me | null> {
    if (this.userSubject.value) {
      return of(this.userSubject.value);
    }

    return this.http
      .get<Me>('/api/auth/me', { withCredentials: true })
      .pipe(tap(user => this.userSubject.next(user)));
  }

  login(email: string, password: string) {
    return this.http
      .post('/api/auth/login', { email, password }, { withCredentials: true })
      .pipe(tap(() => this.userSubject.next(null)));
  }

  logout() {
    return this.http
      .post('/api/auth/logout', {}, { withCredentials: true })
      .pipe(tap(() => this.clearUser()));
  }

  get user() {
    return this.userSubject.value;
  }

  clearUser() {
    this.userSubject.next(null);
  }
}
