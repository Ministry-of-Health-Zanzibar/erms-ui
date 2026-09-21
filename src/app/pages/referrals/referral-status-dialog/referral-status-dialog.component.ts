import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { ReferralService } from '../../../services/Referral/referral.service';
import Swal from 'sweetalert2';
import { HospitalService } from '../../../services/system-configuration/hospital.service';
import { MatIcon, MatIconModule } from '@angular/material/icon';

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

  get recommendations() {
    return this.statusForm.get('recommendations') as any;
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
    if (this.statusForm.invalid) return;
  
    const status = this.statusForm.value.status;
  
    let formData: any = { status };
  
    // ----------------------------
    // BOARDED OUT
    // ----------------------------
    // if (status === 'BoardedOut') {
    if (
      status === 'BoardedOut' ||
      status === 'Confirmed and BoardedOut'
    ) {
  
      const patientId = this.patientHistoryId;
  
      if (!patientId) {
        Swal.fire({
          title: 'Error',
          text: 'Patient history ID is missing',
          icon: 'error'
        });
        return;
      }
  
      formData.patient_histories_id = Number(patientId);
  
      formData.receiver = this.statusForm.value.receiver;
      formData.reference_number = this.statusForm.value.reference_number;
      formData.reference_date = this.formatDate(
        this.statusForm.value.reference_date
      );
  
      formData.recommendations =
        this.statusForm.value.recommendations || [];
  
    } 
    // ----------------------------
    // NORMAL FLOW
    // ----------------------------
    // else {
    if (
      status === 'Confirmed' ||
      status === 'Confirmed and BoardedOut' ||
      status === 'Cancelled'
    ) {
      formData.referral_id = this.id;
      formData.hospital_id = this.statusForm.value.hospital_id;
      formData.letter_text = this.statusForm.value.letter_text;
  
      formData.start_date = this.formatDate(
        this.statusForm.value.start_date
      );
  
      formData.end_date = this.formatDate(
        this.statusForm.value.end_date
      );
    }
  
    // ----------------------------
    // API CALL
    // ----------------------------
    this.referralsService.addReferralLetter(formData).subscribe(
      (response) => {
        if (response.statusCode === 201) {
          Swal.fire({
            title: 'Success',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
          }).then(() => {
            this.dialogRef.close(true);
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: response.message,
            icon: 'error',
          });
        }
      },
      (error) => {
        console.error(error);
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong',
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
