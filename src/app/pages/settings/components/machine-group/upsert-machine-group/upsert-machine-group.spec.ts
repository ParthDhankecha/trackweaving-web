import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertMachineGroup } from './upsert-machine-group';

describe('UpsertMachineGroup', () => {
  let component: UpsertMachineGroup;
  let fixture: ComponentFixture<UpsertMachineGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertMachineGroup]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UpsertMachineGroup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});