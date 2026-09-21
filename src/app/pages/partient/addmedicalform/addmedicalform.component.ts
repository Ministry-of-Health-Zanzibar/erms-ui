import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  FormControl,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { DiagnosisService } from '../../../services/system-configuration/diagnosis.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { MedicalhistoryService } from '../../../services/partient/medicalhistory.service';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';


@Component({
  selector: 'app-addmedicalform',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './addmedicalform.component.html',
  styleUrls: ['./addmedicalform.component.scss'],
})
export class AddmedicalformComponent implements OnInit, OnDestroy {
  mode: 'add' | 'edit' = 'add';
  medicalForm!: FormGroup;
  loading = false;
  backendErrors: any = {};
  reasonList: any[] = [];
  diagnosesList: any[] = [];
  filteredDiagnoses: any[] = [];
  selectedFile: File | null = null;
  diagnosisSearchCtrl = new FormControl('');
  selectedDiagnoses: any[] = [];
  private onDestroy$ = new Subject<void>();
  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;
  @ViewChild('diagInput') diagInput!: any;

  constructor(
    private fb: FormBuilder,
    private diagnosisService: DiagnosisService,
    private reasonServices: ReasonsService,
    private medicalHistoryService: MedicalhistoryService,
    public dialogRef: MatDialogRef<AddmedicalformComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.mode = this.data.mode;
    const patient = this.data.patient;
    this.buildForm(patient);
    this.loadReasons();
    this.loadDiagnoses();

    if (this.mode === 'edit') {
      this.patchMedicalData(patient);
    }
  }

  buildForm(patient: any) {
    this.medicalForm = this.fb.group({
      patient_histories_id: [
        patient.latest_history?.patient_histories_id || '',
        Validators.required,
      ],
      board_comments: ['', Validators.required],
      board_reason_id: ['', Validators.required],
      board_diagnosis_ids: [[], Validators.required],
    
      create_referral_record: [true] // default value
    });
  }

  patchMedicalData(patient: any) {
    const history = patient.latest_history;
    if (!history) return;

    // 1. Patch Basic Fields
    this.medicalForm.patchValue({
      board_comments: history.board_comments,
      board_reason_id: history.board_reason_id,
      create_referral_record: history.referrals && history.referrals.length > 0
    });

    // 2. Populate Selected Diagnoses (the visual chips)
    if (history.board_diagnoses && Array.isArray(history.board_diagnoses)) {
      this.selectedDiagnoses = [...history.board_diagnoses];

      // 3. Update the hidden form control with IDs so validation passes
      const ids = this.selectedDiagnoses.map((d) => d.diagnosis_id);
      this.medicalForm.get('board_diagnosis_ids')?.setValue(ids);
    }

    this.selectedFile = null;

      // ✅ OPTIONAL: lock checkbox if referral already exists
    if (history.referrals && history.referrals.length > 0) {
      this.medicalForm.get('create_referral_record')?.disable();
    }
  }

  loadReasons() {
    this.reasonServices
      .getAllReasons()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe({
        next: (res: any) => (this.reasonList = res.data || []),
        error: (err) => console.error(err),
      });
  }

  loadDiagnoses() {
    this.diagnosisService
      .getAllDiagnosis()
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((res) => {
        this.diagnosesList = res.data || [];
        this.filteredDiagnoses = [...this.diagnosesList];
      });

    this.diagnosisSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.onDestroy$),
      )
      .subscribe((search: any) => {
  
        const query = (search || '').trim();
  
        if (query.length < 2) {
          this.filteredDiagnoses = [];
          return;
        }
        const lowerSearch = search.toLowerCase();
        this.filteredDiagnoses = this.diagnosesList.filter((diag) =>
          diag.diagnosis_name.toLowerCase().includes(lowerSearch),
        );
      });
  }
  
  addDiagnosis(diagnosis: any) {
    const exists = this.selectedDiagnoses.find(
      (d) => d.diagnosis_id === diagnosis.diagnosis_id,
    );
  
    if (!exists) {
      this.selectedDiagnoses.push(diagnosis);

      // Sync IDs to the form control
      const ids = this.selectedDiagnoses.map((d) => d.diagnosis_id);
      this.medicalForm.get('board_diagnosis_ids')?.setValue(ids);

      // Mark as dirty to trigger validation update
      this.medicalForm.get('board_diagnosis_ids')?.markAsDirty();
    }
  
    // ✅ 1. clear input text
    this.diagnosisSearchCtrl.setValue('');
  
    // ✅ 2. clear results
    this.filteredDiagnoses = [];
  
    // ✅ 3. CLOSE dropdown properly
    this.autoTrigger.closePanel();
  
    // ✅ 4. RESET input DOM (important fix for "stuck text")
    setTimeout(() => {
      if (this.diagInput?.nativeElement) {
        this.diagInput.nativeElement.value = '';
        this.diagInput.nativeElement.focus(); // optional UX improvement
      }
    });
  }

  removeDiagnosis(diagnosis: any) {
    this.selectedDiagnoses = this.selectedDiagnoses.filter(
      (d) => d.diagnosis_id !== diagnosis.diagnosis_id,
    );

    // Sync IDs to the form control
    const ids = this.selectedDiagnoses.map((d) => d.diagnosis_id);
    this.medicalForm.get('board_diagnosis_ids')?.setValue(ids);

    if (ids.length === 0) {
      this.medicalForm
        .get('board_diagnosis_ids')
        ?.setErrors({ required: true });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      Swal.fire('Error', 'File must be 1MB or less', 'error');
      this.selectedFile = null;
      event.target.value = '';
      return;
    }
    this.selectedFile = file;
  }

  onSubmit() {
    // Debugging: Check why form is invalid
    if (this.medicalForm.invalid) {
      console.error('Form Invalid:', this.medicalForm.value);
      this.medicalForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    // const formValue = this.medicalForm.value;
    const formValue = this.medicalForm.getRawValue();
    const formData = new FormData();

    formData.append('board_comments', formValue.board_comments);
    formData.append('board_reason_id', formValue.board_reason_id);
    // Append diagnosis IDs correctly for PHP/Spring/Node backend arrays
    formValue.board_diagnosis_ids.forEach((id: any) => {
      formData.append('board_diagnosis_ids[]', id);
    });

    if (this.selectedFile) {
      formData.append('patient_file', this.selectedFile);
    }

    formData.append(
      'create_referral_record',
      formValue.create_referral_record ? '1' : '0'
    );

    const patientHistoryId = this.data.patientHistoryId;

    const request$ =
      this.mode === 'edit'
        ? this.medicalHistoryService.updateMedicalHistory(
            patientHistoryId,
            formData,
          )
        : this.medicalHistoryService.addMedicalHistory(
            patientHistoryId,
            formData,
          );

    request$.pipe(takeUntil(this.onDestroy$)).subscribe({
      next: () => {
        Swal.fire(
          'Success',
          `Medical history ${this.mode}ed successfully`,
          'success',
        );
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.backendErrors = err.error.errors || {};
        this.loading = false;
        Swal.fire('Error', 'Failed to save medical history', 'error');
      },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
