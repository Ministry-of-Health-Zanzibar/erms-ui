import { Component, inject, OnDestroy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '@core/authentication/auth.service';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    RouterLink,
    ReactiveFormsModule,
    MatIcon,
    NgIf
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  private _router = inject(Router);
  private authService = inject(AuthService);

  email = new FormControl('', [Validators.required, Validators.email]);
  submitting = false;

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  resetPassword() {
    if (this.email.invalid || this.submitting) {
      this.email.markAsTouched();
      return;
    }

    this.submitting = true;
    this.authService.requestPasswordReset(this.email.value!).pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.submitting = false)
    ).subscribe({
      next: response => {
        this.uiFeedback.fire('Check your email', response.message, 'success')
          .then(() => this._router.navigateByUrl('/auth/sign-in'));
      },
      error: error => {
        this.uiFeedback.fire('Unable to send reset link', getApiErrorMessage(error, 'Please try again later.'), 'error');
      }
    });
  }
}
