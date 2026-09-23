import { inject, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatMiniFabButton,
  MatIconButton,
  MatAnchor,
  MatButton,
} from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { VDividerComponent } from '@elementar/components';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PermissionService } from '../../../services/authentication/permission.service';
import { ReferralService } from '../../../services/Referral/referral.service';
import { AddReferralsComponent } from '../add-referrals/add-referrals.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { EmrSegmentedModule } from '../../../../../projects/components/src/lib/segmented/segmented.module';
import { BillComponent } from '../bill/bill.component';
import { DisplaycommentsComponent } from '../displaycomments/displaycomments.component';
import {
  EmptyStateComponent,
  LetterBrandingDialogComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  TableToolbarComponent,
} from '@shared/ui';
import { LetterDocumentsService, resolveReferralLetterLanguage } from '../../../services/letters/letter-documents.service';

@Component({
  selector: 'app-view-referrals',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIcon,
    VDividerComponent,
    MatTooltip,
    MatSlideToggleModule,
    FormsModule,
    EmrSegmentedModule,
    EmptyStateComponent,
    LetterBrandingDialogComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TableToolbarComponent,
  ],
  templateUrl: './view-referrals.component.html',
  styleUrl: './view-referrals.component.scss',
})
export class ViewReferralsComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly documents = inject(LetterDocumentsService);
  private readonly onDestroy = new Subject<void>();
  loading: boolean = false;

  displayedColumns: string[] = [
    'id',
    'patient_name',
    'case_type',
    'board_comments',
    'diagnoses',
    'status',
    'letter_status',
    'action',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  referralsLetter: any;

  constructor(
    public permission: PermissionService,
    public referralService: ReferralService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getReferrals();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
  renew() {
    this.getReferrals();
  }

  // getReferrals() {
  //   this.loading = true;

  //   this.referralService
  //     .getAllRefferal()
  //     .pipe(takeUntil(this.onDestroy))
  //     .subscribe(
  //       (response: any) => {
  //         this.loading = false;

  //         let dataToShow: any[] = [];

  //         if (response && Array.isArray(response.data)) {
  //           dataToShow = [...response.data];
  //         } else if (Array.isArray(response)) {
  //           dataToShow = [...response];
  //         } else {
  //           console.warn('Unexpected response format:', response);
  //           return;
  //         }

  //       dataToShow = dataToShow.map((item: any) => {
  //   const histories = item.patient?.patient_histories || [];

  //   const latestHistory = histories.length
  //     ? histories.sort(
  //         (a: any, b: any) =>
  //           new Date(b.created_at).getTime() -
  //           new Date(a.created_at).getTime()
  //       )[0]
  //     : null;

  //       const diagnosesArray = item.diagnoses?.map((d: any) => d.diagnosis_name) || [];

  //       return {
  //         ...item,
  //         case_type: latestHistory?.case_type || 'N/A',
  //         board_comments: latestHistory?.board_comments || 'N/A',

  //         // ✅ keep both formats
  //         diagnosesArray,
  //         diagnoses: diagnosesArray.join(', ') || 'N/A',
  //       };
  //     });

  //         this.dataSource = new MatTableDataSource(dataToShow);
  //         this.dataSource.paginator = this.paginator;

  //         // ✅ SEARCH (still works)
  //         this.dataSource.filterPredicate = (data: any, filter: string) => {
  //           const patientName = data.patient?.name?.toLowerCase() || '';
  //           return patientName.includes(filter);
  //         };
  //       },
  //       (error) => {
  //         this.loading = false;
  //         console.error('Failed to load referrals.', error);
  //         this.router.navigateByUrl('/');
  //       }
  //     );
  // }

  getReferrals() {
    this.loading = true;
  
    this.referralService
      .getAllRefferal()
      .pipe(takeUntil(this.onDestroy))
      .subscribe(
        (response: any) => {
          this.loading = false;
  
          let dataToShow: any[] = [];
  
          if (response && Array.isArray(response.data)) {
            dataToShow = [...response.data];
          } else if (Array.isArray(response)) {
            dataToShow = [...response];
          } else {
            console.warn('Unexpected response format:', response);
            return;
          }
  
          dataToShow = dataToShow.map((item: any) => {
  
            // ✅ FIX: use API history object (NOT patient_histories array)
            const history = item.history;
  
            // diagnoses mapping (keep as-is)
            const diagnosesArray =
              item.diagnoses?.map((d: any) => d.diagnosis_name) || [];
  
            return {
              ...item,
  
              // ✅ FIXED FIELDS
              case_type: history?.case_type || 'N/A',
              board_comments: history?.board_comments || 'N/A',
  
              // keep both formats (unchanged behavior)
              diagnosesArray,
              diagnoses: diagnosesArray.join(', ') || 'N/A',
            };
          });
  
          this.dataSource = new MatTableDataSource(dataToShow);
          this.dataSource.paginator = this.paginator;
  
          // search logic unchanged
          this.dataSource.filterPredicate = (data: any, filter: string) => {
            const patientName = data.patient?.name?.toLowerCase() || '';
            return patientName.includes(filter);
          };
        },
        (error) => {
          this.loading = false;
          console.error('Failed to load referrals.', error);
          this.router.navigateByUrl('/');
        }
      );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  limitWords(text: string, wordLimit: number = 8): string {
    if (!text) return 'N/A';

    const words = text.split(' ');
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(' ') + '...'
      : text;
  }

  getDiagnoses(diagnoses: any[]): string {
    if (!diagnoses || !diagnoses.length) return 'N/A';
    return diagnoses.map(d => d.diagnosis_name).join(', ');
  }

  addReferrals() {
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';

    const dialogRef = this.dialog.open(AddReferralsComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      this.getReferrals();
    });
  }

  updateRefererral(id: any) {
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { id: id };

    const dialogRef = this.dialog.open(AddReferralsComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      this.getReferrals();
    });
  }

  displayComment(id: any) {
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { id: id };

    const dialogRef = this.dialog.open(DisplaycommentsComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      this.getReferrals();
    });
  }

  confirmBlock(data: any) {
    const message = data.deleted_at
      ? 'Are you sure you want to unblock'
      : 'Are you sure you want to block';

    this.uiFeedback.fire({
      title: 'Confirm',
      html: `${message} <b>${data.referral_id}</b>`,
      icon: 'warning',
      confirmButtonColor: '#4690eb',
      confirmButtonText: 'Confirm',
      cancelButtonColor: '#D5D8DC',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.toggleReferralStatus(data);
      } else {
        this.getReferrals();
      }
    });
  }

  toggleReferralStatus(data: any): void {
    if (data.deleted_at) {
      // Unblock the referral
      this.referralService
        .unblockReferral(data.referral_id)
        .subscribe((response) => {
          if (response.statusCode === 200) {
            this.uiFeedback.fire({
              title: 'Success',
              text: response.message,
              icon: 'success',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Continue',
            });
            this.getReferrals();
          } else {
            this.uiFeedback.fire({
              title: 'Error',
              text: response.message,
              icon: 'error',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Continue',
            });
          }
        });
    } else {
      // Block the referral (assuming some blocking logic)
      this.referralService
        .deleteReferral(data.referral_id)
        .subscribe((response) => {
          if (response.statusCode === 200) {
            this.uiFeedback.fire({
              title: 'Success',
              text: response.message,
              icon: 'success',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Continue',
            });
            this.getReferrals();
          } else {
            this.uiFeedback.fire({
              title: 'Error',
              text: response.message,
              icon: 'error',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Continue',
            });
          }
        });
    }
  }

  getBills(id: any) {
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { id: id };
    const dialogRef = this.dialog.open(BillComponent, config);
    dialogRef.afterClosed().subscribe((result) => {
      this.getReferrals();
    });
  }

  // displayMoreData(data: any) {
  //   // ✅ Recommendation-only / BO records
  //   if (data.is_recommendation_only || data.is_boarded_out) {
  //     this.router.navigate([
  //       '/pages/config/referrals/more',data.history_id
  //     ]);
  //     return;
  //   }
  
  //   // ✅ Normal referrals
  //   const id = data.referrals?.[0]?.referral_id;
  
  //   if (!id) {
  //     console.warn('Missing referral_id (non-BO case)', data);
  //     return;
  //   }
  
  //   this.router.navigate(['/pages/config/referrals/more', id]);
  // }
  displayMoreData(data: any) {

    // ✅ Recommendation-only / BoardedOut
    if (data.is_recommendation_only || data.is_boarded_out) {
  
      this.router.navigate(
        ['/pages/config/referrals/more', data.history_id],
        {
          queryParams: {
            type: 'history'
          }
        }
      );
  
      return;
    }
  
    // ✅ Normal referrals
    const id = data.referrals?.[0]?.referral_id;
  
    if (!id) {
      console.warn('Missing referral_id (non-BO case)', data);
      return;
    }
  
    this.router.navigate(
      ['/pages/config/referrals/more', id],
      {
        queryParams: {
          type: 'referral'
        }
      }
    );
  }

  displayReport(element: any) {
    if (element.is_recommendation_only) {
      this.uiFeedback.fire(
        'Not Available',
        'No report available for recommendation-only cases.',
        'info'
      );
      return;
    }
  
    const id = element.referrals?.[0]?.referral_id;
    if (!id) return;
  
    this.router.navigate(['/pages/config/referrals/individual-report', id]);
  }

  viewfollowup(data: any) {
    if (data.is_recommendation_only) {
      this.uiFeedback.fire(
        'Not Available',
        'This case is a recommendation only. No follow-up exists.',
        'info'
      );
      return;
    }
  
    const id = data.referrals?.[0]?.referral_id;
    if (!id) return;
  
    this.router.navigate(['/pages/config/referrals/view-follow-up', id]);
  }

  public getUserRole(): any {
    return localStorage.getItem('roles');
  }

  public get isStaff(): boolean {
    return this.getUserRole() === 'ROLE STAFF';
  }

  public get isAdmin(): boolean {
    return this.getUserRole() === 'ROLE ADMIN';
  }

  public get canManageLetterBranding(): boolean {
    return [
      'ROLE ADMIN',
      'ROLE DG',
      'ROLE DIRECTOR GENERAL',
      'ROLE SUPER ADMIN',
      'ROLE SUPERADMIN',
    ].includes(this.getUserRole());
  }

  openLetterBranding(): void {
    this.dialog.open(LetterBrandingDialogComponent, {
      width: 'min(96vw, 720px)',
      maxWidth: '100vw',
      maxHeight: '92vh',
      panelClass: 'letter-branding-dialog-panel',
    });
  }

  referralsLetterPopup(data: any): void {
    const referralId = data?.referrals?.find((item: any) => item?.referral_id)?.referral_id;

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
      next: (viewerRef) => viewerRef.afterClosed().subscribe((result) => {
        if (result?.printed) {
          this.getReferrals();
        }
      }),
      error: (error: unknown) => this.uiFeedback.error(
        'Unable to prepare letter',
        getApiErrorMessage(error, 'The referral letter could not be generated.'),
      ),
    });
  }

  editReferral(data: any) {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.height = '600px'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'
    config.data = {data: data}

    const dialogRef = this.dialog.open(AddReferralsComponent, config);
    dialogRef.afterClosed().subscribe(result => {
      this.getReferrals();
    });
  }

  canViewFollowup(element: any): boolean {
    if (element.status === 'Pending') {
      return false;
    }
  
    if (element.status === 'BoardedOut') {
      return element.hospitals?.some((h: any) => h?.hospital_id) ?? false;
    }
  
    return true;
  }
}
