import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceCategory } from './maintenance-category';

describe('MaintenanceCategory', () => {
  let component: MaintenanceCategory;
  let fixture: ComponentFixture<MaintenanceCategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceCategory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceCategory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
