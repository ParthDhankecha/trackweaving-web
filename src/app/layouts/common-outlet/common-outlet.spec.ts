import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonOutlet } from './common-outlet';

describe('CommonOutlet', () => {
  let component: CommonOutlet;
  let fixture: ComponentFixture<CommonOutlet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonOutlet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonOutlet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
