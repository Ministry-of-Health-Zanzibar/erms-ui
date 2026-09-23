import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { PartientService } from '../../../services/partient/partient.service';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { RolePermissionService } from '../../../services/users/role-permission.service';
import { UserService } from '../../../services/users/user.service';

@Component({
  selector: 'app-addbodylist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
  ],
  templateUrl: './addbodylist.component.html',
  styleUrls: ['./addbodylist.component.scss'],
})
export class AddbodylistComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  readonly data = inject<any>(MAT_DIALOG_DATA);

  patientForm: FormGroup;
  selectedAttachement: File | null = null;
  patientData: any;
  loading = false;

  userList: any[] = [];
  filteredUser: any[] = [];
  userSearch: string = '';
  isLoadingUsers = false;
 minDate: Date | null = null;
maxDate: Date | null = null;

  constructor(
    private patientService: PartientService,
    private memberList: UserService,
    private roleService: RolePermissionService,
    private dialogRef: MatDialogRef<AddbodylistComponent>,
  ) {}

 
 ngOnInit(): void {
  this.configForm();
  this.loadUsers();

  const today = new Date();

  // ✅ Ruhusu dates zote (past + future)
  this.minDate = null;
 this.maxDate = today;

  if (this.data?.data) {
    this.patientData = this.data.data;

    if (this.patientData.board_date) {
      this.patientData.board_date = new Date(this.patientData.board_date);
    }

    this.patientForm.patchValue({
      board_type: this.patientData.board_type,
      board_date: this.patientData.board_date,
      no_of_patients: this.patientData.no_of_patients,
    });

    if (this.patientData.users?.length) {
      const formArray = this.patientForm.get('user_id') as FormArray;
      this.patientData.users.forEach((user: any) =>
        formArray.push(new FormControl(user.user_id)),
      );
    }
  } else {
    this.patientForm.get('board_date')?.setValue(today);
  }
}

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  // ✅ Load users

  loadUsers() {
    this.isLoadingUsers = true;
    this.memberList.getAllMemberList().subscribe({
      next: (res: any) => {
        this.userList = res?.data || [];
        this.filteredUser = [...this.userList];
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Failed to load user', err);
        this.isLoadingUsers = false;
        this.userList = [];
        this.filteredUser = [];
      },
    });
  }

  filterUser() {
    const term = this.userSearch.toLowerCase();
    this.filteredUser = this.userList.filter((u) =>
      u.full_name?.toLowerCase().includes(term),
    );
  }

  onUserSelected(event: any) {
    const selectedIds = event.value;
    const formArray = this.patientForm.get('user_id') as FormArray;
    formArray.clear();
    selectedIds.forEach((id: number) => formArray.push(new FormControl(id)));
  }

  // ✅ Reset filter when dropdown opens
  onUserDropdownOpened() {
    this.filteredUser = [...this.userList];
    this.userSearch = '';
  }

  // ✅ Configure form
  configForm() {
    this.patientForm = new FormGroup({
      board_type: new FormControl(null, [Validators.required]),
      board_date: new FormControl(null, [Validators.required]),
      no_of_patients: new FormControl(null, [
        Validators.required,
        Validators.min(1),
      ]),
      user_id: new FormArray([], Validators.required),
      patient_list_file: new FormControl(null),
    });
  }

  onAttachmentSelected(event: any): void {
    const file = event.target.files?.[0] ?? null;

    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        this.uiFeedback.fire({
          title: 'File Too Large',
          text: 'The file must not exceed 2MB.',
          icon: 'error',
          confirmButtonColor: '#4690eb',
        });

        // Clear selection
        this.selectedAttachement = null;
        this.patientForm.patchValue({ patient_list_file: '' });

        return;
      }

      // ✅ Accept file if valid
      this.selectedAttachement = file;
      this.patientForm.patchValue({ patient_list_file: file.name });

      const control = this.patientForm.get('patient_list_file');
      control?.markAsDirty();
      control?.markAsTouched();
      control?.updateValueAndValidity();
    }
  }

 
  savePatient() {
    if (this.patientForm.invalid) return;

    this.loading = true;

    const formData = new FormData();

    Object.keys(this.patientForm.controls).forEach((key) => {
  
      if (key === 'patient_list_file') {
        if (this.selectedAttachement) {
          formData.append('patient_list_file', this.selectedAttachement);
        }
      }

      
      else if (key === 'board_date') {
        const dateValue = this.patientForm.get('board_date')?.value;
        if (dateValue) {
          const formattedDate = new Date(dateValue).toISOString().split('T')[0]; 
          formData.append('board_date', formattedDate);
        }
      }

      
      else if (key === 'user_id') {
        const userIds = this.patientForm.get('user_id')?.value || [];
        userIds.forEach((id: number) =>
          formData.append('user_id[]', id.toString()),
        );
      }

    
      else {
        const value = this.patientForm.get(key)?.value;
        formData.append(key, value ?? '');
      }
    });

    this.patientService.addBodyList(formData).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.statusCode === 200) {
          this.uiFeedback.fire({
            title: 'Success',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
          });
          this.dialogRef.close(true);
        } else {
          this.uiFeedback.fire({
            title: 'Error',
            text: response.message,
            icon: 'error',
            confirmButtonColor: '#4690eb',
          });
        }
      },
      error: (err) => {
        console.error('Error saving patient:', err);
        this.loading = false;

        this.uiFeedback.fire({
          title: 'Error',
          text: 'Something went wrong. Please try again.',
          icon: 'error',
        });
      },
    });
  }

  updatePatient() {
    if (this.patientForm.invalid) return;

    this.loading = true;

    const formData = new FormData();
    Object.keys(this.patientForm.controls).forEach((key) => {
      if (key === 'patient_list_file') {
        if (this.selectedAttachement) {
          formData.append('patient_list_file', this.selectedAttachement);
        }
      } else if (key === 'board_date') {
        const dateValue = this.patientForm.get('board_date')?.value;
        if (dateValue) {
          const formattedDate = new Date(dateValue).toISOString().split('T')[0];
          formData.append('board_date', formattedDate);
        }
      } else if (key === 'user_id') {
        const userIds = this.patientForm.get('user_id')?.value || [];
        userIds.forEach((id: number) =>
          formData.append('user_id[]', id.toString()),
        );
      } else {
        const value = this.patientForm.get(key)?.value;
        formData.append(key, value ?? '');
      }
    });

    this.patientService
      .updateMedicalBoard(formData, this.patientData.patient_list_id)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.statusCode === 200) {
            this.uiFeedback.fire({
              title: 'Success',
              text: response.message,
              icon: 'success',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Close',
            });
            this.dialogRef.close(true);
          } else {
            this.uiFeedback.fire({
              title: 'Error',
              text: response.message,
              icon: 'error',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Close',
            });
          }
        },
        error: (err) => {
          console.error('Error updating patient:', err);
          this.loading = false;
          this.uiFeedback.fire({
            title: 'Error',
            text: 'Something went wrong. Please try again.',
            icon: 'error',
          });
        },
      });
  }
}
