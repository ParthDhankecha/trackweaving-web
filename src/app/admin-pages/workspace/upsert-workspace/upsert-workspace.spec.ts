import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertWorkspace } from './upsert-workspace';

describe('UpsertWorkspace', () => {
  let component: UpsertWorkspace;
  let fixture: ComponentFixture<UpsertWorkspace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertWorkspace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertWorkspace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
