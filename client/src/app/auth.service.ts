// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, tap, } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Me {
  userId: number;
  email: string;
  companyId: number | null;
  role: string | null;
  isPlatformAdmin: boolean;
}


// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<Me | null>(null);
  user$ = this.userSubject.asObservable();

  isLoggedIn$ = this.user$.pipe(
    map(user => !!user)
  );

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
      .pipe(
        tap(() => this.userSubject.next(null)) // triggers reload via guard/app init
      );
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
