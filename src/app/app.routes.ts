import { Routes } from '@angular/router';
import { staffGuard } from './core/staff.guard';
import { Train } from './pages/train/train';

// Only the Train page (the start page) is in the initial bundle; every other page is its own lazy chunk.
export const routes: Routes = [
  { path: '', component: Train, title: 'RS3 Ability Trainer' },
  { path: 'rotations', loadComponent: () => import('./pages/rotations/rotations').then((m) => m.Rotations), title: 'Rotations – RS3 Ability Trainer' },
  { path: 'bars', loadComponent: () => import('./pages/bars/bars').then((m) => m.Bars), title: 'Action bars – RS3 Ability Trainer' },
  { path: 'keybinds', loadComponent: () => import('./pages/keybinds/keybinds').then((m) => m.Keybinds), title: 'Keybinds – RS3 Ability Trainer' },
  { path: 'loadout', loadComponent: () => import('./pages/loadout/loadout').then((m) => m.Loadout), title: 'Loadout – RS3 Ability Trainer' },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings), title: 'Settings – RS3 Ability Trainer' },
  { path: 'explore', loadComponent: () => import('./pages/explore/explore').then((m) => m.Explore), title: 'Explore – RS3 Ability Trainer' },
  { path: 'setups', loadComponent: () => import('./pages/setups/setups').then((m) => m.Setups), title: 'Setups – RS3 Ability Trainer' },
  { path: 'presets', loadComponent: () => import('./pages/presets/presets').then((m) => m.Presets), title: 'Boss presets – RS3 Ability Trainer' },
  { path: 'account', loadComponent: () => import('./pages/account/account').then((m) => m.Account), title: 'Account – RS3 Ability Trainer' },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin), canActivate: [staffGuard], title: 'Admin – RS3 Ability Trainer' },
  { path: 'auth/callback', loadComponent: () => import('./pages/auth-callback/auth-callback').then((m) => m.AuthCallback), title: 'RS3 Ability Trainer' },
  { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy), title: 'Privacy – RS3 Ability Trainer' },
  { path: '**', redirectTo: '' },
];
