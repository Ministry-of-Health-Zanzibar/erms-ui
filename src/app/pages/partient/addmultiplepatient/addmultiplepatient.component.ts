import { inject, Component, Inject, OnInit, OnDestroy } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FeedbackService } from '@shared/services/feedback.service';
import { FormHeaderComponent } from '@shared/ui';
import { PartientService } from '../../../services/partient/partient.service';
import { FilterSelectComponent } from '@shared/ui';

export interface AddMultiplePatientDialogData {
  patientFileId: number;
  referralOptions: any[];
}

@Component({
  selector: 'app-addmultiplepatient',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    FormHeaderComponent,
    FilterSelectComponent,
  ],
  templateUrl: './addmultiplepatient.component.html',
  styleUrls: ['./addmultiplepatient.component.scss'],
})
export class AddmultiplepatientComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  patients: any[] = [];
  patientForm: FormGroup;
  loading = false;
  loadingPatients = false;
  loadError = '';
  patientSearch = '';
  private readonly searchChanged$ = new Subject<string>();
  private onDestroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private patientService: PartientService,
    public dialogRef: MatDialogRef<AddmultiplepatientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMultiplePatientDialogData
  ) {
    this.patientForm = this.fb.group({
      patient_ids: [[], Validators.required],
      patient_list_id: [this.data.patientFileId, Validators.required],
    });
  }

  ngOnInit(): void {
    this.searchChanged$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.onDestroy$))
      .subscribe(() => this.loadPatients());
    this.loadPatients();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  get selectedPatientCount(): number {
    return (this.patientForm.get('patient_ids')?.value || []).length;
  }

  loadPatients(): void {
    this.loadingPatients = true;
    this.loadError = '';

    this.patientService.getAllPartientforReferral({
      page: 1,
      per_page: 25,
      search: this.patientSearch,
    }).subscribe({
      next: (res) => {
        const selectedIds = new Set<number>(this.patientForm.get('patient_ids')?.value || []);
        const incoming = (res.data || []).map((patient: any) => ({
          ...patient,
          selection_label: this.patientSelectionLabel(patient),
        }));
        const selectedPatients = this.patients.filter((patient) => selectedIds.has(patient.patient_id));
        this.patients = [
          ...selectedPatients,
          ...incoming.filter((patient: any) => !selectedIds.has(patient.patient_id)),
        ];
        this.loadingPatients = false;
      },
      error: (err) => {
        console.error('Failed to load patients', err);
        this.loadingPatients = false;
        this.loadError = err.error?.message || 'Unable to load available patients.';
      },
    });
  }

  onPatientSearch(searchTerm: string): void {
    this.patientSearch = searchTerm.trim();
    this.searchChanged$.next(this.patientSearch);
  }

  private patientSelectionLabel(patient: any): string {
    const details = [patient?.phone, patient?.matibabu_card].filter(Boolean).join(' · ');
    return [patient?.name || 'Unnamed patient', details].filter(Boolean).join(' — ');
  }


  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { patient_ids, patient_list_id } = this.patientForm.value;

    const payload = { patient_ids };

    // ✅ Pass both the payload and the ID
    this.patientService.addMultiplePartient(payload, patient_list_id).subscribe({
      next: (res) => {
        this.loading = false;
        this.uiFeedback.fire('Success', res.message, 'success');
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.loading = false;
        this.uiFeedback.fire(
          'Error',
          err.error?.message || 'Failed to assign patients',
          'error'
        );
      },
    });
  }
}
