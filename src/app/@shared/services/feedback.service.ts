import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { firstValueFrom, map } from 'rxjs';
import { ConfirmationDialogComponent } from '../ui/feedback/confirmation-dialog.component';
import { FeedbackAlertComponent } from '../ui/feedback/feedback-alert.component';
import { FeedbackIcon, FeedbackOptions, FeedbackResult } from '../ui/feedback/feedback.types';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  fire(options?: FeedbackOptions): Promise<FeedbackResult>;
  fire(title?: string, text?: string, icon?: FeedbackIcon | string): Promise<FeedbackResult>;
  fire(
    titleOrOptions: string | FeedbackOptions = {},
    text?: string,
    icon?: FeedbackIcon | string,
  ): Promise<FeedbackResult> {
    const options: FeedbackOptions = typeof titleOrOptions === 'string'
      ? { title: titleOrOptions, text, icon }
      : titleOrOptions;

    const normalizedOptions: FeedbackOptions = {
      ...options,
      icon: this.normalizeIcon(options.icon),
    };
    const isConfirmation = normalizedOptions.showCancelButton === true;
    const allowOutsideClick = normalizedOptions.allowOutsideClick;
    const disableClose = allowOutsideClick === false || normalizedOptions.allowEscapeKey === false;
    const dialogRef = isConfirmation
      ? this.dialog.open(ConfirmationDialogComponent, {
          width: 'min(430px, calc(100vw - 32px))',
          maxWidth: 'calc(100vw - 32px)',
          panelClass: 'feedback-dialog-panel',
          disableClose,
          data: normalizedOptions,
        })
      : this.dialog.open(FeedbackAlertComponent, {
          width: 'min(430px, calc(100vw - 32px))',
          maxWidth: 'calc(100vw - 32px)',
          panelClass: 'feedback-dialog-panel',
          disableClose,
          data: normalizedOptions,
        });

    return firstValueFrom(dialogRef.afterClosed().pipe(
      map((result: FeedbackResult | undefined) => result || {
        isConfirmed: false,
        isDismissed: true,
        dismiss: 'close',
      }),
    ));
  }

  confirm(
    title: string,
    text = '',
    options: Partial<FeedbackOptions> = {},
  ): Promise<FeedbackResult> {
    return this.fire({
      ...options,
      title,
      text,
      icon: options.icon || 'warning',
      showCancelButton: true,
    });
  }

  alert(
    title: string,
    text = '',
    icon: FeedbackIcon = 'info',
    options: Partial<FeedbackOptions> = {},
  ): Promise<FeedbackResult> {
    return this.fire({ ...options, title, text, icon });
  }

  success(title: string, text = '', options: Partial<FeedbackOptions> = {}): Promise<FeedbackResult> {
    return this.alert(title, text, 'success', options);
  }

  error(title: string, text = '', options: Partial<FeedbackOptions> = {}): Promise<FeedbackResult> {
    return this.alert(title, text, 'error', options);
  }

  toast(message: string, icon: FeedbackIcon = 'info', duration = 3500): MatSnackBarRef<unknown> {
    return this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['feedback-snackbar', `feedback-snackbar--${icon}`],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  isVisible(): boolean {
    return this.dialog.openDialogs.length > 0;
  }

  close(): void {
    this.dialog.closeAll();
  }

  private normalizeIcon(icon?: FeedbackIcon | string): FeedbackIcon {
    return icon === 'success' || icon === 'error' || icon === 'warning' || icon === 'question'
      ? icon
      : 'info';
  }
}
