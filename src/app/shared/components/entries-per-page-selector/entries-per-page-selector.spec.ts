import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntriesPerPageSelector } from './entries-per-page-selector';

describe('EntriesPerPageSelector', () => {
  let component: EntriesPerPageSelector;
  let fixture: ComponentFixture<EntriesPerPageSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntriesPerPageSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntriesPerPageSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
