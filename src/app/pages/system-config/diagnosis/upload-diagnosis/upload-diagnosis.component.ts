import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FeedbackService } from '@shared/services/feedback.service';
import { DiagnosisService } from '../../../../services/system-configuration/diagnosis.service';

@Component({
  selector: 'app-upload-diagnosis',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './upload-diagnosis.component.html',
  styleUrl: './upload-diagnosis.component.scss'
})
export class UploadDiagnosisComponent {
  private readonly uiFeedback = inject(FeedbackService);

  readonly dialogRef = inject(MatDialogRef<UploadDiagnosisComponent>);
  selectedFile: File | null = null;
  uploadProgress = 0;
  uploading = false;
  errorMessage: string | null = null;

  constructor(private diagnosisService: DiagnosisService) {}

  // 📁 When user selects file
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

uploadFile(): void {
  if (this.selectedFile) {
    // console.log('file:', this.selectedFile.name);

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.uploading = true;

    this.diagnosisService.addDiagnosis(formData).subscribe({
      next: event => {
        if (event && event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          }
        } else if (event instanceof HttpResponse) {
          this.uploading = false;
          this.uploadProgress = 0;

          this.uiFeedback.fire({
            title: "Success",
            text: event.body.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          }).then(result => {
            if (result.isConfirmed) {
              // ✅ Reload the page after confirmation
              window.location.reload();
            }
          });

          this.onClose();
        }
      },
      error: err => {
        this.uploading = false;
        this.uploadProgress = 0;
        this.errorMessage = 'An error occurred during the upload process.';
        console.error('Error occurred:', err);
        this.onClose();

        this.uiFeedback.fire({
          title: "Error",
          text: this.errorMessage,
          icon: "error",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Continue"
        });
      }
    });
  }
}


  // ❌ Close dialog
  onClose() {
    this.dialogRef.close();
  }
}
