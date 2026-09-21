import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { Router } from 'express';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../../services/authentication/permission.service';

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
import Swal from 'sweetalert2';
import { DocumentTypeService } from '../../../../services/accountants/document-type.service';
import { AdddocumentTypeComponent } from '../adddocument-type/adddocument-type.component';
import { EmptyStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-document-type',
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
  templateUrl: './document-type.component.html',
  styleUrl: './document-type.component.scss'
})
export class DocumentTypeComponent implements OnInit,OnDestroy{
  private readonly onDestroy = new Subject<void>()

  displayedColumns: string[] = ['id','name','code','action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(public permission: PermissionService,
    public documentServices: DocumentTypeService,
    private route:Router,
    private dialog: MatDialog
    ){}

  ngOnInit(): void {
    this.getDocumentType();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.getDocumentType();
  }

  getDocumentType() {
    this.documentServices.getAllDocumentType().pipe(takeUntil(this.onDestroy)).subscribe((response: any)=>{
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

  addDocumentType() {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'

    const dialogRef = this.dialog.open(AdddocumentTypeComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getDocumentType();
    });
  }

  updateDocumentType(data: any) {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'
    config.data = {data: data}

    const dialogRef = this.dialog.open(AdddocumentTypeComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getDocumentType();
    });
  }



  confirmBlock(data:any){
    var message;
    if(data.deleted_at){
      message = 'Are you sure you want to unblock'
    }
    else{
      message = 'Are you sure you want to block'
    }
    Swal.fire({
      title: "Confirm",
      html: message + ' <b> ' + data.document_type_name + ' </b> ',
      icon: "warning",
      confirmButtonColor: "#4690eb",
      confirmButtonText: "Confirm",
      cancelButtonColor: "#D5D8DC",
      cancelButtonText: "Cancel",
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.blockDocumentType(data, data.deleted_at);
      }
      else{
        this.getDocumentType();
      }
    });
  }

  blockDocumentType(data: any, deleted: any): void{
    if(deleted){
      this.documentServices.unblockDocumentType(data, data?.document_type_id).subscribe(response=>{
        if(response.statusCode == 200){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDocumentType();
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
      this.documentServices.deleteDocumentType(data?.document_type_id).subscribe(response=>{
        if(response.statusCode == 200){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDocumentType()
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
