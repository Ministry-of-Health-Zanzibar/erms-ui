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
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { WorkStationService } from '../../../../services/work-station.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddWorkStationComponent } from '../add-work-station/add-work-station.component';
import { EmptyStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-work-station',
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
  templateUrl: './work-station.component.html',
  styleUrl: './work-station.component.scss'
})
export class WorkStationComponent {
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()

  displayedColumns: string[] = ['id','name','location','employer','action'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public permission: PermissionService,
    public workStationService: WorkStationService,
    private route:Router,
    private dialog: MatDialog
    ){}

  ngOnInit(): void {
    this.getWorkStation();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  renew(){
    this.getWorkStation();
  }

  getWorkStation() {
    this.workStationService.getAllWorkStation().pipe(takeUntil(this.onDestroy)).subscribe((response: any)=>{
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
    })
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addWorkStation() {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'
    config.data = {id: null}

    const dialogRef = this.dialog.open(AddWorkStationComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getWorkStation();
    });
  }

  updateWorkStation(id: any) {
    let config = new MatDialogConfig()
    config.disableClose = false
    config.role = 'dialog'
    config.maxWidth ='100vw'
    config.maxHeight = '100vh'
    config.width = '850px'
    config.panelClass = 'full-screen-modal'
    config.data = {id: id}

    const dialogRef = this.dialog.open(AddWorkStationComponent,config);

    dialogRef.afterClosed().subscribe(result => {
      this.getWorkStation();
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
      html: message + ' <b> ' + data.workstation_name + ' </b> ',
      icon: "warning",
      confirmButtonColor: "#4690eb",
      confirmButtonText: "Confirm",
      cancelButtonColor: "#D5D8DC",
      cancelButtonText: "Cancel",
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.blockWorkStation(data.workstation_id, data.deleted_at);
      }
      else{
        this.getWorkStation();
      }
    });
  }

  blockWorkStation(id: any, deleted: any): void{
    if(deleted){
      this.workStationService.unblockWorkStation(id).subscribe(response=>{
        if(response.statusCode == 201){
          this.uiFeedback.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getWorkStation();
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
      this.workStationService.deleteWorkStation(id).subscribe(response=>{
        if(response.statusCode == 201){
          this.uiFeedback.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
          this.getWorkStation()
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
