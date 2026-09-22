import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type FilterSelectValue = unknown;

export interface FilterSelectOption {
  label: string;
  value: unknown;
}

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
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
export class FilterSelectComponent implements ControlValueAccessor {
  @Input() label = 'Select option';
  @Input() placeholder = 'All options';
  @Input() icon = 'filter_alt';
  @Input() options: readonly any[] = [];
  @Input() optionLabelKey = '';
  @Input() optionValueKey = '';
  @Input() emptyValue: FilterSelectValue = null;
  @Input() multiple = false;
  @Input() searchable = true;
  @Input() allowDeselect = true;

  @Output() selectionChange = new EventEmitter<FilterSelectValue>();
  @Output() openedChange = new EventEmitter<boolean>();

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  value: FilterSelectValue = null;
  disabled = false;
  searchTerm = '';
  readonly searchOptionValue = Symbol('filter-select-search');

  private onChange: (value: FilterSelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: FilterSelectValue): void {
    this.value = value;
  }

  registerOnChange(onChange: (value: FilterSelectValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  updateValue(value: FilterSelectValue): void {
    if (value === this.searchOptionValue) {
      return;
    }

    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit(value);
  }

  markAsTouched(): void {
    this.onTouched();
  }

  updateSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  get filteredOptions(): readonly FilterSelectOption[] {
    const term = this.searchTerm.trim().toLowerCase();
    const options = this.normalizedOptions;

    if (!term) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
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

    if (opened) {
      this.searchTerm = '';
      setTimeout(() => this.searchInput?.nativeElement.focus());
      return;
    }

    this.searchTerm = '';
    this.markAsTouched();
  }
}
