import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { ReferralService } from '../../../services/Referral/referral.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { HospitalService } from '../../../services/system-configuration/hospital.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-referral-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
    
  ],
  templateUrl: './referral-status-dialog.component.html',
  styleUrl: './referral-status-dialog.component.scss',
})

export class ReferralStatusDialogComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

  hasRealReferral = false;
  hasBoardedOut = false;
  isRecommendationOnly = false;

  private readonly onDestroy = new Subject<void>();
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible: boolean = true;
  statusForm: FormGroup;
  id: number;
  hospitals: any[] = [];
  patientHistoryId: number | null = null;
  saving = false;

  constructor(
    public referralsService: ReferralService,
    public hospitalService: HospitalService,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ReferralStatusDialogComponent>
  ) {}

  ngOnInit(): void {
    this.configForm();
    this.hasRealReferral = !!this.data?.hasRealReferral;
    this.hasBoardedOut = !!this.data?.hasBoardedOut;
    this.isRecommendationOnly = !!this.data?.isRecommendationOnly;
  
    // ----------------------------
    // SET REFERRAL ID
    // ----------------------------
    if (this.data?.referral?.referral_id) {
      this.id = this.data.referral.referral_id;
      this.statusForm.patchValue({ referral_id: this.id });
    }
  
    // ----------------------------
    // 🔥 FIX: ALWAYS USE PASSED VALUE FIRST
    // ----------------------------
    if (this.data?.patient_histories_id) {
      this.patientHistoryId = Number(this.data.patient_histories_id);
    }
  
    this.getHospital();
  
    this.statusForm.get('status')?.valueChanges
      .pipe(takeUntil(this.onDestroy))
      .subscribe(status => {
  
        this.statusForm.get('letter_text')?.clearValidators();
        this.statusForm.get('receiver')?.clearValidators();
        this.statusForm.get('reference_number')?.clearValidators();
        this.statusForm.get('hospital_id')?.clearValidators();
        this.statusForm.get('start_date')?.clearValidators();
        this.statusForm.get('end_date')?.clearValidators();
        this.statusForm.get('reference_date')?.clearValidators();
  
        if (status === 'Cancelled') {
          this.statusForm.get('letter_text')?.setValidators([Validators.required]);
        }
  
        if (status === 'Confirmed') {
          this.statusForm.get('hospital_id')?.setValidators([Validators.required]);
          this.statusForm.get('letter_text')?.setValidators([Validators.required]);
          this.statusForm.get('start_date')?.setValidators([Validators.required]);
          this.statusForm.get('end_date')?.setValidators([Validators.required]);
        }
  
        if (status === 'BoardedOut') {
          this.statusForm.get('receiver')?.setValidators([Validators.required]);
          this.statusForm.get('reference_number')?.setValidators([Validators.required]);
          this.statusForm.get('reference_date')?.setValidators([Validators.required]);
        }

        if (status === 'Confirmed and BoardedOut') {

          // Referral validators
          this.statusForm.get('hospital_id')?.setValidators([Validators.required]);
          this.statusForm.get('letter_text')?.setValidators([Validators.required]);
          this.statusForm.get('start_date')?.setValidators([Validators.required]);
          this.statusForm.get('end_date')?.setValidators([Validators.required]);
        
          // Boarded out validators
          this.statusForm.get('receiver')?.setValidators([Validators.required]);
          this.statusForm.get('reference_number')?.setValidators([Validators.required]);
          this.statusForm.get('reference_date')?.setValidators([Validators.required]);
        }
  
        Object.keys(this.statusForm.controls).forEach(key => {
          this.statusForm.get(key)?.updateValueAndValidity();
        });
      });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  get recommendations(): FormArray {
    return this.statusForm.get('recommendations') as FormArray;
  }

  get selectedStatus(): string {
    return this.statusForm.get('status')?.value || '';
  }

  get showsReferralDetails(): boolean {
    return this.selectedStatus === 'Confirmed' || this.selectedStatus === 'Confirmed and BoardedOut';
  }

  get showsBoardedOutDetails(): boolean {
    return this.selectedStatus === 'BoardedOut' || this.selectedStatus === 'Confirmed and BoardedOut';
  }

  get actionLabel(): string {
    if (this.saving) return 'Saving…';
    if (this.selectedStatus === 'Cancelled') return 'Record rejection';
    if (this.selectedStatus === 'BoardedOut') return 'Save boarded-out outcome';
    return 'Save outcome';
  }
  
  addRecommendation() {
    this.recommendations.push(new FormControl(''));
  }
  
  removeRecommendation(index: number) {
    this.recommendations.removeAt(index);
  }

  configForm() {
    this.statusForm = new FormGroup({
      referral_id: new FormControl(this.id || 0),
      hospital_id: new FormControl<number>(0),
      letter_text: new FormControl(null, [Validators.required]),
      status: new FormControl(null, [Validators.required]),
      start_date: new FormControl(null, ),
      end_date: new FormControl(null,),

      receiver: new FormControl(null),
      reference_number: new FormControl(null),
      reference_date: new FormControl(null),
      recommendations: this.fb.array([])
    });
  }

    // Filter function to disable invalid end dates
  endDateFilter = (d: Date | null): boolean => {
    const startDate = this.statusForm.get('start_date')?.value;
    if (!d || !startDate) return true;
    // Allow only dates after or equal to start date
    return d >= new Date(startDate);
  };

  private formatDate(date: any): string | null {
    if (!date) return null;
  
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  saveReferralLetter() {
    if (this.statusForm.invalid || this.saving) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.statusForm.getRawValue();
    const status = formValue.status;
    const formData: any = { status };

    if (status === 'BoardedOut' || status === 'Confirmed and BoardedOut') {
      const patientId = this.patientHistoryId;

      if (!patientId) {
        this.saving = false;
        this.uiFeedback.fire({
          title: 'Unable to save outcome',
          text: 'The patient history reference is missing.',
          icon: 'error',
        });
        return;
      }

      formData.patient_histories_id = Number(patientId);
      formData.receiver = formValue.receiver;
      formData.reference_number = formValue.reference_number;
      formData.reference_date = this.formatDate(formValue.reference_date);
      formData.recommendations = formValue.recommendations || [];
    }

    if (status === 'Confirmed' || status === 'Confirmed and BoardedOut' || status === 'Cancelled') {
      formData.referral_id = this.id;
      formData.hospital_id = formValue.hospital_id;
      formData.letter_text = formValue.letter_text;
      formData.start_date = this.formatDate(formValue.start_date);
      formData.end_date = this.formatDate(formValue.end_date);
    }

    this.referralsService.addReferralLetter(formData).subscribe(
      (response) => {
        this.saving = false;
        if (response.statusCode === 201) {
          this.uiFeedback.fire({
            title: 'Outcome saved',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
          }).then(() => this.dialogRef.close(true));
        } else {
          this.uiFeedback.fire({
            title: 'Unable to save outcome',
            text: response.message,
            icon: 'error',
          });
        }
      },
      (error) => {
        this.saving = false;
        console.error(error);
        this.uiFeedback.fire({
          title: 'Unable to save outcome',
          text: error?.error?.message || 'Please review the form and try again.',
          icon: 'error',
        });
      }
    );
  }

  getHospital() {
    this.hospitalService.getAllHospital().subscribe({
      next: (response: any) => {
        this.hospitals = response.data;
      },
      error: (err) => {
        console.error('Error fetching hospitals:', err);
      },
    });
  }
}
