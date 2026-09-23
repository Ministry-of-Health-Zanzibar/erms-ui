import { inject, Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FeedbackService } from '@shared/services/feedback.service';
import { ActivatedRoute } from '@angular/router';
import { PartientService } from '../../../services/partient/partient.service';
import { environment } from '../../../../environments/environment.prod';
import { AddmedicalhistoryComponent } from '../addmedicalhistory/addmedicalhistory.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ConversationModalComponent } from '../../referrals/conversation-modal/conversation-modal.component';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { FileViewerComponent } from '@shared/ui';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.scss',
})
export class PatientDetailsComponent implements OnInit {
  private readonly uiFeedback = inject(FeedbackService);
  public documentUrl = environment.fileUrl;
  public loading = false;

  medicalHistory: any = null;
  patient: any;
  p: any;

  constructor(
    private route: ActivatedRoute,
    private patientService: PartientService,
    private dialog: MatDialog,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.fetchPatientHistory(+id);
      } else {
        this.uiFeedback.fire('Error', 'No patient history ID provided', 'error');
      }
    });
  }

  private fetchPatientHistory(id: number) {
    this.loading = true;
    this.patientService.getPartientById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        if (response?.status && response?.data) {
          this.medicalHistory = response.data;
        } else {
          this.uiFeedback.fire('Error', 'No medical history found', 'error');
        }
      },
      error: (error: unknown) => {
        this.uiFeedback.fire('Error', getApiErrorMessage(error, 'Failed to fetch patient history.'), 'error');
      },
    });
  }

  viewPDF(filePath: string) {
    if (!filePath) {
      return;
    }

    this.openFileViewer(filePath, 'Medical history file');
  }

  private openFileViewer(filePath: string, title: string): void {
    const url = this.buildDocumentUrl(filePath);

    this.dialog.open(FileViewerComponent, {
      data: { url, title },
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

  openAddMedicalHistory(patient: any) {
    const config = new MatDialogConfig();

    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '98vh';
    config.panelClass = 'full-screen-modal';

    // console.log('Element sent to dialog   0:', patient);

    config.data = patient;

    const dialogRef = this.dialog.open(AddmedicalhistoryComponent, config);

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result && result.success) {
        // console.log('✅ New medical history saved:', result.data);

        this.uiFeedback.fire({
          title: 'Medical History Added',
          text: 'The patient medical history was saved successfully!',
          icon: 'success',
          confirmButtonColor: '#4690eb',
        });
      } else {
        // console.log('Dialog closed without saving.');
      }
    });
  }

   openConversationModal(patientHistoryId: number) {
    this.dialog.open(ConversationModalComponent, {
      width: '600px',
      data: { patientHistoryId }
    });
  }
}
