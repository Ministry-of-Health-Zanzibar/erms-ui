import { AdddocumentsComponent } from './../adddocuments/adddocuments.component';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAnchor, MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
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
import { Router } from '@angular/router';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { DocumentsService } from '../../../../services/accountants/documents.service';
import { MatSort } from '@angular/material/sort';
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-documents',
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
    TableToolbarComponent
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent implements OnInit,OnDestroy{

private readonly onDestroy = new Subject<void>()
 loading: boolean = false;


  constructor(
    public permission: PermissionService,
    private docuService: DocumentsService,
    private dialog: MatDialog,
    private router:Router,

  ){}

  displayedColumns: string[] = ['id','name','amount','tin_number','types','category','action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  ngOnInit(): void {
    this.getDocument();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.getDocument();
  }

  getDocument() {
    this.loading = true;
    this.docuService.getAllDocument().pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
      this.loading = false;
      if (response.data) {
       // console.log("hapaaa", response.data);
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

  addDocument() {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.height = '600px'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'

    const dialogRef = this.dialog.open(AdddocumentsComponent, config);
    dialogRef.afterClosed().subscribe(result => {
      this.getDocument();
    });
  }

  updateDocument(data: any) {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.height = '600px'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'
    config.data = {data: data}

    const dialogRef = this.dialog.open(AdddocumentsComponent, config);
    dialogRef.afterClosed().subscribe(result => {
      this.getDocument();
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
      html: message + ' <b> ' + data.payee_name + ' </b> ',
      icon: "warning",
      confirmButtonColor: "#4690eb",
      confirmButtonText: "Confirm",
      cancelButtonColor: "#D5D8DC",
      cancelButtonText: "Cancel",
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.blockDocument(data, data.deleted_at);
      }
      else{
        this.getDocument();
      }
    });
  }

  blockDocument(data: any, deleted: any): void{
    if(deleted){
      this.docuService.unblockDocument(data, data?.document_form_id).subscribe(response=>{
        if(response.statusCode == 200){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDocument();
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
      this.docuService.deleteDocument(data?.document_form_id).subscribe(response=>{
        if(response.statusCode == 200){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDocument()
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

  // getInsurance(id:any){
  //   // console.log("hiiii",id);
  //   let config = new MatDialogConfig()
  //   config.disableClose = false
  //   config.role = 'dialog'
  //   config.maxWidth ='100vw'
  //   config.maxHeight = '100vh'
  //   config.width = '850px'
  //   config.panelClass = 'full-screen-modal'
  //   config.data = {id: id}

  //   const dialogRef = this.dialog.open(InsuranceComponent,config);

  //   dialogRef.afterClosed().subscribe(result => {
  //     this.userPetient();
  //   });
  // }

  displayMoreData(data: any) {

    const id = data.document_form_id;
     this.router.navigate(['/pages/accounts/more', id]); // Navigate to the new page with complain_id
   }


  }
