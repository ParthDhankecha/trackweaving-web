import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { ROUTES } from '@src/app/constants/app.routes';
import { CoreFacadeService } from '@src/app/core/services/core-facade-service';


@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout implements OnInit, OnDestroy {

  // Inject services
  protected readonly _coreService = inject(CoreFacadeService);
  private readonly _router = inject(Router);
  private _routerSub?: Subscription;


  protected readonly sidebarRoutes: { label: string, link: string, icon: string }[] = [
    {
      label: ROUTES.ADMIN.WORKSPACE,
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.WORKSPACE),
      icon: 'workspace'
    },
    {
      label: ROUTES.ADMIN.USER,
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.USER),
      icon: 'users'
    },
    {
      label: ROUTES.ADMIN.MACHINE,
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.MACHINE),
      icon: 'machine'
    },
    {
      label: ROUTES.ADMIN.INVOICE,
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.INVOICE),
      icon: 'invoice'
    },
    {
      label: 'APK Version',
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.APK_VERSION),
      icon: 'apk'
    },
    {
      label: 'Leads / CRM',
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.LEAD),
      icon: 'leads'
    },
    {
      label: 'Manufacturer',
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.MANUFACTURER),
      icon: 'manufacturer'
    },
    {
      label: 'Manufacturer Users',
      link: ROUTES.ADMIN.getFullRoute(ROUTES.ADMIN.MANUFACTURER_USER),
      icon: 'users'
    }
  ];
  isSidebarCollapsed: boolean = false;
  isMobileMenuOpen: boolean = false;


  ngOnInit(): void {
    this._routerSub = this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe(() => this.closeMobileMenu());
  }

  ngOnDestroy(): void {
    this._routerSub?.unsubscribe();
    document.body.style.overflow = '';
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.updateBodyScrollLock();
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.updateBodyScrollLock();
  }

  private updateBodyScrollLock(): void {
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
  }

  protected onSidebarHeaderClick(): void {
    if (window.matchMedia('(max-width: 767.98px)').matches) {
      return;
    }
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }


  protected logout(): void {
    this.closeMobileMenu();
    this._coreService.utils.logout();
  }
}