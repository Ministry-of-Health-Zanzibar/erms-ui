import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  MatError,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { HDividerComponent } from '@elementar/components';
import Swal from 'sweetalert2';
import { BillService } from '../../../services/system-configuration/bill.service';
import { Subject } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { PaymentsService } from '../../../services/payments.service';
import { BillFileService } from '../../../services/Bills/bill-file.service';
import { response } from 'express';
import { error } from 'console';

@Component({
  selector: 'app-referralpayment',
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
    MatIcon,
  ],
  templateUrl: './referralpayment.component.html',
  styleUrl: './referralpayment.component.scss',
})
export class ReferralpaymentComponent {
  private readonly onDestroy = new Subject<void>();
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible: boolean = true;

  clientForm: FormGroup;
  user: any;
  id: any;
  bill: any = null;
  billFile: any;

  constructor(
    private billServices: BillService,
    private paymentService: PaymentsService,
    private billFileService: BillFileService,
    private dialogRef: MatDialogRef<ReferralpaymentComponent>
  ) {}

  
  ngOnInit(): void {
    this.configForm();

    if (this.data) {
      this.id = Number(this.data.bill_file_id);
      // console.log('Bill File data:', this.data);

      this.clientForm.patchValue({
        bill_file_id: this.id,
      });

      this.billFile = this.data;
    }
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  loadBills() {
    this.billFileService.getAllBillFiles().subscribe((response: any) => {
      if (response.statusCode === 200 && response.data) {
        this.billFile = response.data;
        // console.log('Available Bill Files:', this.billFile);
      }
    });
  }

  configForm() {
    this.clientForm = new FormGroup({
      bill_file_id: new FormControl(null, Validators.required),
      payer: new FormControl(null, Validators.required),
      amount_paid: new FormControl(null, Validators.required),
      currency: new FormControl('TZS'),
      payment_method: new FormControl(null, Validators.required),
      reference_number: new FormControl(null),
      voucher_number: new FormControl(null),
      payment_date: new FormControl(new Date(), Validators.required),
    });
  }

  getBillByIds() {
    this.billServices.getBillById(this.id).subscribe(
      (response: any) => {
        if (response.statusCode === 200 && response.data) {
          this.bill = response.data;
          // console.log('Bill data:', this.bill);
        }
      },
      (error) => {
        console.error('Error fetching bill:', error);
      }
    );
  }

  savePayment() {
  if (this.clientForm.valid) {
    const formData = {
      ...this.clientForm.value,
      payment_date: this.clientForm.value.payment_date.toISOString(),
    };

    this.paymentService.addPayment(formData).subscribe({
      next: (response: any) => {
        if (response.statusCode === 200) {
          Swal.fire('Success', response.message, 'success');
          this.dialogRef.close(true);
        } else {
          Swal.fire('Error', response.message || 'Something went wrong', 'error');
        }
      },
      error: (err) => {
       
        const errorMessage =
          err.error?.message || 'An unexpected error occurred. Please try again.';

        Swal.fire('Error', errorMessage, 'error');
      },
    });
  }
}

}
