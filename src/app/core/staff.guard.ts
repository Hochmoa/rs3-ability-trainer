import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

/**
 * Only signed-in staff may open /admin; the database checks every action again.
 * Lives outside the admin page so the routes do not pull that page into the initial bundle.
 */
export const staffGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  // wait for the session lookup and the profile (role) to arrive
  for (let i = 0; i < 50 && (!supabase.ready() || (supabase.user() && !supabase.profile())); i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return supabase.isStaff() ? true : router.createUrlTree(['/']);
};
