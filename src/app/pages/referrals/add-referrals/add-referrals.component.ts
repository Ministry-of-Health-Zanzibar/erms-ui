import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  MatError,
  MatFormField,
  MatInputModule,
  MatLabel,
} from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, forkJoin } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { ReferralService } from '../../../services/Referral/referral.service';
import { HospitalService } from '../../../services/system-configuration/hospital.service';
import { PartientService } from '../../../services/partient/partient.service';
import { ReferalTypeService } from '../../../services/system-configuration/referal-type.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { HDividerComponent } from '@elementar/components';

@Component({
  selector: 'app-add-referrals',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormField,
    MatLabel,
    MatCheckbox,
    MatError,
    ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    HDividerComponent,
  ],
  templateUrl: './add-referrals.component.html',
  styleUrls: ['./add-referrals.component.scss'],
})
export class AddReferralsComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  readonly data = inject<any>(MAT_DIALOG_DATA);
  private readonly onDestroy = new Subject<void>();

  referralsForm!: FormGroup;
  id: number | null = null; // keeps track of update mode
  patients: any[] = [];
  hospital: any[] = [];
  referralTypes: any[] = [];
  reason: any[] = [];

  constructor(
    private referralsService: ReferralService,
    private hostpitalService: HospitalService,
    private patientService: PartientService,
    private referralsTypeService: ReferalTypeService,
    private reasonService: ReasonsService,
    private dialogRef: MatDialogRef<AddReferralsComponent>
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAllOptions().subscribe(() => {
      if (this.data?.id != null && !isNaN(this.data.id)) {
        this.id = Number(this.data.id);
        this.getReferralDetails(this.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  private initForm() {
    this.referralsForm = new FormGroup({
      patient_id: new FormControl<number | null>(null, Validators.required),
      reason_id: new FormControl<number | null>(null, Validators.required),
    });
  }

  private loadAllOptions() {
    return forkJoin({
      patients: this.patientService.getAllPartientforReferral(),
      hospitals: this.hostpitalService.getAllHospital(),
      referralTypes: this.referralsTypeService.getAllReferalType(),
      reasons: this.reasonService.getAllReasons(),
    }).pipe((res$) => {
      res$.subscribe((res: any) => {
        this.patients = res.patients.data || [];
        this.hospital = res.hospitals.data || [];
        this.referralTypes = res.referralTypes.data || [];
        this.reason = res.reasons.data || [];
      });
      return res$;
    });
  }

  saveReferrals() {
    if (this.referralsForm.invalid) {
      this.uiFeedback.fire({
        title: 'Form Invalid',
        text: 'Please fill all required fields correctly.',
        icon: 'warning',
        confirmButtonColor: '#4690eb',
        confirmButtonText: 'Okay',
      });
      return;
    }

    this.referralsService.addReferral(this.referralsForm.value).subscribe(
      (response) => {
        if (response.statusCode === 201) {
          this.uiFeedback.fire({
            title: 'Success',
            text: 'Data saved successfully',
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue',
          }).then(() => this.dialogRef.close(true));
        } else {
          this.uiFeedback.fire({
            title: 'Error',
            text: response.message,
            icon: 'error',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue',
          });
        }
      },
      (err) => {
        this.uiFeedback.fire({
          title: 'Error',
          text: err.error?.message || 'Failed to save referral',
          icon: 'error',
          confirmButtonColor: '#4690eb',
          confirmButtonText: 'Continue',
        });
      }
    );
  }

  updateReferrals() {
    if (this.referralsForm.valid && this.id !== null) {
      this.referralsService
        .updateReferral(this.referralsForm.value, this.id)
        .subscribe(
          (response) => {
            if (response.statusCode === 201) {
              this.uiFeedback.fire({
                title: 'Success',
                text: 'Referral updated successfully',
                icon: 'success',
                confirmButtonColor: '#4690eb',
                confirmButtonText: 'Continue',
              }).then(() => this.dialogRef.close(true));
            } else {
              this.uiFeedback.fire({
                title: 'Error',
                text: response.message,
                icon: 'error',
                confirmButtonColor: '#4690eb',
                confirmButtonText: 'Continue',
              });
            }
          },
          (err) => {
            this.uiFeedback.fire({
              title: 'Error',
              text: err.error?.message || 'Failed to update referral',
              icon: 'error',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Continue',
            });
          }
        );
    }
  }

  private getReferralDetails(id: number) {
    this.referralsService.getReferralById(id).subscribe((response) => {
      if (response.statusCode === 200 && response.data) {
        const referral = response.data;

        // Ensure number conversion for form patching
        this.referralsForm.patchValue({
          patient_id: referral.patient_id
            ? Number(referral.patient_id)
            : referral.patient?.patient_id
            ? Number(referral.patient.patient_id)
            : null,
          reason_id: referral.reason_id
            ? Number(referral.reason_id)
            : referral.reason?.reason_id
            ? Number(referral.reason.reason_id)
            : null,
        });
      }
    });
  }
}
