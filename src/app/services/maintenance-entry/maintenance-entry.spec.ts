import { TestBed } from '@angular/core/testing';

import { MaintenanceEntry } from './maintenance-entry';

describe('MaintenanceEntry', () => {
  let service: MaintenanceEntry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintenanceEntry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
