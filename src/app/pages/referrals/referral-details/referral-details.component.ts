import { CommonModule } from '@angular/common';
import { inject, Component, DestroyRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { ReferralService } from '../../../services/Referral/referral.service';
import { ReferralStatusDialogComponent } from '../referral-status-dialog/referral-status-dialog.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../../environments/environment.prod';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { ConversationModalComponent } from '../conversation-modal/conversation-modal.component';
import { FlightInformationDialogComponent } from '../flight-information-dialog/flight-information-dialog.component';
import { combineLatest } from 'rxjs';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { FileViewerComponent } from '@shared/ui';
import { LetterDocumentsService, resolveReferralLetterLanguage } from '../../../services/letters/letter-documents.service';

@Component({
  selector: 'app-referral-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatIcon,
    MatDialogModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    FlightInformationDialogComponent,
  ],
  templateUrl: './referral-details.component.html',
  styleUrl: './referral-details.component.scss',
})

export class ReferralDetailsComponent {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly documents = inject(LetterDocumentsService);
  public displayRoleForm!: FormGroup;
  referralID: string | null = null;
  referral: any = null;
  patientHistories:any = null;
  insurance: any = null;
  diagnoses: any[] = [];
  userRole: string | null;
  public documentUrl = environment.fileUrl;
  history = this.referral?.patient?.patient_histories?.[0];
  hospitalDiagnoses = this.history?.diagnoses || [];
  boardDiagnoses = this.history?.board_diagnoses || [];
  hospitalReason = this.history?.reason;
  boardReason = this.history?.board_reason;
  boardMembers: any[] = [];
  referralType: 'referral' | 'history' = 'referral';
  showFlightInformation = false;
  selectedFlight: any | null = null;

  @ViewChild(FlightInformationDialogComponent)
  private flightInformationDialog?: FlightInformationDialogComponent;

  constructor(
    private route: ActivatedRoute,
    public referralsService: ReferralService,
    private dialog: MatDialog,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {

    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([params, query]) => {
      this.referralID = params.get('id');
      this.referralType = query.get('type') === 'history' ? 'history' : 'referral';

      if (this.referralID) {
        this.getMoreData();
      }
    });
  
  }

  public getMoreData() {
    if (!this.referralID) return;

    this.referralsService.getReferralById(this.referralID, this.referralType).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(
      (response) => {
        this.referral = response.data;

        // Patient histories
        this.patientHistories = response.data.patient?.patient_histories || [];

        // Take FIRST history (as per your scenario)
        this.history = this.patientHistories.length
          ? this.patientHistories[0]
          : null;

        // ✅ Hospital diagnoses (Doctor)
        this.hospitalDiagnoses = this.history?.diagnoses || [];

        // ✅ Board diagnoses (Medical Board)
        this.boardDiagnoses = this.history?.board_diagnoses || [];

        // ✅ Reasons
        this.hospitalReason = this.history?.reason || null;
        this.boardReason = this.history?.board_reason || null;

        this.boardMembers =
          response.data.patient?.patient_list?.[0]?.board_members || [];
      },
      (error: unknown) => {
        this.uiFeedback.fire('Error', getApiErrorMessage(error, 'Failed to load referral details.'), 'error');
      }
    );
  }

