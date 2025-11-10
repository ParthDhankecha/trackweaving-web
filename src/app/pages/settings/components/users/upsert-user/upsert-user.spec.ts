import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertUser } from './upsert-user';

describe('UpsertUser', () => {
  let component: UpsertUser;
  let fixture: ComponentFixture<UpsertUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertUser]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UpsertUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});