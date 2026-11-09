import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { TextInputComponent } from '../text-input/text-input.component';
import { FilterSelectComponent } from '../filter-select/filter-select.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { TextAreaComponent } from '../text-area/text-area.component';
import { FormFieldDirective } from './form-field.directive';
import { SearchableSelectDirective } from '../filter-select/searchable-select.directive';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    TextInputComponent, FilterSelectComponent, DatePickerComponent, TextAreaComponent, FormFieldDirective,
    SearchableSelectDirective],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted = submitted + 1">
      <app-text-input label="First name" formControlName="name" [allowClear]="false">
        <mat-error *ngIf="form.controls.name.hasError('required')">Enter the first name.</mat-error>
        <mat-hint *ngIf="showNameHint">Enter the patient's first name.</mat-hint>
      </app-text-input>
      <app-filter-select label="Role" formControlName="role" [options]="roles" />
      <app-date-picker label="Birth date" formControlName="birth" />
      <app-text-area label="Clinical notes" formControlName="notes" />
      <mat-form-field appFormField>
        <mat-label>Patient number</mat-label>
        <input matInput formControlName="number" (input)="nativeInputCalls = nativeInputCalls + 1" />
        <mat-error>Enter the patient number.</mat-error>
      </mat-form-field>
      <mat-form-field appFormField>
        <mat-label>Gender</mat-label>
        <mat-select appSearchableSelect formControlName="gender" (selectionChange)="nativeSelectCalls = nativeSelectCalls + 1">
          <mat-option value="Male">Male</mat-option><mat-option value="Female">Female</mat-option>
        </mat-select>
      </mat-form-field>
    </form>
  `,
})
class FieldHostComponent {
  roles = [{ label: 'Hospital user', value: 2 }];
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    role: new FormControl<number | null>(null, Validators.required),
    birth: new FormControl<Date | null>(null, Validators.required),
    notes: new FormControl('', Validators.required),
    number: new FormControl('', Validators.required),
    gender: new FormControl('', Validators.required),
  });
  nativeInputCalls = 0;
  nativeSelectCalls = 0;
  submitted = 0;
  showNameHint = true;
}

describe('Shared form-field validation', () => {
  let fixture: ComponentFixture<FieldHostComponent>;
  let host: FieldHostComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(FieldHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());

  function visibleErrors(): HTMLElement[] {
    return [...fixture.nativeElement.querySelectorAll('.ui-form-field__error, .mat-mdc-form-field-error')]
      .filter((element: HTMLElement) => !element.hidden &&
        !(element.matches('.mat-mdc-form-field-error') && element.closest('.ui-form-field__error')));
  }

  it('keeps validation hidden before interaction', () => {
    expect(visibleErrors().length).toBe(0);
    expect(host.form.invalid).toBeTrue();
  });

  it('shows errors on submission and clears them when the form is reset', fakeAsync(() => {
    const form = fixture.debugElement.query(By.css('form'));
    form.nativeElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(host.submitted).toBe(1);
    expect(visibleErrors().length).toBe(6);
    form.injector.get(FormGroupDirective).resetForm();
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(visibleErrors().length).toBe(0);
    flush();
  }));

  it('switches accessible descriptions between hints and errors without retaining hidden feedback', fakeAsync(() => {
    const field = fixture.nativeElement.querySelector('app-text-input');
    const input = field.querySelector('input');
    const hintId = field.querySelector('.ui-form-field__hint').id;
    const errorId = field.querySelector('.ui-form-field__error').id;
    const descriptions = () => (input.getAttribute('aria-describedby') || '').split(/\s+/);
    expect(descriptions()).toContain(hintId);
    host.form.controls.name.markAsTouched(); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(descriptions()).toContain(errorId);
    expect(descriptions()).not.toContain(hintId);
    host.form.controls.name.setValue('Ali'); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(descriptions()).toContain(hintId);
    expect(descriptions()).not.toContain(errorId);
    host.showNameHint = false; fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(descriptions()).not.toContain(hintId);
    flush();
  }));

  it('shows each required error below its input, select, textarea, or date field after touching the form', fakeAsync(() => {
    host.form.markAllAsTouched(); fixture.detectChanges(); flush(); fixture.detectChanges();
    const errors = visibleErrors();
    expect(errors.length).toBe(6);
    expect(errors.map((element) => element.textContent!.trim())).toEqual([
      'Enter the first name.', 'Role is required.', 'Birth date is required.',
      'Clinical notes is required.', 'Enter the patient number.', 'Gender is required.',
    ]);
    for (const error of errors) {
      const container = error.closest('mat-form-field') || error.closest('app-text-input, app-text-area, app-filter-select, app-date-picker')!;
      const field = container.querySelector('.mdc-text-field')!;
      expect(error.getBoundingClientRect().top).toBeGreaterThanOrEqual(field.getBoundingClientRect().bottom);
    }
  }));

  it('clears messages after valid programmatic updates and retains original value types', fakeAsync(() => {
    host.form.markAllAsTouched(); fixture.detectChanges(); flush(); fixture.detectChanges();
    const date = new Date(1990, 2, 4);
    host.form.setValue({ name: 'Ali', role: 2, birth: date, notes: 'Clinical note', number: '0012', gender: 'Male' });
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(host.form.valid).toBeTrue();
    expect(visibleErrors().length).toBe(0);
    expect(host.form.value.role).toBe(2);
    expect(host.form.value.birth).toBe(date);
    expect(host.form.value.number).toBe('0012');
    flush();
  }));

  it('keeps projected native input bindings and search/select handlers working', fakeAsync(() => {
    const input = fixture.nativeElement.querySelector('input[formcontrolname="number"]') as HTMLInputElement;
    input.value = '0012'; input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur')); fixture.detectChanges();
    expect(host.form.controls.number.value).toBe('0012');
    expect(host.nativeInputCalls).toBe(1);
    expect(visibleErrors().length).toBe(0);
    const select = fixture.debugElement.queryAll(By.directive(MatSelect))
      .map((element) => element.componentInstance as MatSelect).find((select) => select.ngControl?.name === 'gender')!;
    select.open(); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(document.querySelector('.ui-select-search input')).toBeTruthy();
    document.getElementById(select.options.first.id)!.click();
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(host.form.controls.gender.value).toBe('Male');
    expect(host.nativeSelectCalls).toBe(1);
  }));

  it('does not display unconditional custom errors when the field value is valid', fakeAsync(() => {
    host.form.controls.number.setValue('0012'); host.form.controls.number.markAsTouched();
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(visibleErrors().length).toBe(0);
  }));

  it('hides validation on disabled controls', fakeAsync(() => {
    host.form.markAllAsTouched(); host.form.disable(); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(visibleErrors().length).toBe(0);
  }));

  it('connects accessible labels and validation descriptions to the underlying Material controls', fakeAsync(() => {
    host.form.markAllAsTouched(); fixture.detectChanges(); flush(); fixture.detectChanges();
    for (const field of fixture.debugElement.queryAll(By.directive(MatFormField))) {
      const label = field.nativeElement.querySelector('label');
      expect(label).toBeTruthy();
      const input = field.nativeElement.querySelector('input, textarea, mat-select');
      if (input.tagName === 'MAT-SELECT') {
        expect(input.getAttribute('aria-labelledby')).toContain(label.id);
      } else {
        expect(label.getAttribute('for')).toBe(input.id);
      }
      expect(input.getAttribute('aria-describedby')).toBeTruthy();
    }
  }));
});

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatAutocompleteModule, MatChipsModule, FormFieldDirective],
  template: `
    <form [formGroup]="passwords">
      <mat-form-field appFormField [fieldControl]="location">
        <mat-label>Location</mat-label>
        <input matInput [formControl]="locationSearch" [matAutocomplete]="locations" />
        <mat-autocomplete #locations="matAutocomplete"><mat-option value="Fuoni">Fuoni</mat-option></mat-autocomplete>
        <mat-error *ngIf="location.hasError('required')">Select a location.</mat-error>
      </mat-form-field>
      <mat-form-field appFormField [fieldControl]="diagnoses">
        <mat-label>Diagnoses</mat-label>
        <mat-chip-grid #grid aria-label="Selected diagnoses">
          <input [matChipInputFor]="grid" aria-label="Search diagnoses" />
        </mat-chip-grid>
        <mat-error *ngIf="diagnoses.hasError('required')">Select at least one diagnosis.</mat-error>
      </mat-form-field>
      <mat-form-field appFormField [fieldInvalid]="passwords.hasError('passwordsMismatch')">
        <mat-label>Confirm password</mat-label>
        <input matInput formControlName="confirmation" />
        <mat-error *ngIf="passwords.hasError('passwordsMismatch')">Passwords do not match.</mat-error>
      </mat-form-field>
    </form>
  `,
})
class ComplexFieldsHostComponent {
  location = new FormControl<number | null>(null, Validators.required);
  locationSearch = new FormControl('');
  diagnoses = new FormControl<number[]>([], Validators.required);
  passwords = new FormGroup({
    password: new FormControl('password'), confirmation: new FormControl('different'),
  }, { validators: (form) => form.get('password')?.value === form.get('confirmation')?.value ? null : { passwordsMismatch: true } });
}

describe('Shared validation for complex fields', () => {
  let fixture: ComponentFixture<ComplexFieldsHostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ComplexFieldsHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(ComplexFieldsHostComponent); fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());

  it('validates selected location and diagnosis IDs independently of their search text', fakeAsync(() => {
    const host = fixture.componentInstance;
    host.location.markAsTouched(); host.diagnoses.markAsTouched();
    host.locationSearch.setValue('Fuoni'); fixture.detectChanges(); flush(); fixture.detectChanges();
    const errors = [...fixture.nativeElement.querySelectorAll('.mat-mdc-form-field-error')]
      .map((element: HTMLElement) => element.textContent!.trim());
    expect(errors).toEqual(['Select a location.', 'Select at least one diagnosis.']);
    host.location.setValue(5); host.diagnoses.setValue([10]); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.mat-mdc-form-field-error').length).toBe(0);
    expect(host.location.value).toBe(5); expect(host.diagnoses.value).toEqual([10]);
  }));

  it('shows and clears confirmation errors supplied by the existing group validator', fakeAsync(() => {
    const form = fixture.componentInstance.passwords;
    form.controls.confirmation.markAsTouched(); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    form.controls.confirmation.setValue('password'); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Passwords do not match.');
  }));
});
