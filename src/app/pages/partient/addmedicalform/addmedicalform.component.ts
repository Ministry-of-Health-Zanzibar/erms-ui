import { CommonModule } from '@angular/common';
import { inject, Component, Inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
import { FeedbackService } from '@shared/services/feedback.service';
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
  private readonly uiFeedback = inject(FeedbackService);
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
  patientName = 'Patient record';
  patientCard = 'Not available';
  hasExistingReferral = false;
  existingReferralStatus = '';
  existingFileName: string | null = null;
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
    this.mode = this.data?.mode === 'edit' ? 'edit' : 'add';
    const patient = this.data?.patient ?? {};
    this.patientName = patient.name || patient.patient?.name || 'Patient record';
    this.patientCard = patient.matibabu_card || patient.patient?.matibabu_card || 'Not available';
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

      // A referral is the default decision. The board can switch this off
      // when the outcome is recommendation-only.
      create_referral_record: [true],
    });
  }

  patchMedicalData(patient: any) {
    const history = patient.latest_history;
    if (!history) return;

    const referrals = Array.isArray(history.referrals) ? history.referrals : [];
    this.hasExistingReferral = referrals.length > 0;
    this.existingReferralStatus = referrals[0]?.status || '';
    this.existingFileName =
      history.patient_file?.name || history.history_file?.split('/').pop() || null;

    // 1. Patch the board assessment fields.
    this.medicalForm.patchValue({
      board_comments: history.board_comments ?? '',
      board_reason_id:
        history.board_reason_id ??
        history.board_reason?.reason_id ??
        history.boardReason?.reason_id ??
        '',
      create_referral_record: this.hasExistingReferral,
    });

    // 2. Populate selected diagnoses (the visual chips).
    const boardDiagnoses = history.board_diagnoses || history.boardDiagnoses || [];
    if (Array.isArray(boardDiagnoses)) {
      this.selectedDiagnoses = [...boardDiagnoses];

      const ids = this.selectedDiagnoses.map((d) => d.diagnosis_id);
      this.medicalForm.get('board_diagnosis_ids')?.setValue(ids);
    }

    this.selectedFile = null;

    // Keep the decision editable in both directions. The API will hard-delete
    // an active referral and its dependent records when the board explicitly
    // saves the recommendation-only option.
    const referralControl = this.medicalForm.get('create_referral_record');
    referralControl?.enable({ emitEvent: false });
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
        const lowerSearch = query.toLowerCase();
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
    } else {
      this.medicalForm.get('board_diagnosis_ids')?.setErrors(null);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // Keep in sync with the API validation.
    if (file.size > maxSize) {
      this.uiFeedback.fire('File too large', 'The file must be 5 MB or less.', 'error');
      this.selectedFile = null;
      event.target.value = '';
      return;
    }
    this.selectedFile = file;
  }

  async onSubmit() {
    if (this.medicalForm.invalid) {
      this.medicalForm.markAllAsTouched();
      return;
    }

    const formValue = this.medicalForm.getRawValue();
    const referralRequested = !!formValue.create_referral_record;
    const willDeleteReferral =
      this.mode === 'edit' && this.hasExistingReferral && !referralRequested;

    if (willDeleteReferral) {
      const confirmation = await this.uiFeedback.fire({
        title: 'Delete this referral permanently?',
        text: 'The referral and all related letters, follow-ups, diagnoses, bills, payments, flights, and treatments will be permanently removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete and save',
        cancelButtonText: 'Keep referral',
        confirmButtonColor: '#dc2626',
        reverseButtons: true,
      });

      if (!confirmation.isConfirmed) {
        return;
      }
    }

    this.loading = true;
    const formData = new FormData();

    formData.append('board_comments', formValue.board_comments.trim());
    formData.append('board_reason_id', String(formValue.board_reason_id));
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

    const patientHistoryId = this.data?.patientHistoryId;

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
        this.uiFeedback.fire(
          this.mode === 'edit' ? 'Assessment updated' : 'Assessment saved',
          willDeleteReferral
            ? 'Saved as recommendation-only. The referral and related records were permanently deleted.'
            : referralRequested
              ? 'The referral decision has been saved and the referral workflow is ready.'
              : 'Saved as recommendation-only. No referral record was created.',
          'success',
        );
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.backendErrors = err.error?.errors || {};
        this.loading = false;
        this.uiFeedback.fire(
          'Unable to save assessment',
          err.error?.message || 'Please review the form and try again.',
          'error',
        );
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
