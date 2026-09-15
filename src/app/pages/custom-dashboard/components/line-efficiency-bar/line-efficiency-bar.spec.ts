import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineEfficiencyBar } from './line-efficiency-bar';

describe('LineEfficiencyBar', () => {
  let component: LineEfficiencyBar;
  let fixture: ComponentFixture<LineEfficiencyBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineEfficiencyBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineEfficiencyBar);
    component = fixture.componentInstance;
    component.line = { lineKey: 'line 1', efficiency: 90, performance: 'excellent' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
