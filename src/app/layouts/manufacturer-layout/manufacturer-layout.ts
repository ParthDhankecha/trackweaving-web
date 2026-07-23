import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';
import { ApiFacadeService } from '@src/app/services/api-facade-service';
import { TrackWeavingLogo } from '@src/app/shared/components/track-weaving-logo/track-weaving-logo';


@Component({
  selector: 'app-manufacturer-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TrackWeavingLogo],
  templateUrl: './manufacturer-layout.html',
  styleUrl: './manufacturer-layout.scss'
})
export class ManufacturerLayout implements OnInit, OnDestroy {

  protected readonly _coreService = inject(CoreFacadeService);
  protected readonly _apiFs = inject(ApiFacadeService);
  private readonly _router = inject(Router);
  private routerSub?: Subscription;

  protected isSidebarCollapsed = false;
  private readonly dashboardPath = ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.DASHBOARD);
  private readonly reportsPath = ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.REPORT);


  ngOnInit(): void {
    this.syncSidebarForRoute(this._router.url);
    this.routerSub = this._router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => this.syncSidebarForRoute(event.urlAfterRedirects));
  }


  private syncSidebarForRoute(url: string): void {
    this.isSidebarCollapsed = url.startsWith(this.dashboardPath) || url.startsWith(this.reportsPath);
  }


  protected readonly sidebarRoutes = [
    {
      label: 'Overview',
      link: ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.OVERVIEW),
      icon: 'overview'
    },
    // {
    //   label: 'Machines',
    //   link: ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.MACHINES),
    //   icon: 'machine'
    // },
    {
      label: 'Analytics',
      link: ROUTES.MANUFACTURER.getFullRoute(ROUTES.MANUFACTURER.ANALYTICS),
      icon: 'analytics'
    }
  ];

  protected logout(): void {
    this._apiFs.manufacturerPortal.logout();
    this._coreService.utils.logoutManufacturer();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}