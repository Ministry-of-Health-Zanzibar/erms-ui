import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
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
export class FlightInformationDialogComponent implements OnChanges {

  @Input() visible = false;
  @Input() referralId: number | null = null;
  @Input() flight: any | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  flightForm: FormGroup;
  submitting = false;

  constructor(private fb: FormBuilder) {
    this.flightForm = this.fb.group({
      airline: ['', Validators.required],
      flight_number: ['', Validators.required],
      arrival_airport: ['', Validators.required],
      arrival_date: ['', Validators.required],
      arrival_time: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true && changes['visible']?.previousValue !== true) {
      this.populate(this.flight);
      return;
    }

    if (changes['flight'] && this.visible) {
      this.populate(this.flight);
    }
  }

  get isEditing(): boolean {
    return !!this.flight?.referral_flight_id;
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
      ...(this.isEditing ? { referral_flight_id: this.flight.referral_flight_id } : {}),
      ...this.flightForm.getRawValue(),
    };

    this.saved.emit(data);
  }

  resetSubmissionState(): void {
    this.submitting = false;
  }

  reset(): void {
    this.populate(null);
  }

  private populate(flight: any | null): void {
    this.flightForm.reset({
      airline: flight?.airline || '',
      flight_number: flight?.flight_number || '',
      arrival_airport: flight?.arrival_airport || '',
      arrival_date: this.toDateInputValue(flight?.arrival_date),
      arrival_time: this.toTimeInputValue(flight?.arrival_time),
    });

    this.submitting = false;
  }

  private toDateInputValue(value: unknown): string {
    return value ? String(value).slice(0, 10) : '';
  }

  private toTimeInputValue(value: unknown): string {
    const match = value ? String(value).match(/\d{2}:\d{2}/) : null;
    return match?.[0] || '';
  }
}
