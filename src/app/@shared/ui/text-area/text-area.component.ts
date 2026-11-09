import { FieldFeedbackComponent } from '../form-field/field-feedback.component';
import { FieldControlBridge } from '../form-field/field-control-bridge';
import { FormFieldDirective } from '../form-field/form-field.directive';
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

export type TextAreaValue = string | null;
export type TextAreaResize = 'none' | 'vertical' | 'horizontal' | 'both';

@Component({
  selector: 'app-text-area',
  standalone: true,
  imports: [
    FieldFeedbackComponent,
    FormFieldDirective,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './text-area.component.html',
  styleUrl: './text-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextAreaComponent),
      multi: true,
    },
  ],
})
export class TextAreaComponent extends FieldControlBridge implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() icon = '';
  @Input() rows = 3;
  @Input() maxlength: number | null = null;
  @Input() minlength: number | null = null;
  @Input() subscriptSizing: 'fixed' | 'dynamic' = 'dynamic';
  @Input() autocomplete = 'off';
  @Input() required = false;
  @Input() readonly = false;
  @Input() resize: TextAreaResize = 'vertical';

  @Output() readonly valueChange = new EventEmitter<TextAreaValue>();

  value: TextAreaValue = null;
  disabled = false;

  private onChange: (value: TextAreaValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: TextAreaValue | undefined): void {
    this.value = value ?? null;
    this.fieldChangeDetector.markForCheck();
  }

  registerOnChange(onChange: (value: TextAreaValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.fieldChangeDetector.markForCheck();
  }

  updateValue(value: string): void {
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  markAsTouched(): void {
    this.onTouched();
  }
}
