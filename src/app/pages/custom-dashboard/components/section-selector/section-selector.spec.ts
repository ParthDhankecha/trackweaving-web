import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionSelector } from './section-selector';

describe('SectionSelector', () => {
  let component: SectionSelector;
  let fixture: ComponentFixture<SectionSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
