import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceEntry } from './maintenance-entry';

describe('MaintenanceEntry', () => {
  let component: MaintenanceEntry;
  let fixture: ComponentFixture<MaintenanceEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
