import { CommonModule } from '@angular/common';
import { inject, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../../../services/users/user.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { LoadingStateComponent } from '@shared/ui';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-assign-user-hospital',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    LoadingStateComponent
  ],
  templateUrl: './assign-user-hospital.component.html',
  styleUrls: ['./assign-user-hospital.component.scss']
})
export class AssignUserHospitalComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();

  assignForm!: FormGroup;
  hospitals: any[] = [];
  roles: string[] = [
    'Hospital Admin',
    'Hospital Doctor',
    'Hospital Nurse',
    'Hospital Pharmacist',
    'Pediatrics',
    'Oncology',
    'Internal Medicine',
    'Surgery',
    'Obstetrics',
    'Gynaecology',
    'Emergency',
    'Orthopaedic',
    'Urology',
    'Ophthalmology',
    'Neuro surg',
    'Dermatologist',
    'Cardiology',
    'Physician'

  ];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<AssignUserHospitalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.assignForm = this.fb.group({
      hospital_id: ['', Validators.required], // Use hospital_id instead of name
      role: ['', Validators.required]
    });

    this.loadHospitals();
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  loadHospitals(): void {
    this.loading = true;
    this.userService.getHospitals().pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        this.hospitals = res.data; 
      },
      error: () => {
        this.uiFeedback.fire({
          title: 'Error',
          text: 'Failed to load hospitals',
          icon: 'error',
          confirmButtonColor: '#4690eb'
        });
      }
    });
  }

  submit(): void {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const payload = {
      hospital_id: this.assignForm.value.hospital_id, 
      role: this.assignForm.value.role
    };

    this.loading = true;

    this.userService.assignHospitalToUser(this.data.userId, payload).pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        this.uiFeedback.fire({
          title: 'Success',
          text: res.message || 'Hospital assigned successfully',
          icon: 'success',
          confirmButtonColor: '#4690eb'
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.uiFeedback.fire({
          title: 'Error',
          text: getApiErrorMessage(err, 'Failed to assign hospital'),
          icon: 'error',
          confirmButtonColor: '#4690eb'
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
