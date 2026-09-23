import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FeedbackIcon, FeedbackOptions, FeedbackResult } from './feedback.types';

@Component({
  selector: 'app-feedback-alert',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './feedback-alert.component.html',
  styleUrl: './feedback-alert.component.scss',
})
export class FeedbackAlertComponent implements OnDestroy {
  private timerHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: FeedbackOptions,
    private readonly dialogRef: MatDialogRef<FeedbackAlertComponent>,
  ) {
    if (data.timer && data.timer > 0) {
      this.timerHandle = setTimeout(() => this.close('timer'), data.timer);
    }
  }

  get icon(): FeedbackIcon {
    const icon = this.data.icon;
    return icon === 'success' || icon === 'error' || icon === 'warning' || icon === 'question'
      ? icon
      : 'info';
  }

  get iconName(): string {
    return this.icon === 'success' ? 'check_circle' : this.icon === 'question' ? 'help_outline' : this.icon;
  }

  get hasConfirmButton(): boolean {
    return this.data.showConfirmButton !== false;
  }

  close(dismiss: FeedbackResult['dismiss'] = 'close'): void {
    const result: FeedbackResult = {
      isConfirmed: false,
      isDismissed: true,
      dismiss,
    };
    this.dialogRef.close(result);
  }

  ngOnDestroy(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }
}