  updateStatusPopup() {
    // ✅ Try to get from referral (normal case)
    let historyId =
      this.referral?.patient?.patient_histories?.[0]?.patient_histories_id;
  
    // ✅ Fallback (recommendation-only case)
    if (!historyId && this.patientHistories?.length) {
      historyId = this.patientHistories[0]?.patient_histories_id;
    }
  
    // 🚨 If still missing → stop early (avoid backend error)
    if (!historyId) {
      console.warn('No patient_histories_id found');
      return;
    }
    
    const dialogRef = this.dialog.open(ReferralStatusDialogComponent, {
      width: '960px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 24px)',
      panelClass: 'referral-status-dialog-panel',

      data: {
        referral: this.referral,
        patient_histories_id: historyId,
    
        hasRealReferral: this.hasRealReferral,
        hasBoardedOut: this.hasBoardedOut,
        isRecommendationOnly: this.isRecommendationOnly,
      },
    });
  
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.getMoreData();
      }
    });
  }

  openFlightInformationPopup(referral: any): void {
    if (!this.isReftype2Referral(referral)) {
      return;
    }

    this.selectedFlight = this.latestFlight(referral);
    this.showFlightInformation = true;
  }

  closeFlightInformation(): void {
    this.showFlightInformation = false;
    this.selectedFlight = null;
  }

  saveFlightInformation(data: any): void {
    const flightId = Number(data?.referral_flight_id) || null;
    const payload = { ...data };
    delete payload.referral_flight_id;
    const request$ = flightId
      ? this.referralsService.updateReferralFlight(flightId, payload)
      : this.referralsService.addReferralFlight(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.closeFlightInformation();
        this.getMoreData();

        this.uiFeedback.fire({
          icon: 'success',
          title: flightId ? 'Flight details updated' : 'Flight details saved',
          text: flightId
            ? 'The flight information was updated successfully.'
            : 'The flight information was saved successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      },
  
      error: (error: unknown) => {
        this.flightInformationDialog?.resetSubmissionState();
        this.uiFeedback.fire({
          icon: 'error',
          title: 'Error',
          text: getApiErrorMessage(error, 'Failed to save flight information.')
        });
      }
    });
  }

  isReferralPrintDisabled(referral: any): boolean {
    const blockedStatuses = [
      'Pending',
      'Cancelled',
      'Closed'
    ];

    return blockedStatuses.includes(referral?.status);
  }

  hasFlightInformation(referral: any): boolean {
    return !!this.latestFlight(referral);
  }

  private latestFlight(referral: any): any | null {
    const flights = referral?.referral_flights ?? referral?.referralFlights;

    if (Array.isArray(flights)) {
      return flights[flights.length - 1] || null;
    }

    return flights || null;
  }

  printBoardedOutLetter(data: any): void {
    const historyId = data?.history_id || data?.patient?.patient_histories?.[0]?.patient_histories_id;

    if (!historyId) {
      this.uiFeedback.alert(
        'Letter not available',
        'This record does not have a boarded-out letter yet.',
        'info',
      );
      return;
    }

    this.documents.openBoardedOutLetter(Number(historyId), 'sw', data?.patient?.name).subscribe({
      next: (viewerRef) => viewerRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
        if (result?.printed) {
          this.getMoreData();
        }
      }),
      error: (error: unknown) => this.uiFeedback.error(
        'Unable to prepare letter',
        getApiErrorMessage(error, 'The boarded-out letter could not be generated.'),
      ),
    });
  }

  referralsLetterPopup(data: any): void {
    const referralId = data?.referral_id || data?.referrals?.[0]?.referral_id;

    if (!referralId) {
      this.uiFeedback.alert(
        'Letter not available',
        'This record does not have a confirmed referral letter yet.',
        'info',
      );
      return;
    }

    this.documents.openReferralLetter(
      Number(referralId),
      resolveReferralLetterLanguage(data, referralId),
      data?.patient?.name,
    ).subscribe({
      next: (viewerRef) => viewerRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
        if (result?.printed) {
          this.getMoreData();
        }
      }),
      error: (error: unknown) => this.uiFeedback.error(
        'Unable to prepare letter',
        getApiErrorMessage(error, 'The referral letter could not be generated.'),
      ),
    });
  }

  viewPatientListPDF(filePath: string) {
    if (!filePath) {
      return;
    }

    this.openFileViewer(filePath, 'Medical board list');
  }

  viewFile(file: any) {
    if (file?.file_path) {
      this.openFileViewer(file.file_path, file.file_name || 'Patient document', file.file_name);
    }
  }

  viewFiles(file: any) {
    if (file?.history_file) {
      this.openFileViewer(file.history_file, 'Medical history file');
    }
  }

  private openFileViewer(filePath: string, title: string, fileName?: string): void {
    const url = this.buildDocumentUrl(filePath);

    this.dialog.open(FileViewerComponent, {
      data: { url, title, fileName },
      width: 'min(96vw, 1200px)',
      height: 'min(92vh, 860px)',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'file-viewer-dialog',
      autoFocus: false,
      restoreFocus: true,
      ariaLabel: title,
    });
  }

  private buildDocumentUrl(filePath: string): string {
    if (/^(https?:|blob:|data:)/i.test(filePath)) {
      return filePath;
    }

    return this.documentUrl.replace(/\/$/, '') + '/' + filePath.replace(/^\//, '');
  }

  openConversationModal(referral: any) {
    const patientHistoryId = referral.patient.patient_histories[0].patient_histories_id;

    this.dialog.open(ConversationModalComponent, {
      width: '700px',
      data: { patientHistoryId }
    });
  }

  get hasRealReferral(): boolean {
    return this.referral?.referral_id != null;
  }

  get canManageFlightInformation(): boolean {
    return this.isReftype2Referral(this.referral);
  }

  isReftype2Referral(referral: any): boolean {
    const hospital = referral?.hospital ?? referral?.confirmed_hospital;
    const referralType = hospital?.referral_type ?? hospital?.referralType;
    const code = referralType?.referral_type_code ?? hospital?.referral_type_code;

    return String(code ?? '').trim().toUpperCase() === 'REFTYPE2';
  }
  
  get hasBoardedOut(): boolean {
    return this.referral?.is_boarded_out === true;
  }
  
  get isRecommendationOnly(): boolean {
    return !!this.referral?.is_recommendation_only;
  }
  
  get canShowConfirmedOnly(): boolean {
    return !this.hasBoardedOut;
  }
  
  get canShowBoardedOutOnly(): boolean {
    return this.hasBoardedOut && !this.hasRealReferral;
  }
  
  get canShowConfirmedAndBoardedOut(): boolean {
    return this.hasRealReferral;
  }

  get referralMode(): 'referral' | 'boardedOut' | 'unknown' {
    if (this.referral?.is_boarded_out) return 'boardedOut';
    if (this.referral?.referral_id) return 'referral';
    return 'unknown';
  }
}
