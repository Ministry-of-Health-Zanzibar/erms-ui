import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, catchError, defer, from, map, switchMap, takeUntil, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
import { FileViewerComponent } from '../../@shared/ui/file-viewer/file-viewer.component';

export type LetterLanguage = 'en' | 'sw';

export function resolveReferralLetterLanguage(data: any, referralId?: number | string): LetterLanguage {
  const selectedReferral = referralId
    ? data?.referrals?.find((item: any) => String(item?.referral_id) === String(referralId))
    : data?.referrals?.[0];
  const selectedHospitalId = selectedReferral?.hospital_id;
  const hospital = selectedReferral?.hospital
    || (String(data?.transferred_referral_id ?? '') === String(referralId ?? '')
      ? data?.transferred_referral?.hospital : null)
    || data?.hospital
    || data?.referral?.hospital
    || (selectedHospitalId
      ? data?.hospitals?.find((item: any) => String(item?.hospital_id) === String(selectedHospitalId))
      : null)
    || data?.hospitals?.[0];

  const referralTypeCode = String(hospital?.referral_type?.referral_type_code ?? '')
    .trim()
    .toUpperCase();

  return referralTypeCode === 'REFTYPE2' ? 'en' : 'sw';
}

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

    return defer(() => {
      // Open immediately; the same viewer shows progress while the server
      // prepares the authenticated PDF, rather than leaving the page idle.
      const dialogRef = this.dialog.open(FileViewerComponent, {
        width: 'min(96vw, 1200px)',
        height: 'min(92vh, 860px)',
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'file-viewer-dialog',
        data: {
          url: '',
          loading: true,
          shareUrl,
          fileName: options.fileName,
          title: options.title,
          mimeType: 'application/pdf',
          printTrackingUrl: options.printTrackingUrl,
          printTrackingBody: { language },
        },
      });
      let objectUrl: string | undefined;
      const closed = dialogRef.afterClosed();
      closed.subscribe(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });

      return this.http.get(endpoint, {
        params,
        responseType: 'blob',
        // Do not retain medical PDFs/errors in the application's general GET
        // cache. The server caches only current, authorized rendered content.
        headers: { 'X-Skip-Cache': 'true' },
      }).pipe(
        takeUntil(closed),
        catchError((error: unknown) => {
          dialogRef.close();
          if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) {
            return throwError(() => error);
          }
          // PDF requests return JSON failures as blobs; preserve the server's useful explanation.
          return from(error.error.text()).pipe(switchMap((body) => {
            let details: unknown;
            try { details = JSON.parse(body); } catch {
              details = { message: 'The letter could not be prepared. Please check the referral record or try again.' };
            }
            return throwError(() => new HttpErrorResponse({
              error: details, headers: error.headers, status: error.status,
              statusText: error.statusText, url: error.url ?? undefined,
            }));
          }));
        }),
        map((blob) => {
          objectUrl = URL.createObjectURL(blob);
          // Keep the official letter at its normal readable review scale.
          dialogRef.componentInstance.setFile(`${objectUrl}#zoom=100`);

          return dialogRef;
        }),
      );
    });
  }
}
