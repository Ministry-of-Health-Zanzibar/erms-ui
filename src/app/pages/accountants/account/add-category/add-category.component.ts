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
import { MatOption, MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CategoryService } from '../../../../services/accountants/category.service';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-add-category',
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
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.scss'
})
export class AddCategoryComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

 readonly data = inject<any>(MAT_DIALOG_DATA);
    private readonly onDestroy = new Subject<void>()
    public sidebarVisible:boolean = true

    categoryForm: FormGroup;
    parent: any;
    uploadProgress: number = 0;
    uploading: boolean = false;
    errorMessage: string | null = null;
    categoryData: any;
    category:any;
    submitting = false;

    constructor(private formBuilder:FormBuilder,

      public categoryServices:CategoryService,
      private dialogRef: MatDialogRef<AddCategoryComponent>) {
    }


    ngOnInit(): void {
        if(this.data){
          this.categoryData = this.data.data;
         // this.getcategory(this.id);
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
        this.categoryForm = new FormGroup({
          category_name: new FormControl(null, [Validators.required,]),


        });
        if(this.categoryData){
          this.categoryForm.patchValue(this.categoryData);
        }
      }

      savecategory(){
        if (this.categoryForm.invalid || this.submitting) {
          this.categoryForm.markAllAsTouched();
          return;
        }
        this.submit(this.categoryServices.addCategory(this.categoryForm.value));
      }

      updatecategory(){
        if (this.categoryForm.invalid || this.submitting) {
          this.categoryForm.markAllAsTouched();
          return;
        }
        this.submit(this.categoryServices.updateCategory(this.categoryForm.value, this.categoryData.category_id));
      }

      private submit(request: any): void {
        this.submitting = true;
        request.pipe(takeUntil(this.onDestroy), finalize(() => this.submitting = false)).subscribe({
          next: (response: any) => {
            if (response.statusCode === 200 || response.statusCode === 201) {
              this.uiFeedback.fire({
                title: 'Success', text: response.message || 'Category saved successfully.', icon: 'success',
                confirmButtonColor: '#4690eb', confirmButtonText: 'Continue'
              }).then(() => this.dialogRef.close(true));
              return;
            }
            this.showError(response.message || 'Unable to save the category.');
          },
          error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the category.'))
        });
      }

      private showError(message: string): void {
        this.uiFeedback.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
      }
}
