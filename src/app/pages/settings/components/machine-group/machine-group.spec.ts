import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineGroup } from './machine-group';

describe('MachineGroup', () => {
  let component: MachineGroup;
  let fixture: ComponentFixture<MachineGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineGroup]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MachineGroup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});