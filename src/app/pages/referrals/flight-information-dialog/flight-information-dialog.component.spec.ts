import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightInformationDialogComponent } from './flight-information-dialog.component';

describe('FlightInformationDialogComponent', () => {
  let component: FlightInformationDialogComponent;
  let fixture: ComponentFixture<FlightInformationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightInformationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightInformationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
