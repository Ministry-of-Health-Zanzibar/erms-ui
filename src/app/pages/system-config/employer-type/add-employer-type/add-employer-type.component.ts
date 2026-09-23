import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { EmployerTypeService } from '../../../../services/system-configuration/employer-type.service';
import { GlobalConstants } from '@shared/global-constants';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-add-employer-type',
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
  templateUrl: './add-employer-type.component.html',
  styleUrl: './add-employer-type.component.scss'
})
export class AddEmployerTypeComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible:boolean = true

  employerTypeForm: FormGroup;
  employerType: any;
  id: any;
  submitting = false;

  constructor(
    private employerTypeService: EmployerTypeService,
    private dialogRef: MatDialogRef<AddEmployerTypeComponent>) {

  }

  ngOnInit(): void {
    // this.id = this.data.id;
    this.configForm();
    if(this.data){
      this.id = this.data.id
      this.getEmployerType(this.id);
    }
  }

  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }

  onClose() {
    this.dialogRef.close(false)
  }

  configForm(){
    this.employerTypeForm = new FormGroup({
      employer_type_id: new FormControl(null),
      employer_type_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
    });
  }

  getEmployerType(id: any) {
    this.employerTypeService.getIEmployerTypeById(id).pipe(takeUntil(this.onDestroy)).subscribe({ next: response=>{
      if(response.statusCode == 200){
        this.employerType = response.data[0];
        this.employerTypeForm.patchValue(this.employerType);
      }
      else{
        this.uiFeedback.fire({
          title: "error",
          text: response.message,
          icon: "error",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Close"
        });
      }
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load the employer type.')) })
  }

  saveEmployerType(){
    if (this.employerTypeForm.invalid || this.submitting) {
      this.employerTypeForm.markAllAsTouched();
      return;
    }
    this.submit(this.employerTypeService.addEmployerType(this.employerTypeForm.value));
  }

  updateEmployerType(){
    if (this.employerTypeForm.invalid || this.submitting) {
      this.employerTypeForm.markAllAsTouched();
      return;
    }
    this.submit(this.employerTypeService.updateEmployerType(this.employerTypeForm.value, this.id));
  }

  private submit(request: any): void {
    this.submitting = true;
    request.pipe(takeUntil(this.onDestroy), finalize(() => this.submitting = false)).subscribe({
      next: (response: any) => {
        if (response.statusCode === 200 || response.statusCode === 201) {
          this.uiFeedback.fire({
            title: 'Success',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue'
          }).then(() => this.dialogRef.close(true));
          return;
        }
        this.showError(response.message || 'Unable to save the employer type.');
      },
      error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the employer type.'))
    });
  }

  private showError(message: string): void {
    this.uiFeedback.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
  }
}
