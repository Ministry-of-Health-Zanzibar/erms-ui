import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
import { FileViewerComponent } from '../../@shared/ui/file-viewer/file-viewer.component';

export type LetterLanguage = 'en' | 'sw';

@Injectable({ providedIn: 'root' })
export class LetterDocumentsService {
  private readonly baseUrl = `${environment.baseUrl}letter-documents`;

  constructor(
    private readonly http: HttpClient,
    private readonly dialog: MatDialog,
  ) {}

  openReferralLetter(
    referralId: number,
    language: LetterLanguage,
    patientName = '',
  ): Observable<MatDialogRef<FileViewerComponent>> {
    const endpoint = `${this.baseUrl}/referrals/${referralId}/pdf`;

    return this.openPdf(endpoint, language, {
      title: `Referral letter${patientName ? ` · ${patientName}` : ''}`,
      fileName: `referral-letter-${referralId}-${language}.pdf`,
      printTrackingUrl: `${this.baseUrl}/referrals/${referralId}/print`,
    });
  }

  openFollowUpLetter(
    letterId: number,
    language: LetterLanguage,
    patientName = '',
  ): Observable<MatDialogRef<FileViewerComponent>> {
    const endpoint = `${this.baseUrl}/follow-ups/${letterId}/pdf`;

    return this.openPdf(endpoint, language, {
      title: `Follow-up letter${patientName ? ` · ${patientName}` : ''}`,
      fileName: `follow-up-letter-${letterId}-${language}.pdf`,
      printTrackingUrl: `${this.baseUrl}/follow-ups/${letterId}/print`,
    });
  }

  openBoardedOutLetter(
    patientHistoryId: number,
    language: LetterLanguage,
    patientName = '',
  ): Observable<MatDialogRef<FileViewerComponent>> {
    const endpoint = `${this.baseUrl}/boarded-out/${patientHistoryId}/pdf`;

    return this.openPdf(endpoint, language, {
      title: `Boarded-out letter${patientName ? ` · ${patientName}` : ''}`,
      fileName: `boarded-out-letter-${patientHistoryId}-${language}.pdf`,
      printTrackingUrl: `${this.baseUrl}/boarded-out/${patientHistoryId}/print`,
    });
  }

  private openPdf(
    endpoint: string,
    language: LetterLanguage,
    options: {
      title: string;
      fileName: string;
      printTrackingUrl: string;
    },
  ): Observable<MatDialogRef<FileViewerComponent>> {
    const params = new HttpParams().set('language', language);
    const shareUrl = `${endpoint}?language=${language}`;

    return this.http.get(endpoint, { params, responseType: 'blob' }).pipe(
      map((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const dialogRef = this.dialog.open(FileViewerComponent, {
          width: 'min(96vw, 1200px)',
          height: 'min(92vh, 860px)',
          maxWidth: '100vw',
          maxHeight: '100vh',
          panelClass: 'file-viewer-dialog',
          data: {
            url: objectUrl,
            shareUrl,
            fileName: options.fileName,
            title: options.title,
            mimeType: 'application/pdf',
            printTrackingUrl: options.printTrackingUrl,
            printTrackingBody: { language },
          },
        });

        dialogRef.afterClosed().subscribe(() => URL.revokeObjectURL(objectUrl));

        return dialogRef;
      }),
    );
  }
}
