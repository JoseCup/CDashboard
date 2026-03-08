import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {

    return this.http.get<any>('/api/auth/me', { withCredentials: true }).pipe(
      map(user => {

      if (
        state.url.startsWith('/admin') &&
        user.platformRole !== 'ADMIN' &&
        user.platformRole !== 'DESIGNER'
      ) {
        this.router.navigate(['/account']);
        return false;
      }

      return true;

    }),

      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
