import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Guard: only ADMINISTRATEUR can add vehicles */
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.canAddVehicle()) return true;
  router.navigate(['/dashboard']);
  return false;
};

/** Guard: only ADMINISTRATEUR or GERANT can view statistics */
export const statsGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.canAccessStats()) return true;
  router.navigate(['/dashboard']);
  return false;
};

/** Guard: only ADMINISTRATEUR or GERANT can manage users */
export const usersGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.canManageUsers()) return true;
  router.navigate(['/dashboard']);
  return false;
};
