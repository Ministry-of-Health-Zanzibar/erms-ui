import { MonthBillService } from '../../../services/Referral/month-bill.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { Router } from 'express';
import { Subject, takeUntil } from 'rxjs';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMiniFabButton, MatIconButton, MatAnchor, MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PermissionService } from '../../../services/authentication/permission.service';
import { ReferralService } from '../../../services/Referral/referral.service';
import { AddReferralsComponent } from '../add-referrals/add-referrals.component';
import { AddMonthbillComponent } from '../add-monthbill/add-monthbill.component';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  TableToolbarComponent,
} from '@shared/ui';

@Component({
  selector: 'app-month-bill',
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
        TableToolbarComponent
  ],
  templateUrl: './month-bill.component.html',
  styleUrl: './month-bill.component.scss'
})
export class MonthBillComponent implements OnInit,OnDestroy{


   private readonly onDestroy = new Subject<void>()
   loading: boolean = false;


      displayedColumns: string[] =
      ['id', 'hospital_name','total_monthly_bill','total_after_audit_monthly_bill','action'];
      dataSource: MatTableDataSource<any> = new MatTableDataSource();

      @ViewChild(MatPaginator) paginator!: MatPaginator;
      @ViewChild(MatSort) sort!: MatSort;
  referralsLetter: any;


      constructor(public permission: PermissionService,
        public monthService:MonthBillService,
        private router:Router,
        private dialog: MatDialog
        ){}

      ngOnInit(): void {
        this.getMonthBill();
      }
      ngOnDestroy(): void {
        this.onDestroy.next()
        this.onDestroy.complete()
      }
      renew(){
        this.getMonthBill();
      }

       getMonthBill() {
    this.loading = true;
    this.monthService.getAllMonthBill().pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
      this.loading = false;
      if (response.data) {
        this.dataSource = new MatTableDataSource(response.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      } else {
        // console.log('permission response errors');
      }
    }, (error) => {
      this.loading = false;
      // console.log('permission getAway api fail to load');
    });
  }


      applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      }
 addMonth() {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.height = '600px'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'

    const dialogRef = this.dialog.open(AddMonthbillComponent, config);
    dialogRef.afterClosed().subscribe(result => {
      this.getMonthBill();
    });
  }

  updateMonthBill(data: any) {
      let config = new MatDialogConfig()
      config.disableClose = false
      config.role = 'dialog'
      config.maxWidth ='100vw'
      config.maxHeight = '100vh'
      config.height = '600px'
      config.width = '850px'
      config.panelClass = 'full-screen-modal'
      config.data = {data: data}

      const dialogRef = this.dialog.open(AddMonthbillComponent, config);
      dialogRef.afterClosed().subscribe(result => {
        this.getMonthBill();
      });
    }

     displayMoreData(data: any) {
   // alert(data.complain_id);
   const id = data.hospital_id;
    this.router.navigate(['/pages/config/referrals/monthbill', id]); // Navigate to the new page with complain_id
  }


      }
