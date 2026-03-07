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

  // {
  //   path: 'admin/companies',
  //   canActivate: [AuthGuard],
  //   loadComponent: () =>
  //     import('./admin/companies/companies')
  //       .then(m => m.CompaniesComponent)
  // },
{
  path: 'admin/companies',
  loadComponent: () =>
    import('./admin/companies/companies-list/companies-list')
      .then(m => m.CompaniesListComponent)
},
{
  path: 'admin/companies/:companyId/campaigns',
  loadComponent: () =>
    import('./campaigns/campaign-list/campaign-list')
      .then(m => m.CampaignListComponent)
},
{
  path: 'admin/companies/:companyId/users',
  loadComponent: () =>
    import('./admin/companies/company-users/company-users')
      .then(m => m.CompanyUsersComponent)
},
{
  path: 'admin/companies/:companyId',
  loadComponent: () =>
    import('./admin/companies/company-detail/company-detail')
      .then(m => m.CompanyDetailComponent)
},
{
  path: 'campaigns',
  loadComponent: () =>
    import('./campaigns/campaign-list/campaign-list')
      .then(m => m.CampaignListComponent)
},
  // safety net
  // FIXME Redirect to decorated 404 page instead of home 
  {
    path: '**',
    redirectTo: ''
  }
];
