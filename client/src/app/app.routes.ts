import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  //  ROOT → landing page (HomeComponent)
  {
    path: '',
    loadComponent: () =>
      import('./home/home').then(m => m.HomeComponent),
    pathMatch: 'full'
  },

  // ✅ legacy /home → redirect to /
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then(m => m.LoginComponent)
  },

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

  // optional: safety net
  {
    path: '**',
    redirectTo: ''
  }
];
