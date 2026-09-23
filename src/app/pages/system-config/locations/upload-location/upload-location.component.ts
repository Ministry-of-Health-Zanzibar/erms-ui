import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FeedbackService } from '@shared/services/feedback.service';
import { LocationService } from '../../../../services/system-configuration/location.service';

@Component({
  selector: 'app-upload-location',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './upload-location.component.html',
  styleUrl: './upload-location.component.scss'
})
export class UploadLocationComponent {
  private readonly uiFeedback = inject(FeedbackService);

  readonly dialogRef = inject(MatDialogRef<UploadLocationComponent>);
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  uploading: boolean = false;
  errorMessage: string | null = null;

  constructor(private locationService: LocationService){}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  uploadFile(): void {
    if (this.selectedFile) {
      // Handle file upload logic here
      // console.log('Uploading file:', this.selectedFile.name);
      // Example: using FormData to upload the file to a backend server
      const formData = new FormData();
      formData.append('upload_excel', this.selectedFile);

      this.locationService.addLocation(formData).subscribe(
        {
          next: event => {
            if (event && event.type === HttpEventType.UploadProgress) {
              if (event.total) {
                this.uploadProgress = Math.round((100 * event.loaded) / event.total);
              }
            } else if (event instanceof HttpResponse) {
              this.uploading = false;
              this.uploadProgress = 0;
              // console.log('Upload complete:', event.body);
              this.onClose();
              this.uiFeedback.fire({
                title: "Success",
                text: event.body.message,
                icon: "success",
                confirmButtonColor: "#4690eb",
                confirmButtonText: "Continue"
              });
              // Handle successful response here
            }
          },
          error: err => {
            this.uploading = false;
            this.uploadProgress = 0;
            this.errorMessage = 'An error occurred during the upload process.';
            console.error('Error occurred:', err);
            this.onClose();
            // Handle error response here
            this.uiFeedback.fire({
              title: "Error",
              text: this.errorMessage,
              icon: "error",
              confirmButtonColor: "#4690eb",
              confirmButtonText: "Continue"
            });
          }
        }
      );
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
