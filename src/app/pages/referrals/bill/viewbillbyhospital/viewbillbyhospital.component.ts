import { Component, DestroyRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
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
import { BillFileFormComponent } from '../bill-file-form/bill-file-form.component';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  TableToolbarComponent,
} from '@shared/ui';

@Component({
  selector: 'app-viewbillbyhospital',
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
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
  ],
  templateUrl: './viewbillbyhospital.component.html',
  styleUrl: './viewbillbyhospital.component.scss'
})

export class ViewbillbyhospitalComponent implements OnInit, AfterViewInit {
  hospitalId!: number;
  hospitalData: any;
  totalBillAmount: number = 0;
   public documentUrl = environment.fileUrl;

  displayedColumns: string[] = [
    'id',
    'pdf',
    'amount',
    'bill_start',
    'bill_end',
    'actions'
  ];

  dataSource = new MatTableDataSource<any>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    public permission: PermissionService,
    private billFileService: BillFileService,
     private dialog: MatDialog,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.hospitalId = +params['id'];
      this.loadBillsByHospital();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

isDollarCurrency = false;

loadBillsByHospital(): void {
  this.loading = true;

  this.billFileService.getBillsByHospitalId(this.hospitalId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: (response: any) => {
      this.dataSource.data = response.data || [];

      if (response.data?.length) {
        this.hospitalData = response.data[0].hospital;

        this.isDollarCurrency =
          this.hospitalData?.hospital_name ===
          'Madras Institute of Orthopaedics and Traumatology (MIOT)';
      }

      this.totalBillAmount = this.dataSource.data.reduce(
        (sum: number, bill: any) =>
          sum + Number(bill.bill_file_amount || 0),
        0
      );

      this.loading = false;
    },
    error: () => {
      this.loading = false;
    }
  });
}

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  viewPDF(element: any) {
  if (element?.bill_file) {
    const url = this.documentUrl + element.bill_file; 
    window.open(url, '_blank');
  }
}

    displayMoreData(data: any) {
    const id = data.bill_file_id;
    this.router.navigate(['/pages/config/referrals/more-bill-file', id]);
  }

  updateBill(data: any) {
      let config = new MatDialogConfig();
      config.disableClose = false;
      config.role = 'dialog';
      config.maxWidth = '100vw';
      config.maxHeight = '100vh';
      config.height = '600px';
      config.width = '850px';
      config.panelClass = 'full-screen-modal';
      config.data = { data: data };
  
      const dialogRef = this.dialog.open(BillFileFormComponent, config);
      dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result: any) => {
        if (result) {
          this.loadBillsByHospital();
        }
      });
    }
}
