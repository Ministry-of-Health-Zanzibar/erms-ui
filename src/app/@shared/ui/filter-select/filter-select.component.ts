import { FieldFeedbackComponent } from '../form-field/field-feedback.component';
import { FieldControlBridge } from '../form-field/field-control-bridge';
import { FormFieldDirective } from '../form-field/form-field.directive';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { SearchableSelectDirective } from './searchable-select.directive';

export type FilterSelectValue = unknown;

export interface FilterSelectOption {
  label: string;
  value: unknown;
}

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [
    FieldFeedbackComponent,
    FormFieldDirective,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    SearchableSelectDirective,
  ],
  templateUrl: './filter-select.component.html',
  styleUrl: './filter-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterSelectComponent),
      multi: true,
    },
  ],
})
export class FilterSelectComponent extends FieldControlBridge implements ControlValueAccessor {
  @Input() label = 'Select option';
  @Input() placeholder = 'All options';
  @Input() icon = 'filter_alt';
  @Input() options: readonly any[] = [];
  @Input() optionLabelKey = '';
  @Input() optionValueKey = '';
  @Input() emptyValue: FilterSelectValue = null;
  @Input() multiple = false;
  @Input() searchable = true;
  @Input() remoteSearch = false;
  @Input() allowDeselect = true;

  @Output() selectionChange = new EventEmitter<FilterSelectValue>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() openedChange = new EventEmitter<boolean>();

  value: FilterSelectValue = null;
  disabled = false;
  searchTerm = '';

  private onChange: (value: FilterSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: FilterSelectValue): void {
    this.value = value;
    this.fieldChangeDetector.markForCheck();
  }

  registerOnChange(onChange: (value: FilterSelectValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.fieldChangeDetector.markForCheck();
  }

  updateValue(value: FilterSelectValue): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit(value);
  }

  markAsTouched(): void {
    this.onTouched();
  }

  updateSearch(term: string): void {
    this.searchTerm = term;
    this.searchChange.emit(this.searchTerm);
  }

  get filteredOptions(): readonly FilterSelectOption[] {
    // Retain option instances while filtering so selected values are never lost.
    return this.normalizedOptions;
  }

  private get normalizedOptions(): FilterSelectOption[] {
    return (this.options ?? []).map((option: any) => ({
      label: this.optionLabelKey
        ? String(option?.[this.optionLabelKey] ?? '')
        : String(option?.label ?? option ?? ''),
      value: this.optionValueKey
        ? option?.[this.optionValueKey]
        : (this.optionLabelKey
          ? option
          : (option && Object.prototype.hasOwnProperty.call(option, 'value') ? option.value : option)),
    }));
  }

  get hasValue(): boolean {
    if (Array.isArray(this.value)) {
      return this.value.length > 0;
    }

    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  clearSelection(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const value = this.multiple ? [] : this.emptyValue;
    this.updateValue(value);
  }

  handleOpenedChange(opened: boolean): void {
    this.openedChange.emit(opened);

    this.searchTerm = '';
    if (!opened) this.markAsTouched();
  }
}
