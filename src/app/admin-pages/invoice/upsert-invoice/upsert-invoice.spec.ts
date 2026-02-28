import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertInvoice } from './upsert-invoice';

describe('UpsertInvoice', () => {
  let component: UpsertInvoice;
  let fixture: ComponentFixture<UpsertInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
