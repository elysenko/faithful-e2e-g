import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Allows ADMIN users through; redirects everyone else to /recipes (or /login). */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/recipes']);
};
