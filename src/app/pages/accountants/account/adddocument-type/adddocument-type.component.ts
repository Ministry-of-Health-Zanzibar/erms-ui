import { DocumentTypeService } from '../../../../services/accountants/document-type.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatInputModule, MatLabel } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { finalize, Subject, takeUntil } from 'rxjs';
import { GlobalConstants } from '@shared/global-constants';

import { FeedbackService } from '@shared/services/feedback.service';
import { SourcesService } from '../../../../services/accountants/sources.service';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-adddocument-type',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatLabel,
    MatDialogModule,
    MatCheckbox,
    MatError,
    ReactiveFormsModule,
    HDividerComponent,
    MatAutocompleteModule,
    MatSelect,
    AsyncPipe,
    MatDatepickerModule,
  ],
  templateUrl: './adddocument-type.component.html',
  styleUrl: './adddocument-type.component.scss'
})
export class AdddocumentTypeComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

 readonly data = inject<any>(MAT_DIALOG_DATA);
    private readonly onDestroy = new Subject<void>()
    public sidebarVisible:boolean = true

    document_typeForm: FormGroup;
    parent: any;
    uploadProgress: number = 0;
    uploading: boolean = false;
    errorMessage: string | null = null;
    sourceData: any;
    source:any;
    submitting = false;

    constructor(private formBuilder:FormBuilder,

      public documentServices:DocumentTypeService,
      private dialogRef: MatDialogRef<AdddocumentTypeComponent>) {
    }


    ngOnInit(): void {
        if(this.data){
          this.sourceData = this.data.data;
         // this.getsource(this.id);
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
        this.document_typeForm = new FormGroup({
          document_type_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),


        });
        if(this.sourceData){
          this.document_typeForm.patchValue(this.sourceData);
        }
      }

      savesource(){
        if (this.document_typeForm.invalid || this.submitting) {
          this.document_typeForm.markAllAsTouched();
          return;
        }
        this.submit(this.documentServices.addDocumentType(this.document_typeForm.value));
      }

      updatesource(){
        if (this.document_typeForm.invalid || this.submitting) {
          this.document_typeForm.markAllAsTouched();
          return;
        }
        this.submit(this.documentServices.updateDocumentType(this.document_typeForm.value, this.sourceData.document_type_id));
      }

      private submit(request: any): void {
        this.submitting = true;
        request.pipe(takeUntil(this.onDestroy), finalize(() => this.submitting = false)).subscribe({
          next: (response: any) => {
            if (response.statusCode === 200 || response.statusCode === 201) {
              this.uiFeedback.fire({
                title: 'Success', text: response.message || 'Document type saved successfully.', icon: 'success',
                confirmButtonColor: '#4690eb', confirmButtonText: 'Continue'
              }).then(() => this.dialogRef.close(true));
              return;
            }
            this.showError(response.message || 'Unable to save the document type.');
          },
          error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the document type.'))
        });
      }

      private showError(message: string): void {
        this.uiFeedback.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
      }
}
