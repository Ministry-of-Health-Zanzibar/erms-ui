import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export type DatePickerValue = Date | string | null;

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Choose a date';
  @Input() icon = 'event';
  @Input() min: DatePickerValue = null;
  @Input() max: DatePickerValue = null;
  @Input() dateFilter: (date: Date | null) => boolean = () => true;
  @Input() allowClear = true;
  @Input() outputFormat: 'date' | 'iso' = 'date';

  @Output() valueChange = new EventEmitter<DatePickerValue>();

  value: DatePickerValue = null;
  disabled = false;

  get minDate(): Date | null {
    return this.asDate(this.min);
  }

  get maxDate(): Date | null {
    return this.asDate(this.max);
  }

  private onChange: (value: DatePickerValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: DatePickerValue | undefined): void {
    this.value = value ?? null;
  }

  registerOnChange(onChange: (value: DatePickerValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  updateValue(value: DatePickerValue): void {
    const emittedValue = this.outputFormat === 'iso' && value instanceof Date
      ? this.toIsoDate(value)
      : value;

    this.value = value;
    this.onChange(emittedValue);
    this.valueChange.emit(emittedValue);
  }

  markAsTouched(): void {
    this.onTouched();
  }

  clearValue(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateValue(null);
    this.markAsTouched();
  }

  private toIsoDate(value: Date): string {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  private asDate(value: DatePickerValue): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
