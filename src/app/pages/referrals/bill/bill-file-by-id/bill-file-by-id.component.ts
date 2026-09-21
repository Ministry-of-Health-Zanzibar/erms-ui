import { Component, DestroyRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import Swal from 'sweetalert2';

import { PermissionService } from '../../../../services/authentication/permission.service';
import { BillFileService } from '../../../../services/Bills/bill-file.service';
import { BillService } from '../../../../services/system-configuration/bill.service';
import {
  AddBillDialogData,
  AddBillsComponent,
} from '../add-bills/add-bills.component';
import { ReferralService } from '../../../../services/Referral/referral.service';
import { environment } from '../../../../../environments/environment.prod';
import { MatDialogConfig } from '@angular/material/dialog';
import { BillFileFormComponent } from '../bill-file-form/bill-file-form.component';

interface BillFile {
  bill_file_id: number;
  bill_file_title: string;
  bill_file_amount: number;
  hospital_id: number;
  bill_file?: string;
}

interface Bill {
  bill_id: number;
  referral_id: number;
  referral_number?: string;
  patient_name?: string;
  hospital_name?: string;
  total_amount: number;
  bill_period_start: string;
  bill_period_end: string;
  bill_status: string;
}

@Component({
  selector: 'app-bill-file-by-id',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatMenuModule,
  ],
  templateUrl: './bill-file-by-id.component.html',
  styleUrls: ['./bill-file-by-id.component.scss'],
  providers: [DatePipe],
})
export class BillFileByIdComponent implements OnInit, AfterViewInit {
  public bills: BillFile[] = [];
  public loading = false;
  public bill_id: string | null = null;
  // public bill_file_id: number | null = null;
  public bill_file_id: number;

  public documentUrl = environment.fileUrl;

  displayedBillFileColumns: string[] = [
    'bill_file_title',
    'bill_file',
    'bill_file_amount',
    'actions',
  ];
  billFileDataSource: MatTableDataSource<BillFile> =
    new MatTableDataSource<BillFile>();

  displayedBillColumns: string[] = [
    'bill_id',
    'referral_number',
    'patient_name',
    'hospital_name',
    'total_amount',
    'bill_period',
    'bill_status',
    'actions',
  ];
  billDataSource: MatTableDataSource<Bill> = new MatTableDataSource<Bill>();

  @ViewChild('billFilePaginator') billFilePaginator!: MatPaginator;
  @ViewChild('billFileSort') billFileSort!: MatSort;
  @ViewChild('billPaginator') billPaginator!: MatPaginator;
  @ViewChild('billSort') billSort!: MatSort;
  element: any;

  constructor(
    private route: ActivatedRoute,
    public permission: PermissionService,
    private billService: BillService,
    private billFileService: BillFileService,
    private referralService: ReferralService,
    private router: Router,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.bill_id = this.route.snapshot.paramMap.get('id');
    if (this.bill_id) {
      this.getBillFileAndBills(this.bill_id);
    }
  }

  ngAfterViewInit(): void {
    this.billFileDataSource.paginator = this.billFilePaginator;
    this.billFileDataSource.sort = this.billFileSort;

    this.billDataSource.paginator = this.billPaginator;
    this.billDataSource.sort = this.billSort;
  }

  applyBillFileFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.billFileDataSource.filter = filterValue.trim().toLowerCase();
  }

  applyBillFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.billDataSource.filter = filterValue.trim().toLowerCase();
  }

  private getBillFileAndBills(billId: string) {
    this.loading = true;
    this.billFileService.getbillFilesById(billId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.data) {
          this.bills = [response.data];
          this.billFileDataSource.data = this.bills;
          this.bill_file_id = response.data.bill_file_id;
          if (this.bill_file_id) {
            this.loadBillsByBillFileId(this.bill_file_id);
          }
        } else {
          this.bills = [];
          this.billFileDataSource.data = [];
          this.billDataSource.data = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching bill file:', error);
        Swal.fire('Error', 'Failed to fetch bill file', 'error');
      },
    });
  }

  private loadBillsByBillFileId(bill_file_id: number) {
    this.loading = true;
    this.billFileService.getbillsBybillFile(bill_file_id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.loading = false;
        const responseData = res?.data;
        this.billDataSource.data = responseData
          ? Array.isArray(responseData)
            ? responseData.map((bill) => this.formatBill(bill))
            : [this.formatBill(responseData)]
          : [];
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error fetching bills:', err);
        Swal.fire('Error', 'Failed to fetch bills', 'error');
      },
    });
  }

  private formatBill(bill: any): Bill {
    return {
      bill_id: bill.bill_id,
      referral_id: bill.referral_id,
      referral_number: bill?.referral?.referral_number || 'N/A',
      patient_name: bill?.referral?.patient?.name || 'N/A',
      hospital_name: bill?.referral?.hospital?.hospital_name || 'N/A',
      total_amount: bill.total_amount,
      bill_period_start: bill.bill_period_start,
      bill_period_end: bill.bill_period_end,
      bill_status: bill.bill_status,
    };
  }

  addPatientToBill(billFileId: number) {
    const dialogData: AddBillDialogData = {
      billFileId,
      hospitalId: this.bills[0]?.hospital_id,
      billTitle: this.bills[0]?.bill_file_title || 'Bill',
      referralOptions: [],
    };

    const dialogRef = this.dialog.open(AddBillsComponent, {
      width: '600px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.createBill(result);
      }
    });
  }

  private createBill(billData: any) {
    this.loading = true;
    this.billService.addBill(billData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.data) {
          this.loadBillsByBillFileId(this.bill_file_id!);
        }
        Swal.fire(
          'Success',
          response.message || 'Bill created successfully',
          'success'
        );
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating bill:', error);
        let errorMessage = 'Failed to create bill. Please try again.';
        if (error.status === 422 && error.error?.message) {
          errorMessage = error.error.message;
        }
        Swal.fire('Error', errorMessage, 'error');
      },
    });
  }

  deleteBill(billId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.billService.deleteBill(billId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.billDataSource.data = this.billDataSource.data.filter(
              (b) => b.bill_id !== billId
            );
            this.loading = false;
            Swal.fire('Deleted!', 'The bill has been deleted.', 'success');
          },
          error: (error) => {
            this.loading = false;
            console.error('Error deleting bill:', error);
            Swal.fire('Error', 'Failed to delete bill', 'error');
          },
        });
      }
    });
  }
  displayBillDetails(data: any) {
    const id = data.bill_id;
    this.router.navigate(['/pages/config/referrals/bills-details', id]);
  }

  billFileIterm(data: any) {
    const id = data.bill_id;
    this.router.navigate(['/pages/config/referrals/bill-iterm-details', id]);
  }

  viewPDF(file: any) {
    if (file?.bill_file) {
      const url = this.documentUrl + file.bill_file;
      window.open(url, '_blank');
    }
  }

  updateBill(billData: any) {
    const dialogRef = this.dialog.open(AddBillsComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '600px',
      width: '850px',
      panelClass: 'full-screen-modal',
      data: {
        billFileId: billData.bill_file_id,
        hospitalId: billData.hospital_id,
        billTitle: billData.bill_file_title || 'Bill',
        referralOptions: [],
        billData: billData,
      } as AddBillDialogData,
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: any) => {
      if (result) {
        this.loadBillsByBillFileId(this.bill_file_id);
      }
    });
  }

  openUpdateDialog(bill: any): void {
    const dialogRef = this.dialog.open(AddBillsComponent, {
     
      data: {
        billFileId: bill.bill_file_id,
        hospitalId: bill.hospital_id,
        billTitle: `Editing ${bill.bill_number || 'Bill'}`,
        referralOptions: [],
        billData: bill,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: any) => {
      if (result) {
        this.billService.updateBill(result, bill.bill_id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            Swal.fire('Updated!', 'Bill updated successfully', 'success');
            this.loadBillsByBillFileId(this.bill_file_id);
          },
          error: () => Swal.fire('Error', 'Failed to update bill', 'error'),
        });
      }
    });
  }
}
