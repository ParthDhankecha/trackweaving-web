import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { UtmTrackerService } from './utm-tracker';
import StorageKeys from '@src/app/constants/storage-keys';


describe('UtmTrackerService', () => {
  let service: UtmTrackerService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
    service = TestBed.inject(UtmTrackerService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should capture UTM params from the initial URL and persist to sessionStorage', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?utm_source=google&utm_medium=cpc&utm_campaign=spring');

    service.startTracking();

    expect(service.getUtmParams()).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spring'
    });
    expect(sessionStorage.getItem(StorageKeys.SST.UTM_PARAMS)).toContain('google');
  });

  it('should keep first-touch UTMs when a later navigation has no UTM tags', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?utm_source=newsletter&utm_medium=email');
    service.startTracking();

    await router.navigateByUrl('/?ref=homepage');

    expect(service.getUtmParams()).toEqual({
      utm_source: 'newsletter',
      utm_medium: 'email'
    });
  });
});
