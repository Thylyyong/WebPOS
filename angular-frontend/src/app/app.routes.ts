import { Routes } from '@angular/router';
import { SplashComponent } from './features/splash/splash.component';
import { PosComponent } from './features/pos/pos.component';
import { TablesComponent } from './features/tables/tables.component';
import { RegisterComponent } from './features/register/register.component';
import { AccountingComponent } from './features/accounting/accounting.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  { path: 'login', component: SplashComponent },
  { path: 'pos', component: PosComponent },
  { path: 'tables', component: TablesComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'accounting', component: AccountingComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
