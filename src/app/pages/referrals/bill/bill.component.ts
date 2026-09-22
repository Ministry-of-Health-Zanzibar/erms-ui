import { BillService } from '../../../services/system-configuration/bill.service';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { HDividerComponent } from '@elementar/components';
import Swal from 'sweetalert2';
import { map, Observable, startWith, Subject } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bill',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatLabel,
    MatCheckbox,
    ReactiveFormsModule,
    HDividerComponent,
    MatAutocompleteModule,
    MatSelect,
    MatDatepickerModule,
  ],
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.scss'],
})
export class BillComponent implements OnInit, OnDestroy {
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible:boolean = true
  private readonly onDestroy = new Subject<void>();
  public onAddBillEventEmitter = new EventEmitter();
  public onEditBillEventEmitter = new EventEmitter();
  public billsForm: FormGroup;
  public dialogAction: 'CREATE' | 'EDIT' = 'CREATE';
  public action = 'Save';
  public fileError: string | null = null;
  public selectedFile: File | null = null;
  id: any;

private router: Router
  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private billService: BillService,

    private dialogRef: MatDialogRef<BillComponent>
  ) {}

  ngOnInit(): void {
    // this.data = this.dialogData?.data;
    if (this.data) {
      this.id = this.data.id; // This is your referral_id
      // console.log('referral_id (from dialog): ', this.id);
    }

    this.billsForm = new FormGroup({
      amount: new FormControl(null, [Validators.required]),
      notes: new FormControl('', Validators.required),
      sent_to: new FormControl('', [Validators.required]),
    });

    if (this.dialogData?.action === 'EDIT') {
      this.dialogAction = 'EDIT';
      this.action = 'Update';
      this.patchFormValues(this.dialogData.data);
    }
  }

  patchFormValues(data: any) {
    this.billsForm.patchValue({
      amount: data.amount,
      notes: data.notes,
      sent_to: data.sent_to,
    });
  }

  public handleBillSubmit(): void {
    if (this.billsForm.invalid) return;

    this.dialogAction === 'EDIT' ? this.updateBill() : this.addBill();
  }

  public addBill(): void {
    const formData = this.prepareFormData();

    this.billService.addBill(formData).subscribe(
      (response: any) => {
        this.dialogRef.close();
        this.onAddBillEventEmitter.emit();
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/referrals/billpayment2222200000']);
      });

      },
      (error) => {
        Swal.fire('Error', error.error.message, 'error');
      }
    );
  }

  public updateBill(): void {
    const formData = this.prepareFormData();

    this.billService.updateBill(formData, this.dialogData.data.id).subscribe(
      (response: any) => {
        this.dialogRef.close();
        this.onEditBillEventEmitter.emit();
        Swal.fire('Success', response.message, 'success');
      },
      (error) => {
        Swal.fire('Error', error.error.message, 'error');
      }
    );
  }

  private prepareFormData(): FormData {
    const formData = new FormData();

    if (this.id === undefined || this.id === null) {
      console.error('Referral ID is undefined or null');
      throw new Error('Referral ID is missing.');
    }

    formData.append('referral_id', this.id.toString()); // Convert to string if needed
    formData.append('amount', this.billsForm.get('amount')?.value);
    formData.append('notes', this.billsForm.get('notes')?.value);
    formData.append('sent_to', this.billsForm.get('sent_to')?.value);

    if (this.selectedFile) {
      formData.append('bill_file', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];

      // Validate file type
      if (file.type !== 'application/pdf') {
        this.fileError = 'Only PDF files are allowed.';
        return;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File size must not exceed 5MB.';
        return;
      }

      this.fileError = null;
      this.selectedFile = file;
    }
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  public onClose(): void {
    this.dialogRef.close(false);
  }
}
