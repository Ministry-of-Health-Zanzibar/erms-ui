import { inject, Component, DestroyRef, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment.prod';
import { ActivatedRoute, Router } from '@angular/router';
import { PartientService } from '../../../services/partient/partient.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FeedbackService } from '@shared/services/feedback.service';
import { AddmedicalhistoryComponent } from '../addmedicalhistory/addmedicalhistory.component';
import { finalize } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import {
  EmptyStateComponent,
  FileViewerComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
} from '@shared/ui';

@Component({
  selector: 'app-patient-history-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatPaginator,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  templateUrl: './patient-history-table.component.html',
  styleUrl: './patient-history-table.component.scss',
})
export class PatientHistoryTableComponent implements OnInit {
  private readonly uiFeedback = inject(FeedbackService);

  public documentUrl = environment.fileUrl;
  public loading = false;
  public checkingEligibility = false;

  dataSource = new MatTableDataSource<any>([]);
  patient: any;
  private patientId!: number;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private patientService: PartientService,
    private dialog: MatDialog,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.patientId = +id;
        this.fetchPatientHistory(this.patientId);
      } else {
        this.uiFeedback.fire('Error', 'No patient history ID provided', 'error');
      }
    });
  }

  // 🔵 Fetch history
  private fetchPatientHistory(id: number) {
    this.loading = true;

    this.patientService.getPartientHistoryListById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        if (response?.statusCode === 200 || response?.statusCode === 201) {
          this.patient = response.data.patient;
          const history = this.patient?.patient_histories || [];

          this.dataSource = new MatTableDataSource(history);
          this.dataSource.paginator = this.paginator;
        } else {
          this.uiFeedback.fire('Error', 'No medical history found', 'error');
        }
      },
      error: () => {
        this.uiFeedback.fire('Error', 'Failed to fetch patient history', 'error');
      },
    });
  }

  // 🔵 View PDF in the in-app file viewer
  viewPDF(filePath: string): void {
    if (!filePath) {
      return;
    }

    const url = this.buildDocumentUrl(filePath);
    const fileName = url.split(/[?#]/, 1)[0].split('/').pop() || 'medical-history-file.pdf';
    const title = 'Medical history file';

    this.dialog.open(FileViewerComponent, {
      data: {
        url,
        shareUrl: url,
        fileName,
        title,
        mimeType: 'application/pdf',
      },
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

  openAddMedicalHistory(patient: any = this.patient): void {
    if (!patient?.patient_id) {
      this.uiFeedback.fire('Error', 'Patient information is still loading.', 'error');
      return;
    }

    const matibabuCard = String(patient.matibabu_card || '').trim();

    if (!matibabuCard) {
      this.uiFeedback.fire(
        'Eligibility check failed',
        'This patient does not have a Matibabu card number.',
        'error',
      );
      return;
    }

    if (this.checkingEligibility) {
      return;
    }

    this.checkingEligibility = true;

    this.patientService
      .searchPatientEligibility({ matibabu_card: matibabuCard })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.checkingEligibility = false)),
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success !== true) {
            this.uiFeedback.fire(
              'Patient not eligible',
              response?.message || 'This patient is not eligible for a new medical history.',
              'warning',
            );
            return;
          }

          this.openMedicalHistoryDialog({
            ...patient,
            ...(response?.data || {}),
          });
        },
        error: (error: any) => {
          this.uiFeedback.fire(
            'Eligibility check failed',
            error?.error?.message || 'Unable to check patient eligibility. Please try again.',
            'error',
          );
        },
      });
  }

  private openMedicalHistoryDialog(patient: any): void {

    const config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.width = 'min(960px, calc(100vw - 24px))';
    config.maxWidth = '100vw';
    config.maxHeight = 'calc(100vh - 24px)';
    config.panelClass = 'full-screen-modal';
    config.data = patient;

    const dialogRef = this.dialog.open(AddmedicalhistoryComponent, config);

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result?.success) {
        this.uiFeedback.fire({
          title: 'Medical History Added',
          text: 'The patient medical history was saved successfully!',
          icon: 'success',
          confirmButtonColor: '#4690eb',
        });

        this.fetchPatientHistory(this.patientId);
      }
    });
  }


  displayMoreData(data: any) {
    const id = data.patient_histories_id;
    this.router.navigate(['/pages/patient/patient', id]);
  }

  refreshData() {
    if (this.patientId) {
      this.fetchPatientHistory(this.patientId);
    }
  }
}
