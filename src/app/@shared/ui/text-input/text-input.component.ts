import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export type TextInputValue = string | number | null;

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
})
export class TextInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() icon = '';
  @Input() type = 'text';
  @Input() autocomplete = 'off';
  @Input() inputmode = '';
  @Input() required = false;
  @Input() readonly = false;
  @Input() min: string | number | null = null;
  @Input() max: string | number | null = null;
  @Input() step: string | number | null = null;
  @Input() allowClear = true;

  @Output() valueChange = new EventEmitter<TextInputValue>();

  value: TextInputValue = null;
  disabled = false;

  private onChange: (value: TextInputValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: TextInputValue | undefined): void {
    this.value = value ?? null;
  }

  registerOnChange(onChange: (value: TextInputValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  updateValue(value: string): void {
    const nextValue: TextInputValue = this.type === 'number' && value !== ''
      ? Number(value)
      : value;

    this.value = nextValue;
    this.onChange(nextValue);
    this.valueChange.emit(nextValue);
  }

  markAsTouched(): void {
    this.onTouched();
  }

  clearValue(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateValue('');
    this.markAsTouched();
  }
}
