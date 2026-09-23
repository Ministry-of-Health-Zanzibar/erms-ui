import { inject, Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { FeedbackService } from '@shared/services/feedback.service';

import { BillItermService } from '../../../../services/Bills/bill-iterm.service';
import { BillItermFormComponent } from '../bill-iterm-form/bill-iterm-form.component';
import { VDividerComponent, EmrSegmentedModule } from '@elementar/components';
import { Subject, takeUntil } from 'rxjs';
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

interface BillItem {
  bill_item_id: number;
  bill_id: number;
  description: string;
  amount: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  bill: any;
}

@Component({
  selector: 'app-bill-iterm-details',
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
    MatMenuModule,
    VDividerComponent,
    EmrSegmentedModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
  ],
  templateUrl: './bill-iterm-details.component.html',
  styleUrls: ['./bill-iterm-details.component.scss'],
  providers: [DatePipe],
})
export class BillItermDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  public loading = false;
  public bill_id: string | null = null;

  displayedColumns: string[] = [
    'bill_item_id',
    'description',
    'amount',
    'actions',
  ];
  dataSource: MatTableDataSource<BillItem> = new MatTableDataSource<BillItem>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    private billService: BillItermService,
    private router: Router,
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.bill_id = this.route.snapshot.paramMap.get('id');
    if (this.bill_id) {
      this.getBillItemsByBillId(this.bill_id);
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  applyFilter(event: KeyboardEvent) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private getBillItemsByBillId(billId: string) {
    this.loading = true;
    this.billService.getbillItermByBillId(billId).pipe(takeUntil(this.onDestroy)).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.data) {
          this.dataSource.data = response.data;
        } else {
          // console.log('No data found');
          this.dataSource.data = [];
        }
      },
      error: () => {
        this.loading = false;
        this.uiFeedback.fire('Error', 'Failed to fetch bill items', 'error');
      },
    });
  }

  backToBills() {
    this.router.navigate(['/pages/config/referrals/more-bill-file']);
  }

  addBillIterm(billId: number) {
    const dialogRef = this.dialog.open(BillItermFormComponent, {
      width: '600px',
      data: { billId },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result) {
        const payload = {
          bill_id: billId,
          description: result.description,
          amount: result.amount,
        };

        this.createBillItem(payload);
      }
    });
  }

  private createBillItem(payload: {
    bill_id: number;
    description: string;
    amount: number;
  }) {
    this.billService.addbillIterms(payload).pipe(takeUntil(this.onDestroy)).subscribe({
      next: (response) => {
        this.uiFeedback.fire('Success', 'Bill item added successfully', 'success');
        if (payload.bill_id) {
          this.getBillItemsByBillId(payload.bill_id.toString());
        }
      },
      error: (error) => {
        let errorMessage = 'Failed to add bill item. Please try again.';

        if (error.status === 422 && error.error?.message) {
          errorMessage = error.error.message;
        }

        this.uiFeedback.fire('Error', errorMessage, 'error');
      },
    });
  }

  displayMoreData(data: any) {
    const id = data.bill_item_id;
    this.router.navigate(['/pages/config/referrals/bill-iterm-by-id', id]);
  }
}
