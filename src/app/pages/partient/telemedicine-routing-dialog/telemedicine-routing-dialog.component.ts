import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-telemedicine-routing-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './telemedicine-routing-dialog.component.html',
  styleUrl: './telemedicine-routing-dialog.component.scss',
})
export class TelemedicineRoutingDialogComponent {
  readonly form = this.formBuilder.group({
    telemedicine_type: ['', Validators.required],
    telemedicine_reason: ['', [Validators.required, Validators.maxLength(4000)]],
    telemedicine_clinical_notes: ['', [Validators.required, Validators.maxLength(10000)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly dialogRef: MatDialogRef<TelemedicineRoutingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: { patientName?: string } | null,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const reason = String(value.telemedicine_reason || '').trim();
    const clinicalNotes = String(value.telemedicine_clinical_notes || '').trim();

    this.dialogRef.close({
      telemedicine_type: value.telemedicine_type,
      telemedicine_reason: reason,
      telemedicine_clinical_notes: clinicalNotes,
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
