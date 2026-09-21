import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { GlobalConstants } from '@shared/global-constants';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { finalize, Subject, takeUntil } from 'rxjs';
import { LocationService } from '../../../../services/system-configuration/location.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-location',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInput,
    MatFormField,
    MatLabel,
    MatDialogModule,
    MatCheckbox,
    MatError,
    ReactiveFormsModule,
    HDividerComponent
  ],
  templateUrl: './add-location.component.html',
  styleUrl: './add-location.component.scss'
})
export class AddLocationComponent implements OnInit,OnDestroy {

  private readonly onDestroy = new Subject<void>()
  public sidebarVisible:boolean = true

  locationForm: FormGroup;
  parent: any;
  uploadProgress: number = 0;
  uploading: boolean = false;
  errorMessage: string | null = null;
  submitting = false;

  constructor(private locationService: LocationService,
    private dialogRef: MatDialogRef<AddLocationComponent>) {
      this.getParent();
  }

  ngOnInit(): void {
    this.configForm();
  }

  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  onClose() {
    this.dialogRef.close(false)
  }

  configForm(){
    this.locationForm = new FormGroup({
      location_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
      parent_id: new FormControl(null),
      label: new FormControl(null)
    });
  }

  getParent() {
    this.locationService.getAllLocation().pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
      this.parent = response.data;
    });
  }

  saveLocation(): void {
    if (this.locationForm.invalid || this.submitting) {
      this.locationForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.uploading = true;
    this.locationService.addLocation(this.locationForm.value).pipe(
      takeUntil(this.onDestroy),
      finalize(() => {
        this.submitting = false;
        this.uploading = false;
        this.uploadProgress = 0;
      })
    ).subscribe({
          next: event => {
            if (event && event.type === HttpEventType.UploadProgress) {
              if (event.total) {
                this.uploadProgress = Math.round((100 * event.loaded) / event.total);
              }
            } else if (event instanceof HttpResponse) {
              const response = event.body as { message?: string; statusCode?: number } | null;
              if (!response?.statusCode || response.statusCode === 200 || response.statusCode === 201) {
                Swal.fire({
                  title: 'Success',
                  text: response?.message || 'Location saved successfully.',
                  icon: 'success',
                  confirmButtonColor: '#4690eb',
                  confirmButtonText: 'Continue'
                }).then(() => this.dialogRef.close(true));
                return;
              }

              this.showError(response.message || 'Unable to save the location.');
            }
          },
          error: (error: unknown) => {
            this.showError(getApiErrorMessage(error, 'Unable to save the location. Please try again.'));
          }
    });
  }

  private showError(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonColor: '#4690eb',
      confirmButtonText: 'Close'
    });
  }
}
