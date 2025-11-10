import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftWiseComments } from './shift-wise-comments';

describe('ShiftWiseComments', () => {
  let component: ShiftWiseComments;
  let fixture: ComponentFixture<ShiftWiseComments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiftWiseComments]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ShiftWiseComments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});