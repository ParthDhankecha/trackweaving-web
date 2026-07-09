import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';


@Component({
  selector: 'app-manufacturer-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './manufacturer-layout.html',
  styleUrl: './manufacturer-layout.scss'
})
export class ManufacturerLayout {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);

  protected isSidebarCollapsed = false;

  protected readonly sidebarRoutes = [
    {
      label: 'Overview',
      link: ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.OVERVIEW),
      icon: 'overview'
    },
    {
      label: 'Machines',
      link: ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.MACHINES),
      icon: 'machine'
    },
    {
      label: 'Analytics',
      link: ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.ANALYTICS),
      icon: 'analytics'
    }
  ];

  get manufacturerInfo(): any {
    return this._coreService.utils.manufacturerInfo;
  }

  protected logout(): void {
    this._apiFs.manufacturerPortal.logout();
    this._coreService.utils.logoutManufacturer();
  }
}
