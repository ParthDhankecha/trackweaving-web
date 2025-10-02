import { TestBed } from '@angular/core/testing';

import { ApkVersion } from './apk-version';

describe('ApkVersion', () => {
  let service: ApkVersion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApkVersion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});