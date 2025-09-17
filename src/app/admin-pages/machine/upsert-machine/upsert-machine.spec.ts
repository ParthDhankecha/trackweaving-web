import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertMachine } from './upsert-machine';

describe('UpsertMachine', () => {
  let component: UpsertMachine;
  let fixture: ComponentFixture<UpsertMachine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertMachine]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UpsertMachine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});