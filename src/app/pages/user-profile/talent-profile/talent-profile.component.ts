import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { UserService } from '../../../services/users/user.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { PageHeaderComponent, SectionCardComponent, TextInputComponent } from '@shared/ui';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PageHeaderComponent,
    SectionCardComponent,
    TextInputComponent,
  ],
  templateUrl: './talent-profile.component.html',
  styleUrl: './talent-profile.component.scss',
})
export class TalentProfileComponent implements OnInit {
  readonly genderOptions = ['Male', 'Female'];
  readonly maxDate = new Date(new Date().setHours(23, 59, 59, 999));

  readonly profileForm = new FormGroup({
    first_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    middle_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    last_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    phone_no: new FormControl('', [Validators.required, Validators.maxLength(20)]),
    address: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    gender: new FormControl('', [Validators.required]),
    date_of_birth: new FormControl<Date | null>(null, [Validators.required]),
  });

  profile: any = null;
  roles: string[] = [];
  hospitals: any[] = [];
  loading = true;
  saving = false;
  loadError = false;

  constructor(
    private readonly userService: UserService,
    private readonly uiFeedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.loadError = false;

    this.userService.getMyProfile().subscribe({
      next: response => {
        this.applyProfile(this.profileFromResponse(response));
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.loadError = true;
        this.uiFeedback.error(
          'Unable to load profile',
          getApiErrorMessage(error, 'Your profile could not be loaded. Please try again.'),
        );
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saving) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const values = this.profileForm.getRawValue();
    const payload = {
      ...values,
      date_of_birth: this.formatDate(values.date_of_birth),
    };

    this.saving = true;
    this.userService.updateMyProfile(payload).pipe(
      finalize(() => this.saving = false),
    ).subscribe({
      next: response => {
        const updatedProfile = this.profileFromResponse(response);
        this.applyProfile({ ...this.profile, ...updatedProfile });
        localStorage.setItem('full_name', this.displayName);
        localStorage.setItem('email', this.profileForm.controls.email.value || '');
        this.uiFeedback.toast('Profile updated successfully.', 'success');
      },
      error: error => {
        this.uiFeedback.error(
          'Unable to save profile',
          getApiErrorMessage(error, 'Your profile could not be saved. Please try again.'),
        );
      },
    });
  }

  resetChanges(): void {
    if (this.profile) {
      this.applyProfile(this.profile);
    }
  }

  get displayName(): string {
    const values = this.profileForm.getRawValue();
    return [values.first_name, values.middle_name, values.last_name]
      .filter(value => !!value)
      .join(' ') || 'User profile';
  }

  get initials(): string {
    const values = this.profileForm.getRawValue();
    return [values.first_name, values.last_name]
      .filter(value => !!value)
      .map(value => value!.trim().charAt(0).toUpperCase())
      .join('') || 'ME';
  }

  private applyProfile(data: any): void {
    this.profile = data || {};
    this.roles = (Array.isArray(this.profile.roles) ? this.profile.roles : [])
      .map((role: any) => typeof role === 'string' ? role : role?.name)
      .filter((role: string | undefined): role is string => !!role);
    this.hospitals = Array.isArray(this.profile.hospitals) ? this.profile.hospitals : [];

    this.profileForm.reset({
      first_name: this.profile.first_name || '',
      middle_name: this.profile.middle_name || '',
      last_name: this.profile.last_name || '',
      email: this.profile.email || '',
      phone_no: this.profile.phone_no || '',
      address: this.profile.address || '',
      gender: this.profile.gender || '',
      date_of_birth: this.toDate(this.profile.date_of_birth),
    });
    this.profileForm.markAsPristine();
  }

  private profileFromResponse(response: any): any {
    return response?.data ?? response?.user ?? response ?? {};
  }

  private toDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const parts = String(value).slice(0, 10).split('-').map(Number);
    if (parts.length === 3 && parts.every(part => Number.isFinite(part))) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    return null;
  }

  private formatDate(value: Date | null): string | null {
    if (!value) {
      return null;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
