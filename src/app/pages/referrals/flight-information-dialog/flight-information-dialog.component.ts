import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-flight-information-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  templateUrl: './flight-information-dialog.component.html',
  styleUrls: ['./flight-information-dialog.component.scss']
})
export class FlightInformationDialogComponent {

  @Input() visible = false;
  @Input() referralId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  flightForm: FormGroup;
  submitting = false;

  constructor(private fb: FormBuilder) {

    this.flightForm = this.fb.group({

      airline: ['', Validators.required],
      flight_number: ['', Validators.required],

      departure_airport: [''],
      departure_city: [''],

      arrival_airport: ['', Validators.required],
      arrival_city: [''],

      departure_date: [''],
      departure_time: [''],

      arrival_date: ['', Validators.required],
      arrival_time: ['', Validators.required],

      seat_number: [''],
      booking_reference: [''],

      travel_class: ['Economy'],
      notes: ['']

    });
  }

  get f() {
    return this.flightForm.controls;
  }

  close(): void {
    if (this.submitting) {
      return;
    }

    this.closed.emit();
  }

  submit(): void {

    if (this.flightForm.invalid) {
      this.flightForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const data = {
      referral_id: this.referralId,
      ...this.flightForm.value
    };

    this.saved.emit(data);
  }

  reset(): void {

    this.flightForm.reset({
      airline: '',
      flight_number: '',
      departure_airport: '',
      departure_city: '',
      arrival_airport: '',
      arrival_city: '',
      departure_date: '',
      departure_time: '',
      arrival_date: '',
      arrival_time: '',
      seat_number: '',
      booking_reference: '',
      travel_class: 'Economy',
      notes: ''
    });

    this.submitting = false;
  }
}