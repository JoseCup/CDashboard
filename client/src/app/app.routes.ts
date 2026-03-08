import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [

  // PUBLIC
  {
    path: '',
    loadComponent: () =>
      import('./home/home').then(m => m.HomeComponent),
    pathMatch: 'full'
  },

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

  // AUTH REQUIRED
  {
    path: 'account',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./account/account').then(m => m.AccountComponent)
  },

  {
    path: 'company',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./companies/company-detail/company-detail')
        .then(m => m.CompanyDetailComponent)
  },

  {
    path: 'campaigns',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./campaigns/campaign-list/campaign-list')
        .then(m => m.CampaignListComponent)
  },

  // ADMIN AREA
  {
    path: 'admin/users',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./admin/users/users-list/users-list')
        .then(m => m.UsersListComponent)
  },

  {
    path: 'admin/companies',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./companies/companies-list/companies-list')
        .then(m => m.CompaniesListComponent)
  },

  {
    path: 'admin/companies/:companyId',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./companies/company-detail/company-detail')
        .then(m => m.CompanyDetailComponent)
  },

  {
    path: 'admin/companies/:companyId/users',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./companies/company-members/company-members')
        .then(m => m.CompanyMembersComponent)
  },
  {
    path: 'admin/companies/:companyId/campaigns',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./campaigns/campaign-list/campaign-list')
        .then(m => m.CampaignListComponent)
  },
  {
  path: 'companies/:companyId/campaigns/:campaignId',
  canActivate: [AuthGuard],
  loadComponent: () =>
    import('./campaigns/campaign-detail/campaign-detail')
      .then(m => m.CampaignDetailComponent)
},

{
  path: 'admin/companies/:companyId/campaigns/:campaignId',
  canActivate: [AuthGuard],
  loadComponent: () =>
    import('./campaigns/campaign-detail/campaign-detail')
      .then(m => m.CampaignDetailComponent)
},
  // fallback
  {
    path: '**',
    redirectTo: ''
  }

];