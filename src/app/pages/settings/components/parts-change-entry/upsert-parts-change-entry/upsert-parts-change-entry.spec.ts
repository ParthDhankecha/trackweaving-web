import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertPartsChangeEntry } from './upsert-parts-change-entry';

describe('UpsertPartsChangeEntry', () => {
  let component: UpsertPartsChangeEntry;
  let fixture: ComponentFixture<UpsertPartsChangeEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertPartsChangeEntry]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UpsertPartsChangeEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});