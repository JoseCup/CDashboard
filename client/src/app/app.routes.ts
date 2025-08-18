import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AccountComponent } from './account/account';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'account', component: AccountComponent },
  { path: '**', redirectTo: 'login' },
];
