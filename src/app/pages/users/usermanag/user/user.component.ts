import { CommonModule } from '@angular/common';
import { inject, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAnchor, MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { FeedbackService } from '@shared/services/feedback.service';
import { AddUserComponent } from '../add-user/add-user.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { UserService } from '../../../../services/users/user.service';
import { MatSort } from '@angular/material/sort';
import { PartientFormComponent } from '../../../partient/partient-form/partient-form.component';
import { AssignUserHospitalComponent } from '../../assign-user-hospital/assign-user-hospital.component';
import { MatCard } from "@angular/material/card";
import { MatFormField } from "@angular/material/form-field";
import { EmptyStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-user',
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
    MatCard,
    MatFormField,
    EmptyStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent
],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()
  private readonly searchChanged = new Subject<string>();
  loading = false;
  errorMessage = '';
  totalItems = 0;
  pageSize = 25;
  currentPage = 1;
  searchTerm = '';

  constructor(
    public permission: PermissionService,
    private userService: UserService,
    private dialog: MatDialog
  ){}

  displayedColumns: string[] = ['id','name','gender','address','phone','email', 'hospital', 'account_status', 'action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  ngOnInit(): void {
    this.searchChanged
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.onDestroy))
      .subscribe(() => {
        this.currentPage = 1;
        this.userDataTable();
      });
    this.userDataTable();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.currentPage = 1;
    this.userDataTable();
  }

  userDataTable() {
    this.loading = true;
    this.errorMessage = '';
    this.userService.getAllUsers({
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
    }).pipe(takeUntil(this.onDestroy)).subscribe((response: any)=>{
      this.loading = false;
      if(response.data){
        this.dataSource = new MatTableDataSource(response.data);
        this.dataSource.sort = this.sort;
        this.totalItems = response.meta?.total ?? response.data.length;
      }
      else{
        // console.log('permission response errors')
      }
    },(error)=>{
      this.loading = false;
      this.errorMessage = error?.error?.message || 'Unable to load users. Please try again.';
    })
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.searchChanged.next(this.searchTerm);
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.userDataTable();
  }

  addUser() {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.height = '600px'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'

    const dialogRef = this.dialog.open(AddUserComponent, config);
    dialogRef.afterClosed().subscribe(result => {
      this.userDataTable();
    });
  }

  updateUser(data: any) {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.height = '600px'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'
    config.data = {data:data}

    const dialogRef = this.dialog.open(AddUserComponent, config);
    dialogRef.afterClosed().subscribe(result => {
      this.userDataTable();
    });
  }

  confirmBlock(data: any, currentlyBlocked: boolean): void {
    this.uiFeedback.confirm(
      currentlyBlocked ? 'Unblock this user?' : 'Block this user?',
      currentlyBlocked
        ? `${data.first_name} ${data.last_name} will be allowed to authenticate again.`
        : `${data.first_name} ${data.last_name} will be signed out and denied access immediately.`,
      {
        confirmButtonText: currentlyBlocked ? 'Unblock user' : 'Block user',
        confirmButtonColor: currentlyBlocked ? '#2563eb' : '#b91c1c',
      },
    ).then((result) => {
      if (result.isConfirmed) {
        this.blockUser(data.id, currentlyBlocked);
      }
    });
  }

  blockUser(data: any, deleted: any): void{
    const request$ = deleted
      ? this.userService.activateUser(data)
      : this.userService.blockUser(data);

    request$.subscribe({
      next: (response: any) => {
        if(response.statusCode == 200 || response.statusCode == 201){
          this.uiFeedback.success('Success', response.message);
          this.userDataTable();
          return;
        }

        this.uiFeedback.error('Action failed', response.message || 'The account status could not be changed.');
      },
      error: (error: any) => {
        this.uiFeedback.error(
          'Action failed',
          error?.error?.message || 'The account status could not be changed.',
        );
      },
    });
  }

   resetUserPassword(userId: number) {

    this.uiFeedback.fire({
      title: 'Reset Password?',
      text: 'A new password will be generated and sent to user email.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb'
    }).then(result => {

      if (result.isConfirmed) {
        this.userService.resetPassword(userId).subscribe({
          next: (response) => {
            if (response.statusCode === 201) {
              this.uiFeedback.fire(
                'Success',
                response.message,
                'success'
              );
            }
          },
          error: (error) => {
            this.uiFeedback.fire(
              'Error',
              error.error?.message || 'Something went wrong',
              'error'
            );
          }
        });
      }

    });
  }


addPatient(userId: number) {
  const config = new MatDialogConfig();
  config.disableClose = false;
  config.role = 'dialog';
   config.width = '50vw';  
  config.maxWidth = '100vw';
  config.maxHeight = '98vh';
  config.panelClass = 'full-screen-modal';
  config.data = { userId: userId }; 

  const dialogRef = this.dialog.open(AssignUserHospitalComponent, config);
  dialogRef.afterClosed().subscribe(() => {
    this.userDataTable();
  });
}



}
