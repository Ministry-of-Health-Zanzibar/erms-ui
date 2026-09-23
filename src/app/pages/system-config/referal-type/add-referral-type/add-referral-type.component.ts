import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { finalize, Subject, takeUntil } from 'rxjs';
import { GlobalConstants } from '@shared/global-constants';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { FeedbackService } from '@shared/services/feedback.service';
import { ReferalTypeService } from '../../../../services/system-configuration/referal-type.service';

@Component({
  selector: 'app-add-referral-type',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInput,
    MatFormField,
    MatLabel,
    MatDialogModule,
    MatCheckbox,
    MatError,
    ReactiveFormsModule,
    HDividerComponent
  ],
  templateUrl: './add-referral-type.component.html',
  styleUrl: './add-referral-type.component.scss'
})
export class AddReferralTypeComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

  readonly data = inject<any>(MAT_DIALOG_DATA);
    private readonly onDestroy = new Subject<void>()
    public sidebarVisible:boolean = true
  
    referralTypeForm: FormGroup;
    parent: any;
    uploadProgress: number = 0;
    uploading: boolean = false;
    errorMessage: string | null = null;
    referralData: any;
    submitting = false;
  
    constructor(private referralService:ReferalTypeService,
      private dialogRef: MatDialogRef<AddReferralTypeComponent>) {
    }


    ngOnInit(): void {
        if(this.data){
          this.referralData = this.data.data;
         // this.getHospital(this.id);
        }
        this.configForm();
      }
    
      
    
      ngOnDestroy(): void {
        this.onDestroy.next()
        this.onDestroy.complete()
      }
      onClose() {
        this.dialogRef.close(false)
      }
    
      configForm(){
        this.referralTypeForm = new FormGroup({
          referral_type_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
          // referral_type_code: new FormControl(null, Validators.required),
            
        });
        if(this.referralData){
          this.referralTypeForm.patchValue(this.referralData);
        }
      }
    
      // getParent() {
      //   this.departmentService.getAllDepartment().pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
      //     this.parent = response.data;
      //   });
      // }
    
    saveReferralType(){
      if (this.referralTypeForm.invalid || this.submitting) {
        this.referralTypeForm.markAllAsTouched();
        return;
      }

      this.submit(this.referralService.addReferalType(this.referralTypeForm.value), 201);
    }
    
      updateReferralType(){
        if (this.referralTypeForm.invalid || this.submitting) {
          this.referralTypeForm.markAllAsTouched();
          return;
        }

        this.submit(
          this.referralService.updateReferalType(this.referralTypeForm.value, this.referralData.referral_type_id),
          200
        );
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
                text: 'Referral type saved successfully.',
                icon: 'success',
                confirmButtonColor: '#4690eb',
                confirmButtonText: 'Continue'
              }).then(() => this.dialogRef.close(true));
              return;
            }

            this.showError(response.message || 'Unable to save the referral type.');
          },
          error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the referral type. Please try again.'))
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
