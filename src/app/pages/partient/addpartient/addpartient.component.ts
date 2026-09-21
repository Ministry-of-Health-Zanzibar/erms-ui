import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PartientService } from '../../../services/partient/partient.service';
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardContent,
  MatCardSubtitle,
} from '@angular/material/card';
import { LocationService } from '../../../services/system-configuration/location.service';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';

export interface AddPatientDialogData {
  patientFileId: number;

  referralOptions: any[];
}

@Component({
  selector: 'app-addpartient',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatDialogModule,
    MatCardSubtitle,
    MatAutocomplete,
    MatRadioModule,
  ],
  templateUrl: './addpartient.component.html',
  styleUrl: './addpartient.component.scss',
})
export class AddpartientComponent implements OnInit, OnDestroy {
  patientForm: FormGroup;
  loading = false;
   selectedAttachement: File | null = null;
  // selectedFile: File | null = null;
  patient: any;

  locations: any[] = [];
  options: any[] = [];
  filteredOptions!: Observable<any[]>;

  private onDestroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private patientService: PartientService,
    private locationService: LocationService,
    public dialogRef: MatDialogRef<AddpartientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddPatientDialogData
  ) {
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['', Validators.required],
      job: [''],
      position: [''],
      dob_type: ['known'],
      date_of_birth: [null],
      location_id: ['', Validators.required],
      matibabu_card: ['', [Validators.pattern(/^[0-9]{12}$/)]],
      patient_list_id: [this.data.patientFileId, Validators.required],
      patient_file: [null, Validators.required],
      zan_id: [''],
      has_insurance: [false, Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.data.patientFileId) {
      this.ViewPatient(this.data.patientFileId);
    }
    this.loadLocations();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  private ViewPatient(patientFileId: number) {
    this.patientService
      .getBodyListById(patientFileId)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.patient = res.data;
          } else {
            this.patient = [];
            Swal.fire('Error', res.message || 'No patient found', 'error');
          }
        },
        error: () => {
          this.patient = [];
          Swal.fire('Error', 'Failed to load referrals', 'error');
        },
      });
  }

  private loadLocations() {
    this.locationService.getLocation().subscribe({
      next: (res: any) => {
        this.locations = res.data;
        this.options = res.data;
        this.filteredOptions = this.patientForm
          .get('location_id')!
          .valueChanges.pipe(
            startWith(''),
            map((value: any) =>
              typeof value === 'string' ? value : value?.label
            ),
            map((name: string) =>
              name ? this._filter(name) : this.options.slice()
            )
          );
      },
      error: (err) => console.error('Failed to load locations', err),
    });
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.options.filter((option) =>
      option.label.toLowerCase().includes(filterValue)
    );
  }

  displayFn(option: any): string {
    return option ? option.label : '';
  }

  trackById(index: number, option: any): any {
    return option.location_id;
  }

  onAttachmentSelected(event: any): void {
  const file = event.target.files?.[0] ?? null;

  if (!file) return;

  const maxSize = 2 * 1024 * 1024; // 2MB

  if (file.size > maxSize) {
    Swal.fire({
      title: 'File Too Large',
      text: 'The file must not exceed 2MB.',
      icon: 'error',
      confirmButtonColor: '#4690eb',
    });

    // ❌ Reset file
    event.target.value = '';
    this.selectedAttachement = null;

    // ❌ Reset form input
    this.patientForm.patchValue({ patient_file: '' });

    // Force Angular validation to run
    const control = this.patientForm.get('patient_file');
    control?.markAsDirty();
    control?.markAsTouched();
    control?.updateValueAndValidity();

    return;
  }

  // ✅ Valid file
  this.selectedAttachement = file;
  this.patientForm.patchValue({ patient_file: file.name });

  const control = this.patientForm.get('patient_file');
  control?.markAsDirty();
  control?.markAsTouched();
  control?.updateValueAndValidity();
}


  // onFileSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     this.selectedFile = file;
  //     this.patientForm.patchValue({ patient_file: file });
  //     this.patientForm.get('patient_file')?.updateValueAndValidity();
  //   }
  // }

  onCancel() {
    this.dialogRef.close();
  }
  private formatDate(value: Date | string | number, dobType: string): string {
    if (dobType === 'known') {
      const d = new Date(value);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (dobType === 'unknown') {
      // Estimated age saved as number string
      return String(value);
    }
    return '';
  }

  onSubmit() {
    if (this.patientForm.valid) {
      this.loading = true;
      const formValue = this.patientForm.value;
      const formData = new FormData();

      formData.append('name', formValue.name);
      formData.append('phone', formValue.phone);
      formData.append('gender', formValue.gender);
      formData.append('job', formValue.job || '');
      formData.append('position', formValue.position || '');
      formData.append('matibabu_card', formValue.matibabu_card || '');
      formData.append('patient_list_id', formValue.patient_list_id);
      formData.append('zan_id', formValue.zan_id || '');
      formData.append(
        'has_insurance',
        formValue.has_insurance ? 'true' : 'false'
      );

      // Format DOB correctly
      formData.append(
        'date_of_birth',
        this.formatDate(formValue.date_of_birth, formValue.dob_type)
      );

      const location = formValue.location_id;
      formData.append(
        'location_id',
        typeof location === 'object' ? location.location_id : location
      );

      // if (this.onAttachmentSelected) {
      //   formData.append(
      //     'patient_file',
      //     this.selectedFile,
      //     this.selectedFile.name
      //   );
      // }

      this.patientService.addPartient(formData).subscribe({
        next: (res) => {
          this.loading = false;
          Swal.fire('Success', 'Patient saved successfully', 'success');
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          Swal.fire(
            'Error',
            err.error?.message || 'Failed to save patient',
            'error'
          );
        },
      });
    }
  }
}
