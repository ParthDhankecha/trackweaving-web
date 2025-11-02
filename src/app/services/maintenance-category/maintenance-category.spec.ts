import { TestBed } from '@angular/core/testing';

import { MaintenanceCategory } from './maintenance-category';

describe('MaintenanceCategory', () => {
  let service: MaintenanceCategory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintenanceCategory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
