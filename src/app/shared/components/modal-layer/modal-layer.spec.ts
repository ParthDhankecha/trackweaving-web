import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalLayer } from './modal-layer';

describe('ModalLayer', () => {
  let component: ModalLayer;
  let fixture: ComponentFixture<ModalLayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalLayer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalLayer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
