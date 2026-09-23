import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '@core/authentication/auth.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatIconButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSuffix,
    RouterLink,
    ReactiveFormsModule,
    MatIcon
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  private _router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  email = '';
  token = '';
  invalidLink = false;
  submitting = false;
  hidePassword = true;
  hideConfirmation = true;

  resetForm = new FormGroup({
    new_password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    new_password_confirmation: new FormControl('', [Validators.required]),
  }, { validators: this.passwordsMatch });

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.invalidLink = !this.email || !this.token;
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('new_password')?.value;
    const confirmation = control.get('new_password_confirmation')?.value;
    return password && confirmation && password !== confirmation
      ? { passwordsMismatch: true }
      : null;
  }

  submit(): void {
    if (this.invalidLink || this.resetForm.invalid || this.submitting) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.authService.resetForgottenPassword({
      email: this.email,
      token: this.token,
      new_password: this.resetForm.value.new_password!,
      new_password_confirmation: this.resetForm.value.new_password_confirmation!,
    }).pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.submitting = false)
    ).subscribe({
      next: response => {
        this.uiFeedback.fire('Password updated', response.message, 'success')
          .then(() => this._router.navigateByUrl('/auth/sign-in'));
      },
      error: error => {
        this.uiFeedback.fire('Unable to reset password', getApiErrorMessage(error, 'The reset link may be invalid or expired.'), 'error');
      }
    });
  }
}
