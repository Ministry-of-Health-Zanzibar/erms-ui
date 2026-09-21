import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
import { PartientService } from '../../../services/partient/partient.service';
import { environment } from '../../../../environments/environment.prod';
import { AddmedicalhistoryComponent } from '../addmedicalhistory/addmedicalhistory.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ConversationModalComponent } from '../../referrals/conversation-modal/conversation-modal.component';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.scss'],
})
export class PatientDetailsComponent implements OnInit {
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
        Swal.fire('Error', 'No patient history ID provided', 'error');
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
          Swal.fire('Error', 'No medical history found', 'error');
        }
      },
      error: (error: unknown) => {
        Swal.fire('Error', getApiErrorMessage(error, 'Failed to fetch patient history.'), 'error');
      },
    });
  }

  viewPDF(filePath: string) {
    if (filePath) {
      const url = this.documentUrl + filePath;
      window.open(url, '_blank');
    }
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

        Swal.fire({
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
