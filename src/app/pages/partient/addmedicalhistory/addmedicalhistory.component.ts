import { CommonModule } from '@angular/common';
import { inject,
  Component,
  Inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { ViewChild } from '@angular/core';
import { of, Subject } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import {
  DatePickerComponent,
  TextInputComponent,
} from '@shared/ui';

import { DiagnosisService } from '../../../services/system-configuration/diagnosis.service';
import { MedicalhistoryService } from '../../../services/partient/medicalhistory.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-addmedicalhistory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatStepperModule,
    DatePickerComponent,
    TextInputComponent,
  ],
  templateUrl: './addmedicalhistory.component.html',
  styleUrls: ['./addmedicalhistory.component.scss'],
})
export class AddmedicalhistoryComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  medicalForm!: FormGroup;
  loading = false;
  backendErrors: any = {};
  reasonList: any[] = [];
  readonly customReasonOption = 'custom';
  readonly requiredCaseType = 'Emergency';
  private customReasonSelected = false;
  reasonOptions: any[] = [
    {
      reason_id: this.customReasonOption,
      referral_reason_name: 'Other / Custom reason',
    },
  ];
  selectedFile: File | null = null;
  diagnosesList: any[] = [];
  filteredDiagnoses: any[] = [];
  private diagnosisCatalog: any[] = [];
  diagnosisSearchCtrl = new FormControl('');
  selectedDiagnoses: any[] = [];
  loadingDiagnoses = false;
  private diagnosesLoaded = false;
  private onDestroy$ = new Subject<void>();

  @ViewChild('autoTrigger') autoTrigger!: MatAutocompleteTrigger;
  @ViewChild('diagInput') diagInput!: any;

  constructor(
    private fb: FormBuilder,
    private diagnosisService: DiagnosisService,
    private reasonServices: ReasonsService,
    private medicalHistoryService: MedicalhistoryService,
    public dialogRef: MatDialogRef<AddmedicalhistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const patient = this.data?.patient ?? this.data ?? {};
    this.buildForm(patient);
    this.setupDiagnosisSearch();
    this.loadInitialDiagnoses();
    this.loadReasons();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  buildForm(patient?: any) {
    this.medicalForm = this.fb.group({
      patient_id: [patient?.patient_id || '', Validators.required],
      referralDetails: this.fb.group({
        referring_doctor: ['', Validators.required],
        file_number: ['', Validators.required],
        referring_date: [''],
        reason_id: ['', Validators.required],
        custom_reason: [''],
      }),
      clinicalDetails: this.fb.group({
        history_of_presenting_illness: ['', Validators.required],
        physical_findings: ['', Validators.required],
        investigations: ['', Validators.required],
        management_done: ['', Validators.required],
        diagnosis_ids: [[], Validators.required],
      }),
      attachment: this.fb.group({
        history_file: [null],
      }),
    });
  }

  get referralDetailsForm(): FormGroup {
    return this.medicalForm.get('referralDetails') as FormGroup;
  }

  get clinicalDetailsForm(): FormGroup {
    return this.medicalForm.get('clinicalDetails') as FormGroup;
  }

  get attachmentForm(): FormGroup {
    return this.medicalForm.get('attachment') as FormGroup;
  }

  get selectedReasonLabel(): string {
    const selectedReason = this.referralDetailsForm?.get('reason_id')?.value;
    return this.reasonOptions.find((reason) => reason.reason_id === selectedReason)
      ?.referral_reason_name || 'Not selected';
  }

  loadReasons() {
    this.reasonServices.getAllReasons().subscribe({
      next: (res: any) => {
        this.reasonList = res.data || [];
        this.reasonOptions = [
          ...this.reasonList,
          {
            reason_id: this.customReasonOption,
            referral_reason_name: 'Other / Custom reason',
          },
        ];
      },
      error: (err) => console.error('Failed to load reasons', err),
    });
  }

  get isCustomReasonSelected(): boolean {
    return this.customReasonSelected
      || this.referralDetailsForm?.get('reason_id')?.value === this.customReasonOption;
  }

  onReasonChange(value: any): void {
    const reasonId = value && typeof value === 'object'
      ? (value.value ?? value.reason_id)
      : value;
    const customReasonControl = this.referralDetailsForm.get('custom_reason');
    const reasonControl = this.referralDetailsForm.get('reason_id');

    this.customReasonSelected = reasonId === this.customReasonOption;

    if (reasonControl?.value !== reasonId) {
      reasonControl?.setValue(reasonId, { emitEvent: false });
    }

    if (reasonId === this.customReasonOption) {
      customReasonControl?.setValidators([
        Validators.required,
        Validators.maxLength(255),
      ]);
    } else {
      customReasonControl?.clearValidators();
      customReasonControl?.setValue('', { emitEvent: false });
    }

    customReasonControl?.updateValueAndValidity({ emitEvent: false });
  }

  private setupDiagnosisSearch(): void {
    this.diagnosisSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          const query = (search || '').trim();
          if (query.length < 2) {
            return of(this.filterDiagnosisCatalog(query));
          }

          this.loadingDiagnoses = true;
          return this.diagnosisService.searchDiagnosis(query, 20).pipe(
            map((response: any) => response?.data || []),
            catchError(() => of([])),
          );
        }),
        takeUntil(this.onDestroy$),
      )
      .subscribe((diagnoses: any[]) => {
        this.diagnosesList = diagnoses;
        this.filteredDiagnoses = diagnoses;
        this.loadingDiagnoses = false;
      });
  }

  private loadInitialDiagnoses(): void {
    this.loadingDiagnoses = true;

    this.diagnosisService
      .getAllDiagnosis('', 1, 50)
      .pipe(
        map((response: any) => response?.data || []),
        catchError(() => of([])),
        takeUntil(this.onDestroy$),
      )
      .subscribe((diagnoses: any[]) => {
        this.diagnosisCatalog = diagnoses;
        this.diagnosesList = diagnoses;
        this.filteredDiagnoses = this.filterDiagnosisCatalog(
          this.diagnosisSearchCtrl.value || '',
        );
        this.diagnosesLoaded = true;
        this.loadingDiagnoses = false;
      });
  }

  private filterDiagnosisCatalog(query: string): any[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return this.diagnosisCatalog;
    }

    return this.diagnosisCatalog.filter((diagnosis) =>
      `${diagnosis.diagnosis_name || ''} ${diagnosis.diagnosis_code || ''}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }




  onDiagnosesInputFocused(): void {
    if (!this.diagnosesLoaded && !this.loadingDiagnoses) {
      this.loadInitialDiagnoses();
    }

    if (!(this.diagnosisSearchCtrl.value || '').trim()) {
      this.filteredDiagnoses = this.filterDiagnosisCatalog('');
    }
  }

  addDiagnosis(diagnosis: any): void {
    const exists = this.selectedDiagnoses.find(
      (selected) => selected.diagnosis_id === diagnosis.diagnosis_id,
    );

    if (!exists) {
      this.selectedDiagnoses.push(diagnosis);
      const ids = this.selectedDiagnoses.map((selected) => selected.diagnosis_id);
      const diagnosisControl = this.clinicalDetailsForm.get('diagnosis_ids');

      diagnosisControl?.setValue(ids);
      diagnosisControl?.markAsDirty();
      diagnosisControl?.updateValueAndValidity();
    }

    this.diagnosisSearchCtrl.setValue('', { emitEvent: false });
    this.filteredDiagnoses = [];
    this.autoTrigger?.closePanel();

    setTimeout(() => {
      if (this.diagInput?.nativeElement) {
        this.diagInput.nativeElement.value = '';
        this.diagInput.nativeElement.focus();
      }
    });
  }

  removeDiagnosis(diagnosis: any): void {
    this.selectedDiagnoses = this.selectedDiagnoses.filter(
      (selected) => selected.diagnosis_id !== diagnosis.diagnosis_id,
    );

    const diagnosisControl = this.clinicalDetailsForm.get('diagnosis_ids');
    diagnosisControl?.setValue(
      this.selectedDiagnoses.map((selected) => selected.diagnosis_id),
    );
    diagnosisControl?.markAsDirty();
    diagnosisControl?.updateValueAndValidity();
  }


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.attachmentForm.patchValue({ history_file: file });
      this.attachmentForm.get('history_file')?.updateValueAndValidity();
    }
  }

  onCancel() {
    this.dialogRef.close({ success: false });
  }

  onSubmit() {
    if (this.medicalForm.invalid) {
      this.medicalForm.markAllAsTouched();
      return;
    }

    if (!this.medicalForm.get('patient_id')?.value) {
      this.uiFeedback.fire('Error', 'The selected patient could not be identified.', 'error');
      return;
    }

    this.loading = true;

    const formValue = this.medicalForm.getRawValue();
    const referralDetails = formValue.referralDetails;
    const clinicalDetails = formValue.clinicalDetails;
    const formData = new FormData();


    formData.append('patient_id', String(formValue.patient_id));
    formData.append('referring_doctor', referralDetails.referring_doctor);
    formData.append('file_number', referralDetails.file_number);
    const referringDate = referralDetails.referring_date instanceof Date
      ? referralDetails.referring_date.toISOString().slice(0, 10)
      : referralDetails.referring_date || '';
    formData.append('referring_date', referringDate);
    if (referralDetails.reason_id === this.customReasonOption) {
      formData.append('custom_reason', String(referralDetails.custom_reason).trim());
    } else {
      formData.append('reason_id', referralDetails.reason_id);
    }
    formData.append('history_of_presenting_illness', clinicalDetails.history_of_presenting_illness);
    formData.append('physical_findings', clinicalDetails.physical_findings);
    formData.append('investigations', clinicalDetails.investigations);
    formData.append('management_done', clinicalDetails.management_done);
    formData.append('case_type', this.requiredCaseType);


    if (Array.isArray(clinicalDetails.diagnosis_ids)) {
      clinicalDetails.diagnosis_ids.forEach((id: number) => {
        formData.append('diagnosis_ids[]', id.toString());
      });
    }


    if (this.selectedFile) {
      formData.append('history_file', this.selectedFile, this.selectedFile.name);
    }

    this.medicalHistoryService.addMedical(formData).subscribe({
      next: (res: any) => {
        this.loading = false;


        this.dialogRef.close({
          success: true,
          data: res
        });
      },
      error: (err) => {
        console.error('Backend error:', err);
        this.backendErrors = err.error?.errors || {};
        this.uiFeedback.fire('Error', 'Failed to save medical history', 'error');
        this.loading = false;
      },
    });
  }
}
