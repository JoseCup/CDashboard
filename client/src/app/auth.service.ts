// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BehaviorSubject, tap } from 'rxjs';

export type Me = { id: number; email: string; role: string; name: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<any | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadUser(): Observable<any> {
    // If already loaded, reuse it
    if (this.userSubject.value) {
      return of(this.userSubject.value);
    }

    return this.http.get('/api/me', { withCredentials: true }).pipe(tap(user => this.userSubject.next(user))
    );
  }
  
  /** Login and set auth cookie */
  login(email: string, password: string): Observable<any> {
    return this.http.post(
      '/api/login',
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // clear cached user so loadUser refetches fresh data
        this.userSubject.next(null);
      })
    );
  }

  get user() {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  clearUser() {
    this.userSubject.next(null);
  }
}
