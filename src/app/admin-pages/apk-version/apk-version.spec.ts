import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApkVersion } from './apk-version';

describe('ApkVersion', () => {
  let component: ApkVersion;
  let fixture: ComponentFixture<ApkVersion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApkVersion]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ApkVersion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});