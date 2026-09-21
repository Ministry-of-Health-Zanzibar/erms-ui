import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { finalize, map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { EmployerService } from '../../../../services/system-configuration/employer.service';
import { EmployerTypeComponent } from '../../employer-type/employer-type/employer-type.component';
import { EmployerTypeService } from '../../../../services/system-configuration/employer-type.service';
import { GlobalConstants } from '@shared/global-constants';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-add-employer',
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
    AsyncPipe
  ],
  templateUrl: './add-employer.component.html',
  styleUrl: './add-employer.component.scss'
})
export class AddEmployerComponent implements OnInit, OnDestroy {

  private readonly onDestroy = new Subject<void>()
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible:boolean = true

  employerForm: FormGroup;
  employer: any;
  id: any;
  employerTypes: any;
  options: any[] = [];
  myControl = new FormControl('');
  filteredOptions: Observable<any[]>;
  submitting = false;

  constructor(
    private employerService: EmployerService,
    private employerTypeService: EmployerTypeService,
    private dialogRef: MatDialogRef<AddEmployerComponent>) {

  }

  ngOnInit(): void {
    this.configForm();
    if(this.data){
      this.id = this.data.id;
      this.getEmployer(this.id);
    }
    this.getEmployerType();
  }

  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }

  onClose() {
    this.dialogRef.close(false)
  }

  configForm(){
    this.employerForm = new FormGroup({
      employer_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
      employer_email: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.emailRegex)]),
      employer_phone: new FormControl(null, [Validators.required,Validators.pattern(GlobalConstants.phoneNoRegex)]),
      employer_type_id: new FormControl(null, Validators.required),
    });
  }

  getEmployerType() {
    this.employerTypeService.getAllEmployerType().pipe(takeUntil(this.onDestroy)).subscribe({ next: response => {
      this.employerTypes = response.data;
      this.options = response.data;
      this.filteredOptions = this.employerForm.get('employer_type_id')!.valueChanges.pipe(
        startWith(''),
        map((value: any) => typeof value === 'string' ? this._filter(value) : this.options.slice())
      );
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load employer types.')) });
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.employer_type_name.toLowerCase().includes(filterValue));
  }

  displayFn(option: any): string {
    return option ? option.employer_type_name : '';
  }

  trackById(index: number, option: any): any {
    return option.employer_type_id;
  }

  getEmployer(id: any) {
    this.employerService.getIEmployerById(id).pipe(takeUntil(this.onDestroy)).subscribe({ next: response=>{
      if(response.statusCode == 200){
        this.employer = response.data[0];
        this.employerForm.patchValue(this.employer);
        this.employerForm.patchValue({
          employer_type_id: {employer_type_id: this.employer.employer_type_id, employer_type_name: this.employer.employer_type_name}
        });
      }
      else{
        Swal.fire({
          title: "error",
          text: response.message,
          icon: "error",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Close"
        });
      }
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load the employer.')) })
  }

  saveEmployer(){
    this.save(false);
  }

  updateEmployer(){
    this.save(true);
  }

  private save(isUpdate: boolean): void {
    if (this.employerForm.invalid || this.submitting) {
      this.employerForm.markAllAsTouched();
      return;
    }

    const selectedType = this.employerForm.value.employer_type_id;
    const payload = {
      ...this.employerForm.value,
      employer_type_id: typeof selectedType === 'object' ? selectedType?.employer_type_id : selectedType
    };
    const request = isUpdate
      ? this.employerService.updateEmployer(payload, this.id)
      : this.employerService.addEmployer(payload);

    this.submitting = true;
    request.pipe(takeUntil(this.onDestroy), finalize(() => this.submitting = false)).subscribe({
      next: response => {
        if (response.statusCode === 200 || response.statusCode === 201) {
          Swal.fire({
            title: 'Success',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue'
          }).then(() => this.dialogRef.close(true));
          return;
        }
        this.showError(response.message || 'Unable to save the employer.');
      },
      error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the employer.'))
    });
  }

  private showError(message: string): void {
    Swal.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
  }
}
