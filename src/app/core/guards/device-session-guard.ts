import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '../services/core-facade-service';


/** WebView session (`setDeviceToken`) may only stay on `/device-report`. */
export const deviceSessionGuard: CanActivateFn = (_route, state) => {
  const utils = inject(CoreFacadeService).utils;
  if (!utils.isDeviceSession) return true;

  const path = state.url.split('?')[0];
  if (path === `/${ROUTES.DEVICE_REPORT}`) return true;

  return inject(Router).createUrlTree([`/${ROUTES.DEVICE_REPORT}`]);
};

/** Block leaving `/device-report` (including browser back/forward). */
export const stayOnDeviceReportGuard: CanDeactivateFn<unknown> = (_component, currentRoute) => {
  return !currentRoute.data['isDevice'];
};