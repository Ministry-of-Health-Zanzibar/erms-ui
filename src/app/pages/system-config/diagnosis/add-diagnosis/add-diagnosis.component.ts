import { CommonModule } from '@angular/common';
import { inject, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { finalize, Subject, takeUntil } from 'rxjs';
import { DiagnosisService } from '../../../../services/system-configuration/diagnosis.service';
import { FeedbackService } from '@shared/services/feedback.service';

@Component({
  selector: 'app-add-diagnosis',
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
  templateUrl: './add-diagnosis.component.html',
  styleUrl: './add-diagnosis.component.scss'
})
export class AddDiagnosisComponent implements OnInit,OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()
  public sidebarVisible:boolean = true

  diagnosisForm: FormGroup;
  parent: any;
  uploadProgress: number = 0;
  uploading: boolean = false;
  errorMessage: string | null = null;
  submitting = false;

  constructor(private diagnosesService: DiagnosisService,
    private dialogRef: MatDialogRef<AddDiagnosisComponent>) {

  }

  ngOnInit(): void {
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
    this.diagnosisForm = new FormGroup({
      diagnosis_name: new FormControl(null, [Validators.required]),

      diagnosis_code: new FormControl(null,Validators.required)
    });
  }


  saveDiagnosis(): void {
    if (this.diagnosisForm.invalid || this.submitting) {
      this.diagnosisForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.diagnosesService.addDiagnoses(this.diagnosisForm.value).pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.submitting = false)
    ).subscribe({
      next: response => {
        if (response.statusCode === 201) {
          this.uiFeedback.fire({
            title: 'Success',
            text: 'Diagnosis saved successfully.',
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue',
          }).then(() => this.dialogRef.close(true));
        } else {
          this.uiFeedback.fire({
            title: 'Error',
            text: response.message || 'Failed to save diagnosis.',
            icon: 'error',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Try Again',
          });
        }
      },
      error: (error: unknown) => {
        this.uiFeedback.fire({
          title: 'Unable to save diagnosis',
          text: getApiErrorMessage(error, 'Please check the diagnosis name and code, then try again.'),
          icon: 'error',
          confirmButtonColor: '#4690eb',
          confirmButtonText: 'Try Again',
        });
      },
    });
  }
}
