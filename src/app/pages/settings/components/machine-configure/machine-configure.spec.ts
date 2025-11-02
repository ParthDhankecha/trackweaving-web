import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineConfigure } from './machine-configure';

describe('MachineConfigure', () => {
  let component: MachineConfigure;
  let fixture: ComponentFixture<MachineConfigure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineConfigure]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineConfigure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
