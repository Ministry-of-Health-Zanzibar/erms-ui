import { inject, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { Router } from 'express';
import { Subject, takeUntil } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMiniFabButton, MatIconButton, MatAnchor, MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PermissionService } from '../../../services/authentication/permission.service';
import { ReferralService } from '../../../services/Referral/referral.service';
import { AddReferralsComponent } from '../add-referrals/add-referrals.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { BillComponent } from '../bill/bill.component';
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
  selector: 'app-view-referal-confirm',
  standalone: true,
  imports: [
     CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatDivider,
        MatIcon,
        MatMiniFabButton,
        MatIconButton,
        VDividerComponent,
        MatTooltip,
        MatSlideToggleModule,
        FormsModule,
        MatAnchor,
        MatButton,
        RouterLink,
        EmrSegmentedModule,
        EmptyStateComponent,
        LetterBrandingDialogComponent,
        LoadingStateComponent,
        PageHeaderComponent,
        SectionCardComponent,
        StatusBadgeComponent,
        TableToolbarComponent
  ],
  templateUrl: './view-referal-confirm.component.html',
  styleUrl: './view-referal-confirm.component.scss'
})
export class ViewReferalConfirmComponent implements OnInit,OnDestroy{
  private readonly uiFeedback = inject(FeedbackService);


   private readonly onDestroy = new Subject<void>()
   loading: boolean = false;


      displayedColumns: string[] =
      ['id', 'patient_name',
      'hospital_name', 'referral_reason_name', 'status', 'letter_status', 'action'];
      dataSource: MatTableDataSource<any> = new MatTableDataSource();

      @ViewChild(MatPaginator) paginator!: MatPaginator;
      @ViewChild(MatSort) sort!: MatSort;
  referralsLetter: any;


      constructor(public permission: PermissionService,
        public referralService:ReferralService,
        private router:Router,
        private dialog: MatDialog,
        private readonly documents: LetterDocumentsService
        ){}

      ngOnInit(): void {
        this.getReferrals();
      }
      ngOnDestroy(): void {
        this.onDestroy.next()
        this.onDestroy.complete()
      }
      renew(){
        this.getReferrals();
      }

     getReferrals() {
  this.loading = true;
  this.referralService.getAllRefferal()
    .pipe(takeUntil(this.onDestroy))
    .subscribe(
      (response: any) => {
        this.loading = false;
        if (response.statusCode === 200) {
  
          const pending = response.data.filter((item: { status: string; }) => item.status === 'Confirmed');
          this.dataSource = new MatTableDataSource(pending);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        } else if (response.statusCode === 401) {
          this.router.navigateByUrl('/');
          console.warn(response.message);
        }
      },
      (error) => {
        this.loading = false;
        this.router.navigateByUrl('/');
        console.error('Failed to load referrals.', error);
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

      addReferrals() {
        let config = new MatDialogConfig()
        config.disableClose = false
        config.role = 'dialog'
        config.maxWidth ='100vw'
        config.maxHeight = '100vh'
        config.width = '850px'
        config.panelClass = 'full-screen-modal'

        const dialogRef = this.dialog.open(AddReferralsComponent,config);

        dialogRef.afterClosed().subscribe(result => {
          this.getReferrals();
        });
      }

      updateRefererral(id: any) {
        let config = new MatDialogConfig()
        config.disableClose = false
        config.role = 'dialog'
        config.maxWidth ='100vw'
        config.maxHeight = '100vh'
        config.width = '850px'
        config.panelClass = 'full-screen-modal'
        config.data = {id: id}

        const dialogRef = this.dialog.open(AddReferralsComponent,config);

        dialogRef.afterClosed().subscribe(result => {
          this.getReferrals();
        });
      }



      confirmBlock(data: any) {
        const message = data.deleted_at ?
          'Are you sure you want to unblock' :
          'Are you sure you want to block';

        this.uiFeedback.fire({
          title: "Confirm",
          html: `${message} <b>${data.referral_id}</b>`,
          icon: "warning",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Confirm",
          cancelButtonColor: "#D5D8DC",
          cancelButtonText: "Cancel",
          showCancelButton: true
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
          this.referralService.unblockReferral(data.referral_id).subscribe(response => {
            if (response.statusCode === 200) {
              this.uiFeedback.fire({
                title: "Success",
                text: response.message,
                icon: "success",
                confirmButtonColor: "#4690eb",
                confirmButtonText: "Continue"
              });
              this.getReferrals();
            } else {
              this.uiFeedback.fire({
                title: "Error",
                text: response.message,
                icon: "error",
                confirmButtonColor: "#4690eb",
                confirmButtonText: "Continue"
              });
            }
          });
        } else {
          // Block the referral (assuming some blocking logic)
          this.referralService.deleteReferral(data.referral_id).subscribe(response => {
            if (response.statusCode === 200) {
              this.uiFeedback.fire({
                title: "Success",
                text: response.message,
                icon: "success",
                confirmButtonColor: "#4690eb",
                confirmButtonText: "Continue"
              });
              this.getReferrals();
            } else {
              this.uiFeedback.fire({
                title: "Error",
                text: response.message,
                icon: "error",
                confirmButtonColor: "#4690eb",
                confirmButtonText: "Continue"
              });
            }
          });
        }
      }


          getBills(id:any){
            //  console.log("hiiii",id);
             let config = new MatDialogConfig()
             config.disableClose = false
             config.role = 'dialog'
             config.maxWidth ='100vw'
             config.maxHeight = '100vh'
             config.width = '850px'
             config.panelClass = 'full-screen-modal'
             config.data = {id: id}

             const dialogRef = this.dialog.open(BillComponent,config);

             dialogRef.afterClosed().subscribe(result => {
               this.getReferrals();
             });
           }

           displayMoreData(data: any) {

            const id = data.referral_id;
             this.router.navigate(['/pages/config/referrals/more', id]); // Navigate to the new page with complain_id
           }

            // USER ROLES
    public getUserRole(): any {
      return localStorage.getItem('roles');

    }

    public get isStaff(): boolean {
      return this.getUserRole() === 'ROLE STAFF';
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


      }
