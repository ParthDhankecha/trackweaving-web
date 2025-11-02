import { TestBed } from '@angular/core/testing';

import { MachineConfigure } from './machine-configure';

describe('MachineConfigure', () => {
  let service: MachineConfigure;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MachineConfigure);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});