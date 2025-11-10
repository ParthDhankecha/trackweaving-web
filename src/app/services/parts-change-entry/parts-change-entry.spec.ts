import { TestBed } from '@angular/core/testing';

import { PartsChangeEntry } from './parts-change-entry';

describe('PartsChangeEntry', () => {
  let service: PartsChangeEntry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartsChangeEntry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});