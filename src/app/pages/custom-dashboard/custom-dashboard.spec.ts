import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CustomDashboard } from './custom-dashboard';

describe('CustomDashboard', () => {
  let component: CustomDashboard;
  let fixture: ComponentFixture<CustomDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
