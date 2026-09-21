import { CommonModule } from '@angular/common';
import { Component, DestroyRef } from '@angular/core';
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
import Swal from 'sweetalert2';
import { MatCardModule } from '@angular/material/card';
import { ReferralsLetterComponent } from '../referrals-letter/referrals-letter.component';
import { environment } from '../../../../environments/environment.prod';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { ConversationModalComponent } from '../conversation-modal/conversation-modal.component';
import { BoardedOutLetterComponent } from '../boarded-out-letter/boarded-out-letter.component';
import { FlightInformationDialogComponent } from '../flight-information-dialog/flight-information-dialog.component';
import { combineLatest } from 'rxjs';
import { getApiErrorMessage } from '@shared/utils/api-error';

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
        Swal.fire('Error', getApiErrorMessage(error, 'Failed to load referral details.'), 'error');
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
      width: '95vw',
      maxWidth: '900px',
      maxHeight: '100vh',

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

    this.showFlightInformation = true;
  
  }

  closeFlightInformation(): void {

    this.showFlightInformation = false;
  
  }

  saveFlightInformation(data: any): void {

    this.referralsService.addReferralFlight(data).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.showFlightInformation = false;
  
        Swal.fire({
          icon: 'success',
          title: 'Saved',
          text: 'Flight information saved successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      },
  
      error: (error: unknown) => {
        Swal.fire({
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

  printBoardedOutLetter(data: any): void {

    const dialogRef = this.dialog.open(BoardedOutLetterComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        ...data,
        isBoardedOutLetter: true
      },
    });
  
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  referralsLetterPopup(data: any): void {
    const dialogRef = this.dialog.open(ReferralsLetterComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: data,
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
    });
  }

  viewPatientListPDF(filePath: string) {
    if (!filePath) {
      return;
    }

    const url = this.documentUrl + filePath;
    window.open(url, '_blank');
  }

  viewFile(file: any) {
    if (file?.file_path) {
      const url = this.documentUrl + file.file_path;
      window.open(url, '_blank');
    }
  }

  viewFiles(file: any) {
    if (file?.history_file) {
      const url = this.documentUrl + file.history_file;
      window.open(url, '_blank');
    }
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
