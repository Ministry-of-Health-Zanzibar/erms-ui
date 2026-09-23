import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { Router } from 'express';
import { Subject, takeUntil } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatMiniFabButton,
  MatIconButton,
  MatAnchor,
  MatButton,
} from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink } from '@angular/router';
import { PermissionService } from '../../../services/authentication/permission.service';
import { ReferralService } from '../../../services/Referral/referral.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BillComponent } from '../bill/bill.component';
import { ReferralpaymentComponent } from '../referralpayment/referralpayment.component';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  StatusBadgeComponent,
  TableToolbarComponent,
} from '@shared/ui';

@Component({
  selector: 'app-referralwithbills',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatDivider,
    MatIcon,
    MatMiniFabButton,
    MatIconButton,
    VDividerComponent,
    MatTooltip,
    MatSlideToggleModule,
    FormsModule,
    MatAnchor,
    MatButton,
    RouterLink,
    EmrSegmentedModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TableToolbarComponent,
  ],
  templateUrl: './referralwithbills.component.html',
  styleUrl: './referralwithbills.component.scss',
})
export class ReferralwithbillsComponent implements OnInit, OnDestroy {
  private readonly onDestroy = new Subject<void>();
  loading: boolean = false;

  displayedColumns: string[] = [
    'id',
    'patient_name',
    'referral_type_name',
    'hospital_name',
    'referral_reason_name',
    'start_date',
    'end_date',
    'status',
    'action',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public permission: PermissionService,
    public referralService: ReferralService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getReferrals();
  }
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
  renew() {
    this.getReferrals();
  }

  getReferrals() {
    this.loading = true;
    this.referralService
      .getReferralwithBills()
      .pipe(takeUntil(this.onDestroy))
      .subscribe(
        (response: any) => {
          this.loading = false;
          if (response.statusCode === 200) {
            const filtered = response.data.filter(
              (item: { status: string; bill_status: string }) =>
                item.status === 'Confirmed' &&
                (item.bill_status === null || item.bill_status === 'Pending')
            );
            this.dataSource = new MatTableDataSource(filtered);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          } else if (response.statusCode === 401) {
            this.router.navigateByUrl('/');
          }
        },
        (error) => {
          this.loading = false;
          this.router.navigateByUrl('/');
        }
      );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getBills(id: any) {
    //  console.log("hiiii",id);
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { id: id };

    const dialogRef = this.dialog.open(BillComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      this.getReferrals();
    });
  }

  getPayment(id: any) {
    // console.log('hiiii bill', id);
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { id: id };

    const dialogRef = this.dialog.open(ReferralpaymentComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      this.getReferrals();
    });
  }

  displayMoreData(data: any) {
    const id = data.referral_id;
    this.router.navigate(['/pages/config/payment-details/more', id]);
  }

  // USER ROLES
  public getUserRole(): any {
    return localStorage.getItem('roles');
  }

  public get isStaff(): boolean {
    return this.getUserRole() === 'ROLE STAFF';
  }
}
