import { Routes } from '@angular/router';
import { Account } from './pages/account/account';
import { Admin, staffGuard } from './pages/admin/admin';
import { Bars } from './pages/bars/bars';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { Explore } from './pages/explore/explore';
import { Keybinds } from './pages/keybinds/keybinds';
import { Loadout } from './pages/loadout/loadout';
import { Privacy } from './pages/privacy/privacy';
import { Rotations } from './pages/rotations/rotations';
import { Settings } from './pages/settings/settings';
import { Train } from './pages/train/train';

export const routes: Routes = [
  { path: '', component: Train, title: 'RS3 Ability Trainer' },
  { path: 'rotations', component: Rotations, title: 'Rotations – RS3 Ability Trainer' },
  { path: 'bars', component: Bars, title: 'Action bars – RS3 Ability Trainer' },
  { path: 'keybinds', component: Keybinds, title: 'Keybinds – RS3 Ability Trainer' },
  { path: 'loadout', component: Loadout, title: 'Loadout – RS3 Ability Trainer' },
  { path: 'settings', component: Settings, title: 'Settings – RS3 Ability Trainer' },
  { path: 'explore', component: Explore, title: 'Explore – RS3 Ability Trainer' },
  { path: 'account', component: Account, title: 'Account – RS3 Ability Trainer' },
  { path: 'admin', component: Admin, canActivate: [staffGuard], title: 'Admin – RS3 Ability Trainer' },
  { path: 'auth/callback', component: AuthCallback, title: 'RS3 Ability Trainer' },
  { path: 'privacy', component: Privacy, title: 'Privacy – RS3 Ability Trainer' },
  { path: '**', redirectTo: '' },
];
