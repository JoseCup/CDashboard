import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'account',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./account/account').then(m => m.AccountComponent)
  },
  {
    path: 'admin/companies',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./admin/companies/companies')
        .then(m => m.CompaniesComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login')
        .then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: '/account',
    pathMatch: 'full'
  }
];
