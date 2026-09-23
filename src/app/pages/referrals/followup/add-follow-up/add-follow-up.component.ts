import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  MatError,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { HDividerComponent } from '@elementar/components';
import { finalize, map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { FollowsService } from '../../../../services/Referral/follows.service';
import { HospitalService } from '../../../../services/system-configuration/hospital.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-add-follow-up',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatLabel,
    MatDialogModule,
    MatTooltipModule,
   MatIconModule,
    MatError,
    ReactiveFormsModule,

    MatAutocompleteModule,
    MatSelect,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './add-follow-up.component.html',
  styleUrl: './add-follow-up.component.scss',
})
export class AddFollowUpComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible: boolean = true;

  patientForm: FormGroup;
  user: any;
  id: any;
  hospital: any;
  locations: any;
  options: any[] = [];
  myControl = new FormControl('');
  filteredOptions: Observable<any[]>;
  selectedAttachement: File | null = null;
  fileSizeError = '';
  submitting = false;

  constructor(
    private followServices: FollowsService,
    private hospitalServices: HospitalService,
    private snackBar: MatSnackBar,

    private dialogRef: MatDialogRef<AddFollowUpComponent>
  ) {}

  ngOnInit(): void {
    this.configForm();

    if (this.data) {
      if (this.data.referral_id) {
        this.id = this.data.referral_id;
        this.patientForm.patchValue({ referral_id: this.id });
      }

      if (this.data.outcome) {
        this.patientForm.patchValue({ outcome: this.data.outcome });
      }
    }

    this.patientForm.get('outcome')?.valueChanges
      .pipe(takeUntil(this.onDestroy))
      .subscribe((outcome) => this.setOutcomeState(outcome));

    this.setOutcomeState(this.patientForm.get('outcome')?.value);

    this.getHospital();
  }

  getHospital() {
    this.hospitalServices.getAllHospital().pipe(takeUntil(this.onDestroy)).subscribe({
      next: response => this.hospital = response.data,
      error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load hospitals.'))
    });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  configForm() {
    this.patientForm = new FormGroup({
      referral_id: new FormControl(this.id),

      content_summary: new FormControl(null, [Validators.required]),
      next_appointment_date: new FormControl(null),
      hospital_id: new FormControl(null),
      outcome: new FormControl(null, Validators.required),
      letter_file: new FormControl(null, Validators.required),

      followup_date: new FormControl(null),
    });
  }

  get normalizedOutcome(): string {
    return String(this.patientForm?.get('outcome')?.value ?? '')
      .trim()
      .toLowerCase();
  }

  get isTransferredOutcome(): boolean {
    return this.normalizedOutcome === 'transferred';
  }

  get showsNextAppointmentDate(): boolean {
    return ['follow-up', 'transferred'].includes(this.normalizedOutcome);
  }

  onOutcomeSelectionChanged(outcome: unknown): void {
    this.setOutcomeState(outcome);
  }

  private setOutcomeState(outcome: unknown): void {
    const normalizedOutcome = String(outcome ?? '').trim().toLowerCase();

    this.updateOutcomeDependentValidation(normalizedOutcome);
  }

  private updateOutcomeDependentValidation(outcome: unknown): void {
    const nextAppointmentControl = this.patientForm.get('next_appointment_date');
    const hospitalControl = this.patientForm.get('hospital_id');

    if (!nextAppointmentControl || !hospitalControl) {
      return;
    }

    const normalizedOutcome = String(outcome ?? '').trim().toLowerCase();

    if (normalizedOutcome === 'transferred') {
      nextAppointmentControl.setValidators([Validators.required]);
      hospitalControl.setValidators([Validators.required]);
    } else {
      nextAppointmentControl.clearValidators();
      hospitalControl.clearValidators();
    }

    nextAppointmentControl.updateValueAndValidity({ emitEvent: false });
    hospitalControl.updateValueAndValidity({ emitEvent: false });
  }

  getSelectedHospitalName(): string {
    const id = this.patientForm.get('hospital_id')?.value;
    const found = this.hospital?.find((h: any) => h.hospital_id === id);
    return found?.hospital_name || '';
  }



onAttachmentSelected(event: any): void {
  const file = event.target.files?.[0];

  if (!file) return;

  const maxSize = 1024 * 1024; // 1MB

  if (file.size > maxSize) {
    this.patientForm.patchValue({ letter_file: '' });
    this.selectedAttachement = null;
    event.target.value = '';

    this.snackBar.open(
      'File size must not exceed 1 MB. Please compress your file using tools like iLovePDF before uploading.',
      'Close',
      {
        duration: 6000,
        panelClass: ['error-snackbar']
      }
    );

    return;
  }

  this.selectedAttachement = file;

  this.patientForm.patchValue({
    letter_file: file.name
  });
}

  saveClient() {
    if (this.submitting) return;

    if (this.patientForm.valid && !this.submitting) {
      const formData = new FormData();

      if (this.selectedAttachement) {
        formData.append(
          'letter_file',
          this.selectedAttachement,
          this.selectedAttachement.name
        );
      }

      Object.keys(this.patientForm.controls).forEach((key) => {
        if (key !== 'letter_file') {
          const value = this.patientForm.get(key)?.value;
          if (value !== null && value !== undefined) {
            const serializedValue =
              key === 'next_appointment_date' || key === 'followup_date'
                ? this.formatDate(value)
                : String(value);

            if (serializedValue !== null && serializedValue !== '') {
              formData.append(key, serializedValue);
            }
          }
        }
      });

      formData.set('referral_id', String(this.id));

      this.submitting = true;
      this.followServices.addFollowform(formData).pipe(
        takeUntil(this.onDestroy),
        finalize(() => this.submitting = false)
      ).subscribe({ next: response => {
        if (response.statusCode === 200) {
          this.uiFeedback.fire({
            title: 'Success',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue',
          }).then(() => {
            this.patientForm.reset();
            this.selectedAttachement = null;

            // ✅ Close dialog and trigger parent refresh
            this.dialogRef.close(true);
          });
        } else {
          this.showError(response.message || 'Unable to save the follow-up.');
        }
      }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the follow-up.')) });
    } else {
      this.uiFeedback.fire({
        title: 'Invalid Form',
        text: 'Please fill all required fields',
        icon: 'warning',
        confirmButtonColor: '#4690eb',
        confirmButtonText: 'Ok',
      });
    }
  }

  private formatDate(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private showError(message: string): void {
    this.uiFeedback.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
  }
}
