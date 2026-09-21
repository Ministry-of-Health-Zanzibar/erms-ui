import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
  FormArray,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PartientService } from '../../../services/partient/partient.service';
import { LocationService } from '../../../services/system-configuration/location.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { DiagnosisService } from '../../../services/system-configuration/diagnosis.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import Swal from 'sweetalert2';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-partient-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatSnackBarModule,
    MatDividerModule,
    MatIconModule,
    MatAutocompleteModule,
    MatChipsModule,
  ],
  templateUrl: './partient-form.component.html',
})
export class PartientFormComponent implements OnInit {
  patientForm!: FormGroup;
  loading = false;
  isLoadingDiagnoses: boolean = false;
  isEligible = false;
  emails: any;
  id: any;
  fileError: string = '';
  isEditMode = false;
  selectedFile: File | null = null;
  locations: any[] = [];
  locationFilterCtrl = new FormControl('');
  filteredLocations: any[] = [];

  reasonList: any[] = [];
  diagnosesList: any[] = [];
  diagnosisSearchCtrl = new FormControl('');
  filteredDiagnoses: any[] = [];
  selectedDiagnoses: any[] = [];
  history_file?: string;
  historyFileUrl: string | null = null;

  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;
  @ViewChild('diagInput') diagInput!: any;

  constructor(
    private fb: FormBuilder,
    private patientService: PartientService,
    private locationService: LocationService,
    private reasonService: ReasonsService,
    private diagnosisService: DiagnosisService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PartientFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadReasons();
    this.loadDiagnoses();
    this.emails = localStorage.getItem('email');
    this.applyMatibabuCardValidation();

    if (this.data?.patient?.patient_id) {
      this.isEditMode = true;
      this.id = this.data.patient.patient_id;

      this.loadLocations(() => {
        this.getPatientById(this.id);
      });
    } else {
      this.loadLocations(() => {
        this.listenToMatibabuCard();
      });
    }
  }

  // onLocationSelected(location: any) {
  //   this.patientForm.get('basicInfo.location_id')?.setValue(location);
  //   this.locationFilterCtrl.setValue(location);
  // }

  onLocationSelected(location: any) {
    this.patientForm.get('basicInfo.location_id')?.setValue(location);

    this.locationFilterCtrl.setValue(location);
  }

  applyMatibabuCardValidation() {
    const control = this.patientForm.get('basicInfo.matibabu_card');

    if (!control) return;

    if (this.emails === 'hospital@mohz.go.tz') {
      // NOT required (only pattern if value exists)
      control.setValidators([
        Validators.pattern(/^\d{12}$/), // optional but must be 12 digits if filled
      ]);
    } else {
      // REQUIRED + 12 digits
      control.setValidators([
        Validators.required,
        Validators.pattern(/^\d{12}$/),
      ]);
    }
    control.updateValueAndValidity();
  }

  private initForm() {
    this.patientForm = this.fb.group({
      basicInfo: this.fb.group({
        name: ['', Validators.required],
        matibabu_card: [''],
        zan_id: ['', [Validators.required]],
        date_of_birth: ['', Validators.required],
        gender: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        location_id: [null, Validators.required],
        job: [''],
        position: [''],
      }),
      historyInfo: this.fb.group({
        file_number: ['', Validators.required],
        referring_date: ['', Validators.required],
        reason_id: ['', Validators.required],
        diagnosis_ids: [[], Validators.required],
        case_type: ['Routine', Validators.required],
        history_of_presenting_illness: ['', Validators.required],
        physical_findings: ['', Validators.required],
        investigations: ['', Validators.required],
        management_done: ['', Validators.required],
      }),
      insuranceInfo: this.fb.group({
        has_insurance: [false],
        insurance_provider_name: [''],
        card_number: [''],
        valid_until: [''],
      }),
    });
  }

