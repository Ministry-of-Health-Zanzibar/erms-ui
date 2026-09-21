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
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PartientService } from '../../../services/partient/partient.service';
import { LocationService } from '../../../services/system-configuration/location.service';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { response } from 'express';

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
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatAutocompleteModule,
    MatRadioModule,
  ],
  templateUrl: './addmultiplepatient.component.html',
  styleUrls: ['./addmultiplepatient.component.scss'],
})
export class AddmultiplepatientComponent implements OnInit, OnDestroy {
  patients: any[] = [];
  patientForm: FormGroup;
  loading = false;
  private onDestroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private patientService: PartientService,
    private locationService: LocationService,
    public dialogRef: MatDialogRef<AddmultiplepatientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMultiplePatientDialogData
  ) {
    this.patientForm = this.fb.group({
      patient_ids: [[], Validators.required],
      patient_list_id: [this.data.patientFileId, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

 loadPatients() {
  this.patientService.getAllPartientforReferral().subscribe({
    next: (res) => {
      // console.log("Patients loaded:", res);

      // If API returns data inside res.data
      this.patients = res.data;
    },
    error: (err) => {
      console.error('Failed to load patients', err);
    },
  });
}


  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.patientForm.invalid) return;

    this.loading = true;
    const { patient_ids, patient_list_id } = this.patientForm.value;

    const payload = { patient_ids };

    // ✅ Pass both the payload and the ID
    this.patientService.addMultiplePartient(payload, patient_list_id).subscribe({
      next: (res) => {
        this.loading = false;
        Swal.fire('Success', res.message, 'success');
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.loading = false;
        Swal.fire(
          'Error',
          err.error?.message || 'Failed to assign patients',
          'error'
        );
      },
    });
  }
}
