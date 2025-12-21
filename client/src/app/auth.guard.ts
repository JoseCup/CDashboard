import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.http.get('/api/me', { withCredentials: true }).pipe(
      map(() => true), // authenticated
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
