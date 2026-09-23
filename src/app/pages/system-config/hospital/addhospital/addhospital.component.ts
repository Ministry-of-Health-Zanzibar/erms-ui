import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
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
  MatInput,
  MatLabel,
} from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { finalize, Subject, takeUntil } from 'rxjs';
import { GlobalConstants } from '@shared/global-constants';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { HospitalService } from '../../../../services/system-configuration/hospital.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { ReferalTypeService } from '../../../../services/system-configuration/referal-type.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-addhospital',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInput,
    MatFormField,
    MatLabel,
    MatDialogModule,
    MatError,
    ReactiveFormsModule,
    MatSelectModule,
    
  ],
  templateUrl: './addhospital.component.html',
  styleUrl: './addhospital.component.scss',
})
export class AddhospitalComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  readonly data = inject<any>(MAT_DIALOG_DATA);
  private readonly onDestroy = new Subject<void>();
  public sidebarVisible: boolean = true;

  hospitalForm: FormGroup;
  parent: any;
  uploadProgress: number = 0;
  uploading: boolean = false;
  errorMessage: string | null = null;
  hospitalData: any;
  referralTypes: any;
  submitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private hospitalService: HospitalService,
    private referralsTypeService: ReferalTypeService,
    private dialogRef: MatDialogRef<AddhospitalComponent>
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.hospitalData = this.data.data;
      // this.getHospital(this.id);
    }
    this.configForm();
    this.getReferralType();
  }

  // getDepartm(id: any){
  //   this.departmentService.getAllDepartmentById(id).subscribe(response=>{
  //     this.departmentForm.patchValue(response.data[0])
  //   })
  // }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
  onClose() {
    this.dialogRef.close(false);
  }

  configForm() {
    this.hospitalForm = new FormGroup({
      hospital_name: new FormControl(null, [
        Validators.required,
        
      ]),
      hospital_address: new FormControl(null, Validators.required),
      hospital_email: new FormControl(null, [Validators.required, Validators.email]),
      contact_number: new FormControl(null, Validators.required),
      referral_type_id: new FormControl(null, Validators.required),

    });
    if (this.hospitalData) {
      this.hospitalForm.patchValue(this.hospitalData);
    }
  }

  // getParent() {
  //   this.departmentService.getAllDepartment().pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
  //     this.parent = response.data;
  //   });
  // }

  getReferralType() {
    this.referralsTypeService.getAllReferalType().pipe(takeUntil(this.onDestroy)).subscribe({
      next: response => this.referralTypes = response.data,
      error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load referral types.'))
    });
  }

  saveHospital() {
    if (this.hospitalForm.invalid || this.submitting) {
      this.hospitalForm.markAllAsTouched();
      return;
    }

    this.submit(this.hospitalService.addHospital(this.hospitalForm.value), 201);
  }

  updateHospital() {
    if (this.hospitalForm.invalid || this.submitting) {
      this.hospitalForm.markAllAsTouched();
      return;
    }

    this.submit(this.hospitalService.updateHospital(this.hospitalForm.value, this.hospitalData.hospital_id), 200);
  }

  private submit(request: any, successCode: number): void {
    this.submitting = true;
    request.pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.submitting = false)
    ).subscribe({
      next: (response: any) => {
        if (response.statusCode === successCode) {
          this.uiFeedback.fire({
            title: 'Success',
            text: 'Hospital saved successfully.',
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue'
          }).then(() => this.dialogRef.close(true));
          return;
        }

        this.showError(response.message || 'Unable to save the hospital.');
      },
      error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the hospital. Please try again.'))
    });
  }

  private showError(message: string): void {
    this.uiFeedback.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonColor: '#4690eb',
      confirmButtonText: 'Close'
    });
  }
}
