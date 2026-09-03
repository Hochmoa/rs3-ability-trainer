import { Routes } from '@angular/router';
import { Keybinds } from './pages/keybinds/keybinds';
import { Rotations } from './pages/rotations/rotations';
import { Settings } from './pages/settings/settings';
import { Train } from './pages/train/train';

export const routes: Routes = [
  { path: '', component: Train, title: 'RS3 Ability Trainer' },
  { path: 'rotations', component: Rotations, title: 'Rotations – RS3 Ability Trainer' },
  { path: 'keybinds', component: Keybinds, title: 'Keybinds – RS3 Ability Trainer' },
  { path: 'settings', component: Settings, title: 'Settings – RS3 Ability Trainer' },
  { path: '**', redirectTo: '' },
];
