import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { PartientService } from '../../../../services/partient/partient.service';
import { FollowsService } from '../../../../services/Referral/follows.service';
import { LetterDocumentsService, resolveReferralLetterLanguage } from '../../../../services/letters/letter-documents.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { AddFollowUpComponent } from '../add-follow-up/add-follow-up.component';
import { ConversationModalComponent } from '../../conversation-modal/conversation-modal.component';
import {
  EmptyStateComponent,
  FileViewerComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
} from '@shared/ui';

@Component({
  selector: 'app-view-follow-up',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatIconModule, // ✅ Fixed
    MatTooltipModule,
    MatDialogModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  templateUrl: './view-follow-up.component.html',
  styleUrl: './view-follow-up.component.scss',
})
export class ViewFollowUpComponent implements OnInit {
  private readonly uiFeedback = inject(FeedbackService);
  public displayRoleForm!: FormGroup;
  loading: boolean = false;
  errorMessage = '';
  followListId: string | null = null;
  public follow: any = null;
  public hospitalLetters: any[] = [];
  public referralId: number | null = null;
  status: any;

  feedback: any = null;
  userRole: string | null = null;
  patientListInfo: any = null;
  dgReviewComments: Record<number, string> = {};
  reviewingLetterId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    public permission: PermissionService,
  private followService: FollowsService,
    private dialog: MatDialog,
    private readonly documents: LetterDocumentsService
  ) {}

  ngOnInit() {
    this.followListId = this.route.snapshot.paramMap.get('id');
    if (this.followListId) {
      this.getFeedbackById();
    }
  }

  getFeedbackById() {
    this.loading = true;
    this.errorMessage = '';

    this.followService.getFollowListById(this.followListId).subscribe(
      (response: any) => {
        this.loading = false;

        if (response?.data) {
          this.follow = response.data;

          const selectedReferral = this.follow.referrals?.find(
            (item: any) => String(item.referral_id) === String(this.followListId),
          ) || this.follow.referrals?.[0];
          this.referralId = selectedReferral?.referral_id || null;

          this.status = this.follow.status;

          // console.log('Referral ID:', this.referralId);
          // console.log('Status:', this.status);

          this.hospitalLetters = this.follow.hospital_letters || [];
        } else {
          this.follow = null;
          this.hospitalLetters = [];
          this.referralId = null;
        }
      },
      (error) => {
        this.loading = false;
        this.follow = null;
        this.hospitalLetters = [];
        this.referralId = null;
        this.errorMessage = getApiErrorMessage(
          error,
          'This follow-up record is not available for your hospital-user account.',
        );
        console.error('Error fetching follow details:', error);
      }
    );
  }

  viewPDF(element: any) {
    const isHospitalUser = this.permission.isHospitalDoctor();
    const storedFile = element?.uploaded_file_name || element?.letter_file;

    if (!element?.letter_id || (!element?.has_uploaded_file && !storedFile)) {
      return;
    }

    const language = resolveReferralLetterLanguage(this.follow, element?.referral_id);
    const patientName = this.follow?.patient?.name || 'Patient';
    const fileName = String(storedFile).split(/[\\/]/).pop() || 'follow-up-letter';

    this.documents.openUploadedFollowUpLetter(
      Number(element.letter_id),
      fileName,
      language,
      patientName,
      !isHospitalUser && element.outcome !== 'Transferred',
      !isHospitalUser,
    ).subscribe({
      next: (viewerRef) => viewerRef.afterClosed().subscribe((result) => {
        if (result?.printed) {
          this.getFeedbackById();
        }
      }),
      error: (error: unknown) => this.uiFeedback.error(
        'Unable to open letter',
        getApiErrorMessage(error, 'The uploaded follow-up letter could not be opened.'),
      ),
    });
  }

  addFollowWithOutcome(referral_id: any, outcome: string) {
    // console.log(
    //   `Adding follow-up for referral ${referral_id} with outcome ${outcome}`
    // );

    const config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = 'calc(100vh - 32px)';
    config.width = 'min(920px, calc(100vw - 32px))';
    config.panelClass = ['full-screen-modal', 'follow-up-dialog-panel'];
    config.data = {
      referral_id,
      outcome,
      requestDgApproval: this.permission.isHospitalDoctor(),
    };

    const dialogRef = this.dialog.open(AddFollowUpComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.getFeedbackById();
      }
    });
  }

  printFollowUp(data: any, letter: any): void {
    if (!this.canPrintLetter(letter)) {
      return;
    }

    const language = resolveReferralLetterLanguage(this.follow,
      letter.outcome === 'Transferred' ? letter.transferred_referral_id : letter.referral_id);

    const patientName = data?.patient?.name || this.follow?.patient?.name;
    const document = letter.outcome === 'Transferred'
      ? this.documents.openReferralLetter(Number(letter.transfer_letter.referral_id), language, patientName)
      : this.documents.openFollowUpLetter(Number(letter.letter_id), language, patientName);
    document.subscribe({
      next: (viewerRef) => viewerRef.afterClosed().subscribe((result) => {
        if (result?.printed) {
          this.getFeedbackById();
        }
      }),
      error: (error: unknown) => this.uiFeedback.error(
        'Unable to prepare letter',
        getApiErrorMessage(error, 'The follow-up letter could not be generated.'),
      ),
    });
  }

  canPrintLetter(letter: any): boolean {
    if (letter?.dg_approval_status === 'pending' || letter?.dg_approval_status === 'rejected') {
      return false;
    }

    const approvedForHospitalUser = !this.permission.isHospitalDoctor()
      || letter?.dg_approval_status === 'confirmed';

    return approvedForHospitalUser
      && !!letter?.letter_id && (letter.outcome === 'Follow-up'
      || (letter.outcome === 'Transferred' && !!letter.transfer_letter?.referral_id));
  }

  printStatus(letter: any): any {
    return letter?.outcome === 'Transferred' ? letter.transfer_letter : letter;
  }

  printTooltip(letter: any): string {
    if (letter?.dg_approval_status === 'pending') {
      return 'Waiting for DG confirmation before printing';
    }

    if (letter?.dg_approval_status === 'rejected') {
      return 'This request was returned by the DG. Review the conversation before submitting again.';
    }

    if (this.permission.isHospitalDoctor() && letter?.dg_approval_status !== 'confirmed') {
      return 'Waiting for DG confirmation before printing';
    }

    if (letter?.outcome === 'Transferred') {
      return this.canPrintLetter(letter) ? 'Print referral letter for the transferred hospital'
        : 'This transfer needs a verified referral letter. Please contact an administrator.';
    }
    return letter?.outcome === 'Follow-up' ? 'Print Follow-up' : 'No attendance letter is required for this outcome';
  }

  get isDirectorGeneral(): boolean {
    const storedRoles = [
      localStorage.getItem('roles'),
      localStorage.getItem('all_roles'),
    ].filter((value): value is string => Boolean(value));

    return storedRoles.some((stored) => {
      try {
        const parsed = JSON.parse(stored);
        const roles = Array.isArray(parsed) ? parsed : [parsed];
        return roles.some((role: any) => {
          const name = typeof role === 'string' ? role : role?.name;
          return ['ROLE DG', 'ROLE DIRECTOR GENERAL'].includes(String(name || '').trim().toUpperCase());
        });
      } catch {
        return ['ROLE DG', 'ROLE DIRECTOR GENERAL'].includes(stored.trim().toUpperCase());
      }
    });
  }

  get canCreateFollowUpActions(): boolean {
    return this.permission.isHospitalDoctor()
      || this.permission.parmissionMatched(['Create FollowUp']);
  }

  get canSubmitFollowUpRequest(): boolean {
    const statuses = String(this.follow?.status || '')
      .split(',')
      .map((status) => status.trim().toLowerCase())
      .filter(Boolean);

    // Pending referrals are valid starting points for a hospital-user
    // proposal. Closed/boarded-out cases remain protected from a new outcome.
    return !statuses.some((status) => ['closed', 'boardedout'].includes(status));
  }

  get pendingApprovalLetters(): any[] {
    return (this.hospitalLetters || []).filter(
      (letter: any) => letter?.dg_approval_status === 'pending',
    );
  }

  get patientHistoryId(): number | null {
    const referral = this.follow?.referrals?.find((item: any) => item?.patient_histories_id)
      || this.follow?.referrals?.[0];
    return Number(referral?.patient_histories_id || this.follow?.patient?.patient_histories?.[0]?.patient_histories_id) || null;
  }

  openDoctorConversation(): void {
    if (!this.patientHistoryId) {
      this.uiFeedback.alert(
        'Conversation unavailable',
        'This referral is not linked to a patient history conversation.',
        'info',
      );
      return;
    }

    this.dialog.open(ConversationModalComponent, {
      width: 'min(960px, 94vw)',
      maxWidth: '94vw',
      data: { patientHistoryId: this.patientHistoryId },
    });
  }

  confirmFollowUp(letter: any): void {
    if (!this.isDirectorGeneral || letter?.dg_approval_status !== 'pending' || this.reviewingLetterId) {
      return;
    }

    this.uiFeedback.confirm(
      'Confirm follow-up request?',
      'The hospital user will be notified and the existing follow-up workflow will be applied.',
      { confirmButtonText: 'Confirm and notify' },
    ).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.reviewingLetterId = Number(letter.letter_id);
      this.followService.reviewFollowUpApproval(this.reviewingLetterId, {
        decision: 'confirmed',
        comments: this.dgReviewComments[this.reviewingLetterId]?.trim() || undefined,
      }).subscribe({
        next: (response: any) => {
          this.reviewingLetterId = null;
          delete this.dgReviewComments[Number(letter.letter_id)];
          this.uiFeedback.success('Follow-up confirmed', response?.message || 'The doctor has been notified.');
          this.getFeedbackById();
        },
        error: (error: unknown) => {
          this.reviewingLetterId = null;
          this.uiFeedback.error('Unable to confirm follow-up', getApiErrorMessage(error, 'The DG decision could not be saved.'));
        },
      });
    });
  }

  setDgReviewComment(letterId: number, event: Event): void {
    this.dgReviewComments[letterId] = String((event.target as HTMLTextAreaElement)?.value || '');
  }

  extractFileName(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || '';
  }
}
