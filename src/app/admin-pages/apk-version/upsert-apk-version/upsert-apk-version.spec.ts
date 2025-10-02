import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertApkVersion } from './upsert-apk-version';

describe('UpsertApkVersion', () => {
  let component: UpsertApkVersion;
  let fixture: ComponentFixture<UpsertApkVersion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertApkVersion]
    })
      .compileComponents();

    fixture = TestBed.createComponent(UpsertApkVersion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});