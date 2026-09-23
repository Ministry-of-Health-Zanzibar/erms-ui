import { PartientService } from '../../../services/partient/partient.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { HDividerComponent } from '@elementar/components';
import { finalize, map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { LocationService } from '../../../services/system-configuration/location.service';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-insurance',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatLabel,
    MatDialogModule,

    MatError,
    ReactiveFormsModule,

    MatAutocompleteModule,
    MatSelect,
    MatDatepickerModule,
  ],
  templateUrl: './insurance.component.html',
  styleUrl: './insurance.component.scss'
})
export class InsuranceComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible:boolean = true

  patientForm: FormGroup;
  user: any;
  id: any;
   locations: any;
   options: any[] = [];
  myControl = new FormControl('');
  filteredOptions: Observable<any[]>;
  selectedAttachement: File | null = null;
  submitting = false;



  constructor(

    private insurance:PartientService,
    private locationService: LocationService,
    private dialogRef: MatDialogRef<InsuranceComponent>)
    {

  }

  ngOnInit(): void {
    this.configForm();
    if(this.data){
      this.id = this.data.id;
   // console.log("partient   here  ",this.id);
    }
    this.getLocation();
   // this.viewUser();

  }



  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }

  onClose() {
    this.dialogRef.close(false)
  }

  configForm(){
    this.patientForm = new FormGroup({
          patient_list_id: new FormControl(this.id),

          name: new FormControl(null, [Validators.required]),
           gender: new FormControl(null, Validators.required),
           location_id: new FormControl(null, ),
          //  location: new FormControl(null, Validators.required),
           phone: new FormControl(null, Validators.required),
           job: new FormControl(null,),
           position: new FormControl(null,),
           date_of_birth: new FormControl(null, Validators.required),
           patient_file: new FormControl(null, Validators.required),


    });
  }

   onAttachmentSelected(event: any): void {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      this.patientForm.patchValue({ patient_file: file.name });
      this.selectedAttachement = file;
    }
  }

   getLocation() {
    this.locationService.getLocation().pipe(takeUntil(this.onDestroy)).subscribe({ next: response => {
      this.locations = response.data;

      this.options = response.data;
      this.filteredOptions = this.patientForm.get('location_id')!.valueChanges.pipe(
        startWith(''),
        map((value: any) => typeof value === 'string' ? this._filter(value) : this.options.slice())
      );
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load locations.')) });
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.label.toLowerCase().includes(filterValue));
  }

  displayFn(option: any): string {
    return option ? option.label : '';
  }

  trackById(index: number, option: any): any {
    return option.location_id;
  }

saveClient(): void {
  if (this.patientForm.invalid || this.submitting) {
    this.patientForm.markAllAsTouched();
    return;
  }

    const formData = new FormData();

   Object.keys(this.patientForm.value).forEach(key => {
  const value = this.patientForm.value[key];
  if (key === 'location_id' && value) {
    formData.append('location_id', typeof value === 'object' ? value.location_id : value);
  } else if (key !== 'patient_file' && key !== 'patient_list_id') {
    formData.append(key, value ?? '');
  }
});


    // ✅ append the actual file
    if (this.selectedAttachement) {
      formData.append('patient_file', this.selectedAttachement, this.selectedAttachement.name);
    }

    // append patient_list_id explicitly
    formData.append('patient_list_id', this.id);

    this.submitting = true;
    this.insurance.addPatientfromBodyList(formData).pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.submitting = false)
    ).subscribe({ next: response => {
      if (response.statusCode === 201) {
        this.uiFeedback.fire({
          title: "Success",
          text: response.message,
          icon: "success",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Continue"
        }).then(() => this.dialogRef.close(true));
        return;
      } else {
        this.showError(response.message || 'Unable to add the patient.');
      }
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to add the patient. Please try again.')) });
}

private showError(message: string): void {
  this.uiFeedback.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
}










}
