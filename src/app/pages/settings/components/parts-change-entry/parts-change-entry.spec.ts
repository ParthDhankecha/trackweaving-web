import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsChangeEntry } from './parts-change-entry';

describe('PartsChangeEntry', () => {
  let component: PartsChangeEntry;
  let fixture: ComponentFixture<PartsChangeEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartsChangeEntry]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PartsChangeEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});