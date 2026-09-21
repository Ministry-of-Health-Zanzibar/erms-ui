import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatAnchor,
  MatButton,
  MatIconButton,
  MatMiniFabButton,
} from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import Swal from 'sweetalert2';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { BillFileService } from '../../../../services/Bills/bill-file.service';
import { MatSort } from '@angular/material/sort';
import { AddEmployerTypeComponent } from '../../../system-config/employer-type/add-employer-type/add-employer-type.component';
import { BillFileFormComponent } from '../bill-file-form/bill-file-form.component';
import { Router } from '@angular/router';
import { HospitalService } from '../../../../services/system-configuration/hospital.service';
import { environment } from '../../../../../environments/environment.prod';
import { AddbillComponent } from '../../../system-config/bill/addbill/addbill.component';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  TableToolbarComponent,
} from '@shared/ui';

// import { AddBillFileComponent } from '../add-bill-file/add-bill-file.component';

@Component({
  selector: 'app-bill-file-list',
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
    EmrSegmentedModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
  ],
  templateUrl: './bill-file-list.component.html',
  styleUrls: ['./bill-file-list.component.scss'],
})
export class BillFileListComponent {
   public documentUrl = environment.fileUrl;

  private readonly onDestroy = new Subject<void>();
  loading: boolean = false;

  displayedColumns: string[] = [
    'id',
    'hospital_name',
    'amount',
    'action',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    public permission: PermissionService,
    private billService: BillFileService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBills();
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  loadBills() {
    this.loading = true;
    this.billService
      .viewMonthBills()
      .pipe(takeUntil(this.onDestroy))
      .subscribe(
        (response: any) => {
          this.loading = false;
          if (response.data) {
            this.dataSource = new MatTableDataSource(response.data);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          }
        },
        (error) => {
          this.loading = false;
          console.error('Failed to load bill files', error);
        }
      );
  }

  // Filter table
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


 viewPDF(element: any) {
  if (element?.bill_file) {
    const url = this.documentUrl + element.bill_file; 
    window.open(url, '_blank');
  }
}

  addBill() {
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.height = '700px';
    config.width = '890px';
    config.panelClass = 'full-screen-modal';
    const dialogRef = this.dialog.open(BillFileFormComponent, config);
    dialogRef.afterClosed().subscribe((result) => {
      this.loadBills();
    });
  }

  // Delete confirmation
  confirmDelete(element: any) {
    Swal.fire({
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

  // Delete bill
  deleteBill(id: number) {
    this.billService.deletebillFiles(id).subscribe((res) => {
      if (res.statusCode === 200) {
        Swal.fire('Deleted!', res.message, 'success');
        this.loadBills();
      } else {
        Swal.fire('Error', res.message, 'error');
      }
    });
  }

  displayMoreData(data: any) {
    const id = data.hospital_id;
    console.log("tunaipata id hapa",id)
    this.router.navigate(['/pages/config/referrals/viewbillbyhospital', id]);
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
      dialogRef.afterClosed().subscribe((result: any) => {
        this.loadBills();
      });
    }
  


}
