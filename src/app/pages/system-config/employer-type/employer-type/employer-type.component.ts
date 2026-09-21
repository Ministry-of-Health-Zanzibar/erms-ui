import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAnchor, MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { EmployerTypeService } from '../../../../services/system-configuration/employer-type.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddEmployerTypeComponent } from '../add-employer-type/add-employer-type.component';
import { EmptyStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-employer-type',
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
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent
  ],
  templateUrl: './employer-type.component.html',
  styleUrl: './employer-type.component.scss'
})
export class EmployerTypeComponent {

  private readonly onDestroy = new Subject<void>()

  displayedColumns: string[] = ['id','name','action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public permission: PermissionService,
    public employerTypeService: EmployerTypeService,
    private route:Router,
    private dialog: MatDialog
    ){}

  ngOnInit(): void {
    this.getEmployerType();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.getEmployerType();
  }

  getEmployerType() {
    this.employerTypeService.getAllEmployerType().pipe(takeUntil(this.onDestroy)).subscribe((response: any)=>{
      if(response.statusCode==200){
        this.dataSource = new MatTableDataSource(response.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }if(response.statusCode==401){
        this.route.navigateByUrl("/")
        // console.log(response.message)
      }
    },(error)=>{
      this.route.navigateByUrl("/")
      // console.log('country getAway api fail to load')
    })
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addEmployerType() {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'

    const dialogRef = this.dialog.open(AddEmployerTypeComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getEmployerType();
    });
  }

  updateEmployerType(id: any) {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'
    config.data = {id: id}

    const dialogRef = this.dialog.open(AddEmployerTypeComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getEmployerType();
    });
  }

  comfirmBlock(data:any){
    var message;
    if(data.deleted_at){
      message = 'Are you sure you want to unblock'
    }
    else{
      message = 'Are you sure you want to block'
    }
    Swal.fire({
      title: "Confirm",
      html: message + ' <b> ' + data.employer_type_name + ' </b> ',
      icon: "warning",
      confirmButtonColor: "#4690eb",
      confirmButtonText: "Confirm",
      cancelButtonColor: "#D5D8DC",
      cancelButtonText: "Cancel",
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.blockEmployerType(data.employer_type_id, data.deleted_at);
      }
      else{
        this.getEmployerType();
      }
    });
  }

  blockEmployerType(id: any, deleted: any): void{
    if(deleted){
      this.employerTypeService.unblockEmployerType(id).subscribe(response=>{
        if(response.statusCode == 201){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getEmployerType();
        }else{
          Swal.fire({
            title: "Error",
            text: response.message,
            icon: "error",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
        }
      })
    }else{
      this.employerTypeService.deleteEmploerType(id).subscribe(response=>{
        if(response.statusCode == 200){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getEmployerType()
        }else{
          Swal.fire({
            title: "Error",
            text: response.message,
            icon: "error",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
        }
      });
    }
  }
}
