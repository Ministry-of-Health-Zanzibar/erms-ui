import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-workflow-undo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './workflow-undo-dialog.component.html',
  styleUrl: './workflow-undo-dialog.component.scss',
})
export class WorkflowUndoDialogComponent {
  readonly form = this.formBuilder.group({
    reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(2000)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly dialogRef: MatDialogRef<WorkflowUndoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: any,
  ) {}

  get reasonLength(): number {
    return String(this.form.controls.reason.value || '').length;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      reason: String(this.form.controls.reason.value || '').trim(),
    });
  }
}
