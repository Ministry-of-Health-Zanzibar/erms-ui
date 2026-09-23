import { inject, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';

import { BillService } from '../../../../services/system-configuration/bill.service';

export interface AddBillDialogData {
  billFileId: number;
  hospitalId: number;
  billTitle: string;
  referralOptions: any[];
  billData?: any;
}

@Component({
  selector: 'app-add-bills',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './add-bills.component.html',
  styleUrls: ['./add-bills.component.scss'],
})
export class AddBillsComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  billForm: FormGroup;
  loading = false;
  minDate: Date;
  maxDate: Date;
  referrals: any[] = [];
  private onDestroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private billsService: BillService,
    public dialogRef: MatDialogRef<AddBillsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddBillDialogData
  ) {
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear, 0, 1);
    this.maxDate = new Date(currentYear, 11, 31);

    this.billForm = this.fb.group({
      referral_id: ['', Validators.required],
      total_amount: ['', [Validators.required, Validators.min(0)]],
      bill_period_start: ['', Validators.required],
      bill_period_end: ['', Validators.required],
      bill_file_id: [data.billFileId, Validators.required],
    });
  }

  ngOnInit(): void {
    // Patch all fields except referral
    if (this.data.billData) {
      const billData = this.data.billData;
      this.billForm.patchValue({
        total_amount: billData.total_amount || '',
        bill_period_start: billData.bill_period_start
          ? new Date(billData.bill_period_start)
          : null,
        bill_period_end: billData.bill_period_end
          ? new Date(billData.bill_period_end)
          : null,
        bill_file_id: billData.bill_file_id || this.data.billFileId,
      });
    }

    // Load referrals and patch referral_id
    if (this.data.hospitalId && this.data.billFileId) {
      this.loadReferrals(this.data.hospitalId, this.data.billFileId);
    }
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // private loadReferrals(hospitalId: number, billFileId: number) {
  //   this.billsService
  //     .getReferralsByHospital(hospitalId, billFileId)
  //     .pipe(takeUntil(this.onDestroy$))
  //     .subscribe({
  //       next: (res) => {
  //         if (res?.data) {

  //           this.referrals = res.data.map((r: any) => ({
  //             ...r,
  //             referral_id: Number(r.referral_id),
  //           }));

  //           const billReferralId = Number(
  //             this.data.billData?.referral?.referral_id
  //           );
  //           if (
  //             billReferralId &&
  //             this.referrals.some((r) => r.referral_id === billReferralId)
  //           ) {
  //             this.billForm.patchValue({ referral_id: billReferralId });
  //           }
  //         } else {
  //           this.referrals = [];
  //           this.uiFeedback.fire('Error', res.message || 'No referrals found', 'error');
  //         }
  //       },
  //       error: () => {
  //         this.referrals = [];
  //         this.uiFeedback.fire('Error', 'Failed to load referrals', 'error');
  //       },
  //     });
  // }

  private loadReferrals(hospitalId: number, billFileId: number) {
    this.billsService
      .getReferralsByHospital(hospitalId, billFileId)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            // Ensure referral_id is a number
            this.referrals = res.data.map((r: any) => ({
              ...r,
              referral_id: Number(r.referral_id),
            }));

            // Patch referral_id AFTER referrals are loaded
            const billReferralId = Number(
              this.data.billData?.referral?.referral_id
            );
            if (
              billReferralId &&
              this.referrals.some((r) => r.referral_id === billReferralId)
            ) {
              this.billForm.patchValue({ referral_id: billReferralId });
            }
          } else {
            this.referrals = [];
            this.uiFeedback.fire('Error', res.message || 'No referrals found', 'error');
          }
        },
        error: () => {
          this.referrals = [];
          this.uiFeedback.fire('Error', 'Failed to load referrals', 'error');
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.billForm.valid) return;

    this.loading = true;

    const formValue = {
      ...this.billForm.value,
      bill_period_start: this.formatDate(this.billForm.value.bill_period_start),
      bill_period_end: this.formatDate(this.billForm.value.bill_period_end),
    };

    setTimeout(() => {
      this.loading = false;
      this.dialogRef.close(formValue);
    }, 1200);
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onStartDateChange(): void {
    const startDate = this.billForm.get('bill_period_start')?.value;
    const endDate = this.billForm.get('bill_period_end')?.value;
    if (startDate && endDate && startDate > endDate) {
      this.billForm.get('bill_period_end')?.setValue(null);
    }
  }
}
