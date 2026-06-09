import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CoreFacadeService } from '../services/core-facade-service';
import { ROUTES } from '@src/app/constants/app.routes';


export const landingGuard: CanActivateFn = () => {
  const coreService = inject(CoreFacadeService);
  const router = inject(Router);

  if (coreService.utils.isAuthenticated) {
    router.navigateByUrl(`/${ROUTES.DASHBOARD}`);
    return false;
  }

  return true;
};
