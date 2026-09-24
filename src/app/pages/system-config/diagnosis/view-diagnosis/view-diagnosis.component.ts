import { CommonModule } from '@angular/common';
import { inject, Component, ViewChild } from '@angular/core';
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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { DiagnosisService } from '../../../../services/system-configuration/diagnosis.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddDiagnosisComponent } from '../add-diagnosis/add-diagnosis.component';
import { UploadDiagnosisComponent } from '../upload-diagnosis/upload-diagnosis.component';
import { FeedbackService } from '@shared/services/feedback.service';
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
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()
  private readonly searchChanged = new Subject<string>();
  loading = false;
  errorMessage = '';
  totalItems = 0;
  pageSize = 25;
  currentPage = 1;
  searchTerm = '';

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
    this.searchChanged
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.onDestroy))
      .subscribe(() => {
        this.currentPage = 1;
        this.getDiagnosis();
      });
    this.getDiagnosis();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.currentPage = 1;
    this.getDiagnosis();
  }

  getDiagnosis() {
    this.loading = true;
    this.errorMessage = '';
    this.diagnosisService
      .getDiagnosises({
        page: this.currentPage,
        per_page: this.pageSize,
        search: this.searchTerm,
      })
      .pipe(takeUntil(this.onDestroy))
      .subscribe(
        (response: any) => {
          this.loading = false;

          if(response.statusCode === 200){
            const extractedData = response.data?.data || response.data || (Array.isArray(response) ? response : []);
            
            this.dataSource = new MatTableDataSource(extractedData);
            this.dataSource.sort = this.sort;
            this.totalItems = response.meta?.total ?? response.data?.total ?? extractedData.length;
          }

          if(response.statusCode === 401){
            this.route.navigateByUrl('/');
          }
        },
        error => {
          this.loading = false;
          console.error(error);
          this.errorMessage = error?.error?.message || 'Unable to load diagnoses. Please try again.';
        }
      );
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.searchChanged.next(this.searchTerm);
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getDiagnosis();
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
    this.uiFeedback.fire({
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
          this.uiFeedback.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDiagnosis();
        }else{
          this.uiFeedback.fire({
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
          this.uiFeedback.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getDiagnosis()
        }else{
          this.uiFeedback.fire({
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