  getPatientById(id: any) {
    if (!id) return;

    this.patientService.showForUpdate(id).subscribe({
      next: (response: any) => {
        if (!response?.data) return;

        const patient = response.data.patient;
        const history = response.data.history;
        const insurance = response.data.insurance;

        this.locationFilterCtrl.setValue(patient?.location_details || '');
        const historyFile = response.data.history?.history_file;

        this.historyFileUrl = historyFile;

        this.patientForm.patchValue({
          basicInfo: {
            name: patient?.name || '',
            matibabu_card: patient?.matibabu_card || '',
            zan_id: patient?.zan_id || '',
            date_of_birth: patient?.date_of_birth
              ? new Date(patient.date_of_birth)
              : '',
            gender: patient?.gender || '',
            phone: patient?.phone || '',
            job: patient?.job || '',
            position: patient?.position || '',
            location_id: patient?.location_details || null,
          },

          historyInfo: {
            file_number: history?.file_number || '',
            referring_date: history?.referring_date
              ? new Date(history.referring_date)
              : '',
            case_type: history?.case_type || 'Routine',
            history_of_presenting_illness:
              history?.history_of_presenting_illness || '',
            physical_findings: history?.physical_findings || '',
            investigations: history?.investigations || '',
            management_done: history?.management_done || '',
            reason_id: history?.reason_details?.reason_id || '',
          },

          insuranceInfo: {
            has_insurance: insurance?.has_insurance || false,
            insurance_provider_name: insurance?.insurance_provider_name || '',
            card_number: insurance?.card_number || '',
            valid_until: insurance?.valid_until
              ? new Date(insurance.valid_until)
              : '',
          },
        });

        if (history?.diagnoses?.length) {
          this.selectedDiagnoses = history.diagnoses;

          this.patientForm
            .get('historyInfo.diagnosis_ids')
            ?.setValue(history.diagnoses.map((d: any) => d.diagnosis_id));
        }
      },
      error: (err) => {
        console.error('Error loading patient:', err);
      },
    });
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private listenToMatibabuCard() {
    this.patientForm
      .get('basicInfo.matibabu_card')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: string) => {
        if (value?.length === 12) {
          this.checkEligibility(value);
        } else {
          this.isEligible = false;
          this.clearBasicInfo();
        }
      });
  }

  // private clearBasicInfo() {
  //   this.patientForm.get('basicInfo')?.patchValue(
  //     {
  //       name: '',
  //       zan_id: '',
  //       date_of_birth: '',
  //       gender: '',
  //       phone: '',
  //       location_id: null,
  //       job: '',
  //       position: '',
  //     },
  //     { emitEvent: false },
  //   );
  // }

  // private checkEligibility(matibabuCard: string) {
  //   this.patientService
  //     .searchPatientEligibility({ matibabu_card: matibabuCard })
  //     .subscribe({
  //       next: (res: any) => {
  //         const patient = res.data;
  //         this.isEligible = res.success === false;

  //         this.snackBar.open(res.message || 'Patient found', 'Close', {
  //           duration: 4000,
  //         });

  //         this.patientForm.get('basicInfo')?.patchValue({
  //           name: patient?.name || '',
  //           zan_id: patient?.zan_id || '',
  //           date_of_birth: patient?.date_of_birth
  //             ? new Date(patient.date_of_birth)
  //             : '',
  //           gender: patient?.gender
  //             ? patient.gender.toLowerCase() === 'male'
  //               ? 'Male'
  //               : 'Female'
  //             : '',
  //           phone: patient?.phone || '',
  //           location_id: patient?.location_id
  //             ? Number(patient.location_id)
  //             : null,
  //           job: patient?.job || '',
  //           position: patient?.position || '',
  //         });
  //       },
  //       error: (err) => {
  //         this.isEligible = false;
  //         this.clearBasicInfo();
  //         this.snackBar.open(
  //           err?.error?.message || 'No patient found',
  //           'Close',
  //           { duration: 4000 },
  //         );
  //       },
  //     });
  // }

  private clearBasicInfo() {

  this.patientForm.get('basicInfo')?.patchValue(
    {
      name: '',
      zan_id: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      location_id: null,
      job: '',
      position: '',
    },
    { emitEvent: false },
  );


  // Clear location autocomplete display
  this.locationFilterCtrl.setValue('', {
    emitEvent: false
  });


  // Clear filtered list
  this.filteredLocations = [...this.locations];

}

  private checkEligibility(matibabuCard: string) {
    this.patientService
      .searchPatientEligibility({ matibabu_card: matibabuCard })
      .subscribe({
        next: (res: any) => {
          const patient = res.data;

          this.isEligible = res.success === false;

          this.snackBar.open(res.message || 'Patient found', 'Close', {
            duration: 4000,
          });

          this.patientForm.get('basicInfo')?.patchValue({
            name: patient?.name || '',

            zan_id: patient?.zan_id || '',

            date_of_birth: patient?.date_of_birth
              ? new Date(patient.date_of_birth)
              : '',

            gender: patient?.gender
              ? patient.gender.toLowerCase() === 'male'
                ? 'Male'
                : 'Female'
              : '',

            phone: patient?.phone || '',

            // keep form value
            location_id: patient?.location_id
              ? Number(patient.location_id)
              : null,

            job: patient?.job || '',

            position: patient?.position || '',
          });

          // ================================
          // FIX LOCATION AUTOCOMPLETE DISPLAY
          // ================================

          if (patient?.geographical_location) {
            this.locationFilterCtrl.setValue(patient.geographical_location);
          } else if (patient?.location_id) {
            const selectedLocation = this.locations.find(
              (loc) => Number(loc.location_id) === Number(patient.location_id),
            );

            if (selectedLocation) {
              this.locationFilterCtrl.setValue(selectedLocation);
            }
          }
        },

        error: (err) => {
          this.isEligible = false;

          this.clearBasicInfo();

          this.locationFilterCtrl.setValue('');

          this.snackBar.open(
            err?.error?.message || 'No patient found',
            'Close',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  loadLocations(callback?: () => void) {
    this.locationService.getLocation().subscribe({
      next: (res: any) => {
        this.locations = res.data || [];
        this.filteredLocations = [...this.locations];

        this.listenToLocationSearch();

        if (callback) {
          callback();
        }
      },
    });
  }

  displayLocation(location: any): string {
    if (!location) return '';
    return typeof location === 'string'
      ? location
      : location.location_name || '';
  }

  listenToLocationSearch() {
    this.locationFilterCtrl.valueChanges.subscribe((search: any) => {
      const searchValue =
        typeof search === 'string' ? search : search?.location_name || '';

      const value = searchValue.toLowerCase().trim();

      if (!value) {
        this.filteredLocations = [...this.locations];
        return;
      }

      this.filteredLocations = this.locations.filter((loc) => {
        const name = (loc.location_name || loc.label || '').toLowerCase();
        return name.includes(value);
      });
    });
  }

  compareLocation = (a: any, b: any): boolean => {
    return Number(a) === Number(b);
  };

  loadReasons() {
    this.reasonService
      .getAllReasons()
      .subscribe((res) => (this.reasonList = res.data || []));
  }

  loadDiagnoses() {
    this.diagnosisSearchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((search: string | null) => {
        const value = (search || '').trim();

        if (value.length < 2) {
          this.filteredDiagnoses = [];
          return;
        }

        this.isLoadingDiagnoses = true;

        this.diagnosisService.searchDiagnosis(value).subscribe({
          next: (res) => {
            this.filteredDiagnoses = res.data || [];
            this.isLoadingDiagnoses = false;
          },
          error: () => {
            this.filteredDiagnoses = [];
            this.isLoadingDiagnoses = false;
          },
        });
      });
  }

  addDiagnosis(diagnosis: any) {
    const exists = this.selectedDiagnoses.find(
      (d) => d.diagnosis_id === diagnosis.diagnosis_id,
    );

    if (!exists) {
      this.selectedDiagnoses.push(diagnosis);

      const ids = this.selectedDiagnoses.map((d) => d.diagnosis_id);

      this.patientForm.get('historyInfo.diagnosis_ids')?.setValue(ids);

      this.patientForm.get('historyInfo.diagnosis_ids')?.markAsDirty();

      this.patientForm
        .get('historyInfo.diagnosis_ids')
        ?.updateValueAndValidity();
    }

    // ✅ 1. clear text input (Reactive Form)
    this.diagnosisSearchCtrl.setValue('');

    // ✅ 2. clear dropdown results
    this.filteredDiagnoses = [];

    // ✅ 3. close autocomplete panel properly
    this.autoTrigger?.closePanel();

    // ✅ 4. force DOM reset (fix stuck text issue)
    setTimeout(() => {
      if (this.diagInput?.nativeElement) {
        this.diagInput.nativeElement.value = '';
        this.diagInput.nativeElement.focus(); // ✅ keep typing without click
      }
    });
  }

  removeDiagnosis(diagnosis: any) {
    this.selectedDiagnoses = this.selectedDiagnoses.filter(
      (d) => d.diagnosis_id !== diagnosis.diagnosis_id,
    );
    this.patientForm
      .get('historyInfo.diagnosis_ids')
      ?.setValue(this.selectedDiagnoses.map((d) => d.diagnosis_id));
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) {
      this.selectedFile = null;
      this.fileError = 'History file is required';
      return;
    }

    const maxSize = 1 * 1024 * 1024;

    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'File must be less than 1 MB',
      });

      (event.target as HTMLInputElement).value = '';
      this.selectedFile = null;
      this.fileError = 'File must be less than 1 MB';
      return;
    }

    this.selectedFile = file;
    this.fileError = '';
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode && !this.selectedFile) {
      Swal.fire({
        icon: 'error',
        title: 'Missing File',
        text: 'Please upload the History PDF file (Max 1MB)',
      });
      return;
    }

    this.loading = true;
    const formData = new FormData();
    const { basicInfo, historyInfo, insuranceInfo } = this.patientForm.value;

    Object.keys(basicInfo).forEach((key) => {
      let value = basicInfo[key];

      if (key === 'location_id') {
        value = basicInfo.location_id?.location_id;
      }

      if (value !== null && value !== '') {
        formData.append(
          key,
          key === 'date_of_birth' ? this.formatDate(value) : value,
        );
      }
    });

    Object.keys(historyInfo).forEach((key) => {
      let value = historyInfo[key];
      if (value !== null && value !== '') {
        if (key === 'referring_date') {
          formData.append(key, this.formatDate(value));
        } else if (key === 'diagnosis_ids') {
          value.forEach((id: any) => formData.append('diagnosis_ids[]', id));
        } else {
          formData.append(key, value);
        }
      }
    });

    Object.keys(insuranceInfo).forEach((key) => {
      let value = insuranceInfo[key];
      if (key === 'has_insurance') {
        formData.append(key, value ? '1' : '0');
      } else if (value) {
        formData.append(
          key,
          key === 'valid_until' ? this.formatDate(value) : value,
        );
      }
    });

    if (this.selectedFile) {
      formData.append('history_file', this.selectedFile);
    }

    const request = this.isEditMode
      ? this.patientService.updatePatient(this.id, formData)
      : this.patientService.addPartient(formData);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        this.snackBar.open(
          this.isEditMode
            ? 'Patient updated successfully'
            : 'Patient saved successfully',
          'Close',
          { duration: 4000 },
        );
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.error?.message || 'Error occurred', 'Close', {
          duration: 5000,
        });
      },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
