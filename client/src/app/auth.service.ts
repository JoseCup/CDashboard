import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

export type Me = { id: number; email: string; role: 'admin' | 'client' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = '/api';
  private _me$ = new BehaviorSubject<Me | null>(null);
  me$ = this._me$.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post(`${this.base}/login`, { email, password })
      .pipe(tap(() => this.refreshMe().subscribe()));
  }
  refreshMe() {
    return this.http.get<Me>(`${this.base}/me`).pipe(tap((me) => this._me$.next(me)));
  }
  logout() {
    return this.http.post(`${this.base}/logout`, {}).pipe(tap(() => this._me$.next(null)));
  }
}
