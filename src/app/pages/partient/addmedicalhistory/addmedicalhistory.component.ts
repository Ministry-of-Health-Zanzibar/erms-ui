import { CommonModule } from '@angular/common';
import { inject,
  Component,
  Inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  FormArray,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardContent,
  MatCardSubtitle,
} from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { Observable, of, Subject } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';

import { DiagnosisService } from '../../../services/system-configuration/diagnosis.service';
import { MedicalhistoryService } from '../../../services/partient/medicalhistory.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-addmedicalhistory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardSubtitle,
    MatRadioModule,
  ],
  templateUrl: './addmedicalhistory.component.html',
  styleUrls: ['./addmedicalhistory.component.scss'],
})
export class AddmedicalhistoryComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  medicalForm!: FormGroup;
  loading = false;
  backendErrors: any = {};
  reasonList: any[] = [];
  selectedFile: File | null = null;
  diagnosesList: any[] = [];
  filteredDiagnoses: any[] = [];
  diagnosisSearch = '';
  loadingDiagnoses = false;
  private onDestroy$ = new Subject<void>();
  private diagnosisSearch$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private diagnosisService: DiagnosisService,
    private reasonServices: ReasonsService,
    private medicalHistoryService: MedicalhistoryService,
    public dialogRef: MatDialogRef<AddmedicalhistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    // console.log('Dialog received data:', this.data);

    const patient = this.data;
  

    const filePatientId = patient.patient_id;
    

    this.buildForm(patient);
    this.setupDiagnosisSearch();
    this.loadReasons();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  buildForm(patient?: any) {
    this.medicalForm = this.fb.group({
      patient_id: [patient.patient_id || '', Validators.required],
      referring_doctor: ['', Validators.required],
      file_number: ['', Validators.required],
      referring_date: [''],
      history_of_presenting_illness: ['', Validators.required],
      physical_findings: ['', Validators.required],
      investigations: ['', Validators.required],
      management_done: ['', Validators.required],
      reason_id: ['', Validators.required],
      diagnosis_ids: [[], Validators.required],
      history_file: [null, Validators.required],
      case_type:[null, Validators.required],
    });
  }

  loadReasons() {
    this.reasonServices.getAllReasons().subscribe({
      next: (res: any) => {
        this.reasonList = res.data || [];
      },
      error: (err) => console.error('Failed to load reasons', err),
    });
  }

  private setupDiagnosisSearch(): void {
    this.diagnosisSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          const query = search.trim();
          if (query.length < 2) {
            return of([]);
          }

          this.loadingDiagnoses = true;
          return this.diagnosisService.searchDiagnosis(query, 20).pipe(
            map((response: any) => response?.data || []),
            catchError(() => of([])),
          );
        }),
        takeUntil(this.onDestroy$),
      )
      .subscribe((diagnoses: any[]) => {
        this.diagnosesList = diagnoses;
        this.filteredDiagnoses = diagnoses;
        this.loadingDiagnoses = false;
      });
  }




  onDiagnosesSelected(event: any) {
    // console.log('Diagnoses selected:', event.value);
    this.medicalForm.patchValue({
      diagnosis_ids: event.value
    });
  }

 onDiagnosesDropdownOpened() {
  this.filteredDiagnoses = [];
  this.diagnosisSearch = '';
}


  filterDiagnoses() {
  this.diagnosisSearch$.next(this.diagnosisSearch);
}

normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // remove extra spaces
}


  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.medicalForm.patchValue({ history_file: file });
      this.medicalForm.get('history_file')?.updateValueAndValidity();
    }
  }

  onCancel() {
    this.dialogRef.close({ success: false });
  }

  onSubmit() {
    // console.log('Form submitted');
    if (this.medicalForm.invalid) {
      // console.log('Form is invalid');
      this.medicalForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formValue = this.medicalForm.value;
    const formData = new FormData();


    formData.append('patient_id', formValue.patient_id);
    formData.append('referring_doctor', formValue.referring_doctor);
    formData.append('file_number', formValue.file_number);
    formData.append('referring_date', formValue.referring_date);
    formData.append('reason_id', formValue.reason_id);
    formData.append('history_of_presenting_illness', formValue.history_of_presenting_illness);
    formData.append('physical_findings', formValue.physical_findings);
    formData.append('investigations', formValue.investigations);
    formData.append('management_done', formValue.management_done);
     formData.append('case_type', formValue.case_type);


    if (Array.isArray(formValue.diagnosis_ids)) {
      formValue.diagnosis_ids.forEach((id: number) => {
        formData.append('diagnosis_ids[]', id.toString());
      });
    }


    if (this.selectedFile) {
      formData.append('history_file', this.selectedFile, this.selectedFile.name);
    }

    // console.log('Submitting form data...');

    this.medicalHistoryService.addMedical(formData).subscribe({
      next: (res: any) => {
        // console.log('Success response:', res);
        this.loading = false;


        this.dialogRef.close({
          success: true,
          data: res
        });
      },
      error: (err) => {
        console.error('Backend error:', err);
        this.backendErrors = err.error?.errors || {};
        this.uiFeedback.fire('Error', 'Failed to save medical history', 'error');
        this.loading = false;
      },
    });
  }
}
