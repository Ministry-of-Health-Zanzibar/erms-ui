import { FormHeaderComponent } from '@shared/ui';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-bill-iterm-form',
  standalone: true,
  imports: [
    FormHeaderComponent,
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './bill-iterm-form.component.html',
  styleUrls: ['./bill-iterm-form.component.scss']
})
export class BillItermFormComponent implements OnInit {
  readonly data = inject<{ billId: number }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<BillItermFormComponent>);

  billForm: FormGroup;

  ngOnInit(): void {
    this.billForm = new FormGroup({
      bill_id: new FormControl(this.data.billId, Validators.required),
      description: new FormControl('', Validators.required),
      amount: new FormControl(null, [Validators.required, Validators.min(0)]),
    });
  }

  onSave() {
    if (this.billForm.valid) {
      this.dialogRef.close(this.billForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
