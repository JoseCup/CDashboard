import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { AccountComponent } from './account/account';
import { HomeComponent } from './home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'account', component: AccountComponent },
  { path: '**', redirectTo: '' },
];
