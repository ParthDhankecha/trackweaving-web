import { TestBed } from '@angular/core/testing';

import { ShiftWiseComments } from './shift-wise-comments';

describe('ShiftWiseComments', () => {
  let service: ShiftWiseComments;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShiftWiseComments);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});