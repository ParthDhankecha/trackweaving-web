import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoppedMachineCard } from './stopped-machine-card';

describe('StoppedMachineCard', () => {
  let component: StoppedMachineCard;
  let fixture: ComponentFixture<StoppedMachineCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoppedMachineCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoppedMachineCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
