import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { FeedbackService } from '@shared/services/feedback.service';
import { LetterDocumentsService, LetterLanguage } from '../../../services/letters/letter-documents.service';

@Component({
  selector: 'app-referrals-letter',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './referrals-letter.component.html',
  styleUrl: './referrals-letter.component.scss',
})
export class ReferralsLetterComponent implements OnInit {
  language: LetterLanguage = 'sw';
  loading = false;
  referralId: number | null = null;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: any,
    @Optional() private readonly dialogRef: MatDialogRef<ReferralsLetterComponent>,
    private readonly documents: LetterDocumentsService,
    private readonly feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    this.referralId = Number(this.data?.referral_id || this.data?.referrals?.[0]?.referral_id) || null;
    const hospital = this.data?.hospital || this.data?.hospitals?.[0] || this.data?.referrals?.[0]?.hospital;
    this.language = hospital?.referral_type?.referral_type_code === 'REFTYPE2' ? 'en' : 'sw';
  }

  preview(): void {
    if (!this.referralId || this.loading) {
      return;
    }

    this.loading = true;
    this.documents.openReferralLetter(this.referralId, this.language, this.data?.patient?.name)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (viewerRef) => viewerRef.afterClosed().subscribe((result) => this.dialogRef?.close(result)),
        error: (error: unknown) => this.feedback.error(
          'Unable to prepare letter',
          getApiErrorMessage(error, 'The referral letter could not be generated.'),
        ),
      });
  }

  close(): void {
    this.dialogRef?.close();
  }
}
