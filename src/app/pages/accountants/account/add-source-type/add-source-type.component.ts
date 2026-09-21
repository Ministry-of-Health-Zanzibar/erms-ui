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

import Swal from 'sweetalert2';
import { SourcesService } from '../../../../services/accountants/sources.service';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SourceTypeService } from '../../../../services/accountants/source-type.service';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-add-source-type',
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
  templateUrl: './add-source-type.component.html',
  styleUrl: './add-source-type.component.scss'
})
export class AddSourceTypeComponent implements OnInit, OnDestroy {

 readonly data = inject<any>(MAT_DIALOG_DATA);
    private readonly onDestroy = new Subject<void>()
    public sidebarVisible:boolean = true

    sourceForm: FormGroup;
    parent: any;
    uploadProgress: number = 0;
    uploading: boolean = false;
    errorMessage: string | null = null;
    sourceData: any;
    source:any;
    submitting = false;

    constructor(private formBuilder:FormBuilder,
      private sources:SourceTypeService,
      public sourceServices:SourcesService,
      private dialogRef: MatDialogRef<AddSourceTypeComponent>) {
    }


    ngOnInit(): void {
        if(this.data){
          this.sourceData = this.data.data;
         // this.getsource(this.id);
        }
        this.configForm();
        this.getSource();
      }

      ngOnDestroy(): void {
        this.onDestroy.next()
        this.onDestroy.complete()
      }
      onClose() {
        this.dialogRef.close(false)
      }

      configForm(){
        this.sourceForm = new FormGroup({
          source_type_name: new FormControl(null, [Validators.required,]),
          source_id:new FormControl(null, Validators.required)


        });
        if(this.sourceData){
          this.sourceForm.patchValue(this.sourceData);
        }
      }

      getSource(){
        this.sourceServices.getAllSource().pipe(takeUntil(this.onDestroy)).subscribe({ next: response=>{
          this.source=response.data;
        }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load sources.')) })

      }

      savesource(){
        if (this.sourceForm.invalid || this.submitting) {
          this.sourceForm.markAllAsTouched();
          return;
        }
        this.submit(this.sources.addSourceType(this.sourceForm.value));
      }

      updatesource(){
        if (this.sourceForm.invalid || this.submitting) {
          this.sourceForm.markAllAsTouched();
          return;
        }
        this.submit(this.sources.updateSource(this.sourceForm.value, this.sourceData.source_type_id));
      }

      private submit(request: any): void {
        this.submitting = true;
        request.pipe(takeUntil(this.onDestroy), finalize(() => this.submitting = false)).subscribe({
          next: (response: any) => {
            if (response.statusCode === 200 || response.statusCode === 201) {
              Swal.fire({
                title: 'Success', text: response.message || 'Source type saved successfully.', icon: 'success',
                confirmButtonColor: '#4690eb', confirmButtonText: 'Continue'
              }).then(() => this.dialogRef.close(true));
              return;
            }
            this.showError(response.message || 'Unable to save the source type.');
          },
          error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the source type.'))
        });
      }

      private showError(message: string): void {
        Swal.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
      }
}
