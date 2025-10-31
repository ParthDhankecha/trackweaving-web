import { TestBed } from '@angular/core/testing';

import { MachineGroup } from './machine-group';

describe('MachineGroup', () => {
  let service: MachineGroup;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MachineGroup);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});