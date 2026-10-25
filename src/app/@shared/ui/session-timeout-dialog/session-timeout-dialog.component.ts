import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

export interface SessionTimeoutDialogData {
  sessionCountdown$: Observable<number>;
  countdown$: Observable<number>;
  refreshing$: Observable<boolean>;
  sessionDurationSeconds: number;
  warningDurationSeconds: number;
  onRefresh: () => void;
  onLogout: () => void;
}

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './session-timeout-dialog.component.html',
  styleUrl: './session-timeout-dialog.component.scss',
})
export class SessionTimeoutDialogComponent {
  readonly sessionCircumference = 2 * Math.PI * 70;
  readonly warningCircumference = 2 * Math.PI * 52;

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: SessionTimeoutDialogData,
  ) {}

  strokeOffset(
    secondsLeft: number | null,
    totalSeconds: number,
    circumference: number,
  ): number {
    const seconds = Math.max(0, Math.min(totalSeconds, secondsLeft ?? 0));
    return circumference * (1 - seconds / totalSeconds);
  }

  refresh(): void {
    this.data.onRefresh();
  }

  logout(): void {
    this.data.onLogout();
  }
}
