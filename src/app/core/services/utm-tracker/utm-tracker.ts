import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, ParamMap, Router } from '@angular/router';
import { BehaviorSubject, filter, Observable } from 'rxjs';

import StorageKeys from '@src/app/constants/storage-keys';
import { IUtmParams, UTM_QUERY_KEYS, UtmQueryKey } from '@src/app/models/utm.model';


@Injectable({
  providedIn: 'root'
})
export class UtmTrackerService {
  private readonly router = inject(Router);
  private readonly rootRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly utmParamsSubject = new BehaviorSubject<IUtmParams | null>(null);
  private trackingStarted = false;

  /** Emits whenever session UTM params are loaded or updated. */
  readonly utmParams$: Observable<IUtmParams | null> = this.utmParamsSubject.asObservable();

  /**
   * Begin listening to router navigations and hydrate from sessionStorage.
   * Safe to call once at app bootstrap (idempotent).
   */
  startTracking(): void {
    if (this.trackingStarted) {
      return;
    }
    this.trackingStarted = true;

    this.hydrateFromSessionStorage();
    this.captureFromCurrentRoute();

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(
      () => this.captureFromCurrentRoute()
    );
  }

  /** Returns the UTM params stored for the current browser session, if any. */
  getUtmParams(): IUtmParams | null {
    return this.utmParamsSubject.value;
  }

  /** Clears stored UTM params (e.g. for tests or explicit reset). */
  clearUtmParams(): void {
    try {
      sessionStorage.removeItem(StorageKeys.SST.UTM_PARAMS);
    } catch {
      // sessionStorage unavailable (SSR, privacy mode, etc.)
    }
    this.utmParamsSubject.next(null);
  }

  private captureFromCurrentRoute(): void {
    const queryParams = this.getDeepestQueryParamMap(this.rootRoute.snapshot);
    const fromUrl = this.extractUtmParams(queryParams);
    if (!fromUrl) {
      return;
    }

    const existing = this.getUtmParams();
    if (existing && Object.keys(existing).length > 0) {
      // First-touch within the session: keep the original landing attribution.
      return;
    }

    this.persistUtmParams(fromUrl);
  }

  private getDeepestQueryParamMap(routeSnapshot: ActivatedRoute['snapshot']): ParamMap {
    let current = routeSnapshot;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current.queryParamMap;
  }

  private extractUtmParams(queryParamMap: ParamMap): IUtmParams | null {
    const params: Partial<Record<UtmQueryKey, string>> = {};

    for (const key of UTM_QUERY_KEYS) {
      const value = queryParamMap.get(key)?.trim();
      if (value) {
        params[key] = value;
      }
    }

    return Object.keys(params).length > 0 ? (params as IUtmParams) : null;
  }

  private hydrateFromSessionStorage(): void {
    try {
      const raw = sessionStorage.getItem(StorageKeys.SST.UTM_PARAMS);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as IUtmParams;
      if (parsed && typeof parsed === 'object') {
        this.utmParamsSubject.next(parsed);
      }
    } catch {
      this.clearUtmParams();
    }
  }

  private persistUtmParams(params: IUtmParams): void {
    try {
      sessionStorage.setItem(StorageKeys.SST.UTM_PARAMS, JSON.stringify(params));
    } catch {
      // Still expose in memory for the current tab when storage is blocked.
    }
    this.utmParamsSubject.next(params);
  }
}