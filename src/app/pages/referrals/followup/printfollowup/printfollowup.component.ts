import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { FeedbackService } from '@shared/services/feedback.service';
import {
  LetterDocumentsService,
  LetterLanguage,
  resolveReferralLetterLanguage,
} from '../../../../services/letters/letter-documents.service';

@Component({
  selector: 'app-printfollowup',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './printfollowup.component.html',
  styleUrl: './printfollowup.component.scss',
})
export class PrintfollowupComponent {
  language: LetterLanguage = 'sw';
  loading = false;
  letterId: number | null = null;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: any,
    @Optional() private readonly dialogRef: MatDialogRef<PrintfollowupComponent>,
    private readonly documents: LetterDocumentsService,
    private readonly feedback: FeedbackService,
  ) {
    this.letterId = Number(data?.letter_id || data?.hospital_letters?.[0]?.letter_id) || null;
    this.language = resolveReferralLetterLanguage(data, data?.referral_id);
  }

  preview(): void {
    if (!this.letterId || this.loading) {
      return;
    }

    this.loading = true;
    this.documents.openFollowUpLetter(this.letterId, this.language, this.data?.patient?.name)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (viewerRef) => viewerRef.afterClosed().subscribe((result) => this.dialogRef?.close(result)),
        error: (error: unknown) => this.feedback.error(
          'Unable to prepare letter',
          getApiErrorMessage(error, 'The follow-up letter could not be generated.'),
        ),
      });
  }

  close(): void {
    this.dialogRef?.close();
  }
}
