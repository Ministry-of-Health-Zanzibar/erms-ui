import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../utils/api-error';
import { FeedbackService } from '../../services/feedback.service';
import { LetterDocumentsService, LetterLanguage } from '../../../services/letters/letter-documents.service';

export interface LetterPreviewDialogData {
  kind: 'referral' | 'follow_up' | 'boarded_out';
  id: number;
  patientName?: string;
  defaultLanguage?: LetterLanguage;
}

@Component({
  selector: 'app-letter-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './letter-preview-dialog.component.html',
  styleUrl: './letter-preview-dialog.component.scss',
})
export class LetterPreviewDialogComponent {
  language: LetterLanguage;
  loading = false;

  readonly options: Array<{
    value: LetterLanguage;
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      value: 'en',
      label: 'English version',
      description: 'Official English letter for international or English-speaking recipients.',
      icon: 'translate',
    },
    {
      value: 'sw',
      label: 'Toleo la Kiswahili',
      description: 'Barua rasmi ya Kiswahili kwa matumizi ya ndani ya mfumo.',
      icon: 'language',
    },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: LetterPreviewDialogData,
    private readonly dialogRef: MatDialogRef<LetterPreviewDialogComponent>,
    private readonly documents: LetterDocumentsService,
    private readonly feedback: FeedbackService,
  ) {
    this.language = data.defaultLanguage || 'sw';
  }

  get heading(): string {
    if (this.data.kind === 'referral') {
      return 'Referral letter';
    }

    return this.data.kind === 'boarded_out' ? 'Boarded-out letter' : 'Follow-up letter';
  }

  get description(): string {
    if (this.data.kind === 'referral') {
      return 'Choose the language, then review the server-generated letter before printing.';
    }

    if (this.data.kind === 'boarded_out') {
      return 'Choose the language, then review the server-generated boarded-out letter before printing.';
    }

    return 'Choose the language, then review the server-generated follow-up letter before printing.';
  }

  preview(): void {
    if (!this.data.id || this.loading) {
      return;
    }

    this.loading = true;
    const request = this.data.kind === 'referral'
      ? this.documents.openReferralLetter(this.data.id, this.language, this.data.patientName)
      : this.data.kind === 'boarded_out'
        ? this.documents.openBoardedOutLetter(this.data.id, this.language, this.data.patientName)
        : this.documents.openFollowUpLetter(this.data.id, this.language, this.data.patientName);

    request.pipe(finalize(() => this.loading = false)).subscribe({
      next: (viewerRef) => viewerRef.afterClosed().subscribe((result) => this.dialogRef.close(result)),
      error: (error: unknown) => {
        this.feedback.error(
          'Unable to prepare letter',
          getApiErrorMessage(error, 'The letter could not be generated. Please try again.'),
        );
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
