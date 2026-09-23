import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FeedbackIcon, FeedbackOptions, FeedbackResult } from './feedback.types';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: FeedbackOptions,
    private readonly dialogRef: MatDialogRef<ConfirmationDialogComponent>,
  ) {}

  get icon(): FeedbackIcon {
    const icon = this.data.icon;
    return icon === 'success' || icon === 'error' || icon === 'warning' || icon === 'question'
      ? icon
      : 'info';
  }

  get iconName(): string {
    return this.icon === 'success' ? 'check_circle' : this.icon === 'question' ? 'help_outline' : this.icon;
  }

  confirm(): void {
    const result: FeedbackResult = {
      isConfirmed: true,
      isDismissed: false,
    };
    this.dialogRef.close(result);
  }

  cancel(): void {
    const result: FeedbackResult = {
      isConfirmed: false,
      isDismissed: true,
      dismiss: 'cancel',
    };
    this.dialogRef.close(result);
  }
}
