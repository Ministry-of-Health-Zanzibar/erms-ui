import { CommonModule } from '@angular/common';
import { inject, Component, ViewChild } from '@angular/core';
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
import { FeedbackService } from '@shared/services/feedback.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../services/authentication/permission.service';
import { UserService } from '../../../services/users/user.service';
import { MatSort } from '@angular/material/sort';
import { PartientService } from '../../../services/partient/partient.service';
import { AddpartientComponent } from '../addpartient/addpartient.component';
import { InsuranceComponent } from '../insurance/insurance.component';
import { DisplaymoredataComponent } from '../displaymoredata/displaymoredata.component';
import { Router } from '@angular/router';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  TableToolbarComponent,
} from '@shared/ui';

@Component({
  selector: 'app-viewpartient',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIcon,
    VDividerComponent,
    MatTooltip,
    MatSlideToggleModule,
    FormsModule,
    MatButton,
    EmrSegmentedModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
  ],
  templateUrl: './viewpartient.component.html',
  styleUrl: './viewpartient.component.scss',
})
export class ViewpartientComponent {
  private readonly uiFeedback = inject(FeedbackService);
  private readonly onDestroy = new Subject<void>();
  loading: boolean = false;

  constructor(
    public permission: PermissionService,
    private userService: PartientService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  displayedColumns: string[] = [
    'id',
    'name',
    'phone',
    'location',
    'position',
    'job',
    'action',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.userPetient();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
  renew() {
    this.userPetient();
  }

  userPetient() {
    this.loading = true;
    this.userService.getPatientList().pipe(takeUntil(this.onDestroy)).subscribe((response: any)=>{
      this.loading = false;
      if(response.data){
        console.log(response)
        this.dataSource = new MatTableDataSource(response.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
      else{
        console.log('permission response errors')
      }
    },(error)=>{
      this.loading = false;
      console.log('permision getAway api fail to load')
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addPatient() {
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.height = '600px';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';

    const dialogRef = this.dialog.open(AddpartientComponent, config);
    dialogRef.afterClosed().subscribe((result) => {
      this.userPetient();
    });
  }

  updatePatient(data: any) {
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.height = '600px';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { data: data };

    const dialogRef = this.dialog.open(AddpartientComponent, config);
    dialogRef.afterClosed().subscribe((result) => {
      this.userPetient();
    });
  }

  confirmBlock(data: any) {
    var message;
    if (data.deleted_at) {
      message = 'Are you sure you want to unblock';
    } else {
      message = 'Are you sure you want to block';
    }
    this.uiFeedback.fire({
      title: 'Confirm',
      html: message + ' <b> ' + data.name + ' </b> ',
      icon: 'warning',
      confirmButtonColor: '#4690eb',
      confirmButtonText: 'Confirm',
      cancelButtonColor: '#D5D8DC',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.blockPatient(data, data.deleted_at);
      } else {
        this.userPetient();
      }
    });
  }

  blockPatient(data: any, deleted: any): void {
    if (deleted) {
      this.userService
        .unblockPatient(data?.patient_id)
        .subscribe((response) => {
          if (response.statusCode == 200) {
            this.uiFeedback.fire({
              title: 'Success', 
              text: response.message,
              icon: 'success',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Continue',
            });
            this.userPetient();
          } else {
            this.uiFeedback.fire({
              title: 'Error',
              text: response.message,
              icon: 'error',
              confirmButtonColor: '#4690eb',
              confirmButtonText: 'Continue',
            });
          }
        });
    } else {
      this.userService.deletePatient(data?.patient_id).subscribe((response) => {
        if (response.statusCode == 200) {
          this.uiFeedback.fire({
            title: 'Success',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue',
          });
          this.userPetient();
        } else {
          this.uiFeedback.fire({
            title: 'Error',
            text: response.message,
            icon: 'error',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue',
          });
        }
      });
    }
  }

  getInsurance(id: any) {
    // console.log("hiiii",id);
    let config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.maxWidth = '100vw';
    config.maxHeight = '100vh';
    config.width = '850px';
    config.panelClass = 'full-screen-modal';
    config.data = { id: id };

    const dialogRef = this.dialog.open(InsuranceComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      this.userPetient();
    });
  }

  displayMoreData(data: any) {
    const id = data.patient_id;
    this.router.navigate(['/pages/patient/more', id]); // Navigate to the new page with complain_id
  }
}
