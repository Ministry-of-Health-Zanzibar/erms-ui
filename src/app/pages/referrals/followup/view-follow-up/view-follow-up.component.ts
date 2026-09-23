import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { PartientService } from '../../../../services/partient/partient.service';
import { FollowsService } from '../../../../services/Referral/follows.service';
import { AddFollowUpComponent } from '../add-follow-up/add-follow-up.component';
import { environment } from '../../../../../environments/environment.prod';
import {
  EmptyStateComponent,
  FileViewerComponent,
  LetterPreviewDialogComponent,
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
  public documentUrl = environment.fileUrl;
  public displayRoleForm!: FormGroup;
  loading: boolean = false;
  followListId: string | null = null;
  public follow: any = null;
  public hospitalLetters: any[] = [];
  public referralId: number | null = null;
  status: any;

  feedback: any = null;
  userRole: string | null = null;
  patientListInfo: any = null;

  constructor(
    private route: ActivatedRoute,
    public permission: PermissionService,
    private followService: FollowsService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.followListId = this.route.snapshot.paramMap.get('id');
    if (this.followListId) {
      this.getFeedbackById();
    }
  }

  getFeedbackById() {
    this.loading = true;

    this.followService.getFollowListById(this.followListId).subscribe(
      (response: any) => {
        this.loading = false;

        if (response?.data) {
          this.follow = response.data;

          this.referralId = this.follow.referrals?.[0]?.referral_id || null;

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
        console.error('Error fetching follow details:', error);
      }
    );
  }

  viewPDF(element: any) {
    if (element?.letter_file) {
      const url = element.letter_file.startsWith('http')
        ? element.letter_file
        : this.documentUrl + element.letter_file;

      this.dialog.open(FileViewerComponent, {
        width: 'min(96vw, 1200px)',
        height: 'min(92vh, 860px)',
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'file-viewer-dialog',
        data: {
          url,
          fileName: url.split('/').pop() || 'follow-up-letter',
          title: 'Uploaded follow-up letter',
          printTrackingUrl: `${environment.baseUrl}letter-documents/follow-ups/${element.letter_id}/print`,
          printTrackingBody: { language: 'sw' },
        },
      });
    }
  }

  addFollowWithOutcome(referral_id: any, outcome: string) {
    // console.log(
    //   `Adding follow-up for referral ${referral_id} with outcome ${outcome}`
    // );

    const config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { referral_id, outcome };

    const dialogRef = this.dialog.open(AddFollowUpComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.getFeedbackById();
      }
    });
  }

  printFollowUp(data: any, letter: any): void {
    if (!letter?.letter_id) {
      return;
    }

    const dialogRef = this.dialog.open(LetterPreviewDialogComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: 'min(96vw, 560px)',
      data: {
        kind: 'follow_up',
        id: letter.letter_id,
        patientName: data?.patient?.name || this.follow?.patient?.name,
        defaultLanguage: 'sw',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.printed) {
        this.getFeedbackById();
      }
    });
  }

  extractFileName(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || '';
  }
}
