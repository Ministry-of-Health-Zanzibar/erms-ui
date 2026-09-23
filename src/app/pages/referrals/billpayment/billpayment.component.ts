import { CommonModule } from '@angular/common';
import { inject, Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionService } from '../../../services/authentication/permission.service';
import { BillFileService } from '../../../services/Bills/bill-file.service';
import { ReferralpaymentComponent } from '../referralpayment/referralpayment.component';
import { EmrSegmentedModule } from '@elementar/components';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../../environments/environment.prod';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  TableToolbarComponent,
} from '@shared/ui';

@Component({
  selector: 'app-billpayment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    EmrSegmentedModule,
    MatCardModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TableToolbarComponent,
  ],
  templateUrl: './billpayment.component.html',
  styleUrls: ['./billpayment.component.scss'],
})
export class BillpaymentComponent implements OnInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  public documentUrl = environment.fileUrl;

  loading = false;

  displayedColumns: string[] = [
    'id',
    'pdf',
    'amount',
    'paid_amount',
    'balance',
    'bill_period',
    'status',
    'action',
  ];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  hospital_id: number | null;
  payment: any[];
  totals: any;
  hospital_name: any;

  constructor(
    public permission: PermissionService,
    private billFileService: BillFileService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.hospital_id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.hospital_id) {
      this.getAllPaymentByHospital(this.hospital_id);
    }
  }


  public getAllPaymentByHospital(hospital_id: number) {
    this.loading = true;

    this.billFileService.getAllBillFilesForPaymentById(hospital_id).pipe(
      takeUntil(this.onDestroy),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.hospital_id = response.data.hospital_id;
          this.hospital_name = response.data.hospital_name;

          
          this.dataSource.data = (response.data.bill_files || []).map(
            (file: any) => {
              return {
                ...file,
                bill_start: file.bill_start ? new Date(file.bill_start) : null,
                bill_end: file.bill_end ? new Date(file.bill_end) : null,
              };
            }
          );

          this.totals = response.data.totals || {};
        } else {
          this.dataSource.data = [];
          this.totals = {};
        }

        // Attach paginator and sort if needed
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
      },
      error: () => {
        this.uiFeedback.fire('Error', 'Failed to fetch bill files', 'error');
      },
    });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  viewPDF(element: any) {
    const url = this.documentUrl + element.bill_file;
    window.open(url, '_blank');
  }

 addPayment(bill: any) {
  const config = new MatDialogConfig();

  config.data = bill;
  config.width = '950px';
  config.height = '1000px';

  this.dialog
    .open(ReferralpaymentComponent, config)
    .afterClosed()
    .pipe(takeUntil(this.onDestroy))
    .subscribe((result) => {
      if (result) {
        this.getAllPaymentByHospital(this.hospital_id!);
      }
    });
}

  displayMoreData(element: any) {
    const id = element.bill_file_id;
    this.router.navigate(['/pages/config/referrals/more-bill-file', id]);
  }

  confirmDelete(element: any) {
    this.uiFeedback.fire({
      title: 'Confirm',
      text: `Are you sure you want to delete "${element.bill_file_title}"?`,
      icon: 'warning',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteBill(element.bill_file_id);
      }
    });
  }

  deleteBill(id: number) {
    this.billFileService.deletebillFiles(id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
      if (res.statusCode === 200) {
        this.uiFeedback.fire('Deleted!', res.message, 'success');
        this.getAllPaymentByHospital(this.hospital_id!);
      } else {
        this.uiFeedback.fire('Error', res.message, 'error');
      }
    });
  }
}
