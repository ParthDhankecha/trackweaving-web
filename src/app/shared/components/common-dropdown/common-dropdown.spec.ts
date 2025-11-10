import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonDropdown } from './common-dropdown';


describe('CommonDropdown', () => {
  let component: CommonDropdown;
  let fixture: ComponentFixture<CommonDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonDropdown]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CommonDropdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});