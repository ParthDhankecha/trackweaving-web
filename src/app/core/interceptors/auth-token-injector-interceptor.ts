import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ROUTES } from '@src/app/constants/app.routes';
import StorageKeys from '@src/app/constants/storage-keys';
import { CoreFacadeService } from '../services/core-facade-service';


export const authTokenInjectorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const _coreService = inject(CoreFacadeService);

  // For manufacturer portal API routes, use the manufacturer token
  const isManufacturerRoute = req.url.includes('/manufacturer/');
  const manufacturerToken = localStorage.getItem(StorageKeys.MANUFACTURER_TOKEN);
  const accessToken = localStorage.getItem(StorageKeys.ACCESS_TOKEN);

  const token = (isManufacturerRoute && manufacturerToken) ? manufacturerToken : accessToken;

  if (token && typeof token === 'string') {
    req = req.clone({
      headers: req.headers.append('Authorization', token)
    });
  }


  return next(req).pipe(tap({
    error: (err) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          if (isManufacturerRoute && _coreService.utils.isManufacturerAuthenticated) {
            _coreService.utils.logoutManufacturer();
          } else if (!isManufacturerRoute && (_coreService.utils.isAuthenticated || req.url.includes(`/${ROUTES.AUTH.BASE}/`))) {
            _coreService.utils.logout();
          }
        }
      }
    }
  }));
};