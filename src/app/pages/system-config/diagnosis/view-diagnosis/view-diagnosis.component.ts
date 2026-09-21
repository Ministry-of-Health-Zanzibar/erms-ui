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
import { UploadAreaComponent, VDividerComponent } from '@elementar/components';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { DiagnosisService } from '../../../../services/system-configuration/diagnosis.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddDiagnosisComponent } from '../add-diagnosis/add-diagnosis.component';
import { UploadDiagnosisComponent } from '../upload-diagnosis/upload-diagnosis.component';
import Swal from 'sweetalert2';
import { PageEvent } from '@angular/material/paginator';
import { EmptyStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-view-diagnosis',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconButton,
    MatTooltip,
    MatSlideToggleModule,
    FormsModule,
    EmptyStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
  ],
  templateUrl: './view-diagnosis.component.html',
  styleUrl: './view-diagnosis.component.scss'
})
export class ViewDiagnosisComponent {

  private readonly onDestroy = new Subject<void>()

  displayedColumns: string[] = ['id','code','name','action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public permission: PermissionService,
    public diagnosisService: DiagnosisService,
    private route:Router,
    private dialog: MatDialog
    ){}

  ngOnInit(): void {
    this.getDiagnosis();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.getDiagnosis();
  }

  getDiagnosis() {
    this.diagnosisService
      .getDiagnosises()
      .pipe(takeUntil(this.onDestroy))
      .subscribe(
        (response: any) => {
          console.log(response);

          if(response.statusCode === 200){
            // FIXED: Gracefully extracts the diagnosis list if response.data.data doesn't exist anymore
            const extractedData = response.data?.data || response.data || (Array.isArray(response) ? response : []);
            
            this.dataSource = new MatTableDataSource(extractedData);
            this.dataSource.sort = this.sort;
          }

          if(response.statusCode === 401){
            this.route.navigateByUrl('/');
          }
        },
        error => {
          console.error(error);
          this.route.navigateByUrl('/');
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

  addDiagnosis() {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'

    const dialogRef = this.dialog.open(AddDiagnosisComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getDiagnosis();
    });
  }

  downloadFile(filename: string): void {
    const link = document.createElement('a');
    link.href = `assets/file/${filename}`;
    link.download = filename;
    link.click();
  }

  uploadFile(): void {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'

    const dialogRef = this.dialog.open(UploadDiagnosisComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getDiagnosis();
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
      html: message + ' <b> ' + data.diagnosis_name + ' </b> ',
      icon: "warning",
      confirmButtonColor: "#4690eb",
      confirmButtonText: "Confirm",
      cancelButtonColor: "#D5D8DC",
      cancelButtonText: "Cancel",
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.blockDiagnosis(data.uuid, data.deleted_at);
      }
      else{
        this.getDiagnosis();
      }
    });
  }

  blockDiagnosis(id: any, deleted: any): void{
    if(deleted){
      this.diagnosisService.unblockDiagnosis(id).subscribe(response=>{
        if(response.statusCode == 200){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDiagnosis();
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
      this.diagnosisService.deleteDiagnosis(id).subscribe(response=>{
        if(response.statusCode == 200){
          Swal.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDiagnosis()
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
