import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { LetterDocumentsService, LetterLanguage } from '../../../services/letters/letter-documents.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-boarded-out-letter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './boarded-out-letter.component.html',
  styleUrls: ['./boarded-out-letter.component.scss']
})
export class BoardedOutLetterComponent {
  language: LetterLanguage = 'sw';
  loading = false;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly referral: any,
    private readonly documents: LetterDocumentsService,
    private readonly feedback: FeedbackService,
    @Optional() private readonly dialogRef: MatDialogRef<BoardedOutLetterComponent> | null,
  ) {}

  get historyId(): number | null {
    const id = this.referral?.history_id || this.referral?.patient?.patient_histories?.[0]?.patient_histories_id;
    return id ? Number(id) : null;
  }

  get patientName(): string {
    return this.referral?.patient?.name || '';
  }

  preview(): void {
    if (!this.historyId || this.loading) {
      return;
    }

    this.loading = true;
    this.documents.openBoardedOutLetter(this.historyId, this.language, this.patientName)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (viewerRef) => viewerRef.afterClosed().subscribe((result) => this.dialogRef?.close(result)),
        error: (error: unknown) => this.feedback.error(
          'Unable to prepare letter',
          getApiErrorMessage(error, 'The boarded-out letter could not be generated. Please try again.'),
        ),
      });
  }

  close(): void {
    this.dialogRef?.close();
  }
}
