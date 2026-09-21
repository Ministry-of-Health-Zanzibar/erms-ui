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
import { ReferalTypeService } from '../../../../services/system-configuration/referal-type.service';
import { AddReferralTypeComponent } from '../add-referral-type/add-referral-type.component';
import { EmptyStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';
@Component({
  selector: 'app-view-referal-type',
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
  templateUrl: './view-referal-type.component.html',
  styleUrl: './view-referal-type.component.scss'
})
export class ViewReferalTypeComponent implements OnInit,OnDestroy {

  private readonly onDestroy = new Subject<void>()
  
    displayedColumns: string[] = ['id', 'name','code','action'];
    dataSource: MatTableDataSource<any> = new MatTableDataSource();
  
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
  
  
    constructor(public permission: PermissionService,
      public referalTypeService:ReferalTypeService,
      private route:Router,
      private dialog: MatDialog
      ){}
  
    ngOnInit(): void {
      this.getReferalType();
    }
    ngOnDestroy(): void {
      this.onDestroy.next()
      this.onDestroy.complete()
    }
    renew(){
      this.getReferalType();
    }
  
    getReferalType() {
      this.referalTypeService.getAllReferalType().pipe(takeUntil(this.onDestroy)).subscribe((response: any)=>{
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
  
    addReferralType() {
      let config = new MatDialogConfig()
      config.disableClose = false
      config.role = 'dialog'
      config.maxWidth ='100vw'
      config.maxHeight = '100vh'
      config.width = '850px'
      config.panelClass = 'full-screen-modal'
  
      const dialogRef = this.dialog.open(AddReferralTypeComponent,config);
  
      dialogRef.afterClosed().subscribe(result => {
        this.getReferalType();
      });
    }
   
      
     addReferalType() {
        let config = new MatDialogConfig()
        config.disableClose = false
        config.role = 'dialog'
        config.maxWidth ='100vw'
        config.maxHeight = '100vh'
        config.width = '850px'
        config.panelClass = 'full-screen-modal'
        const dialogRef = this.dialog.open(AddReferralTypeComponent,config);
        dialogRef.afterClosed().subscribe(result => {
          this.getReferalType();
        });
      }

    
      updateReferralType(data: any) {
        let config = new MatDialogConfig()
        config.disableClose = false
        config.role = 'dialog'
        config.maxWidth ='100vw'
        config.maxHeight = '100vh'
        config.width = '850px'
        config.panelClass = 'full-screen-modal'
        config.data = {data: data}
    
        const dialogRef = this.dialog.open(AddReferralTypeComponent,config);
    
        dialogRef.afterClosed().subscribe(result => {
          this.getReferalType();
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
          html: message + ' <b> ' + data.referral_type_name + ' </b> ',
          icon: "warning",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Confirm",
          cancelButtonColor: "#D5D8DC",
          cancelButtonText: "Cancel",
          showCancelButton: true
        }).then((result) => {
          if (result.isConfirmed) {
            this.blockReferalTypes(data, data.deleted_at);
          }
          else{
            this.getReferalType();
          }
        });
      }
    
      blockReferalTypes(data: any, deleted: any): void{
         if(deleted){
          this.referalTypeService.unBlockReferralTypes(data, data?.referral_type_id).subscribe(response=>{
            if(response.statusCode==200){
               Swal.fire({
                 title: "Success",
                 text: response.message,
                 icon: "success",
                 confirmButtonColor: "#4690eb",
                 confirmButtonText: "Continue"
               });
               this.getReferalType();
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
           this.referalTypeService.deleteReferalType(data?.referral_type_id).subscribe(response=>{
             if(response.statusCode == 200){
               Swal.fire({
                 title: "Success",
                 text: response.message,
                 icon: "success",
                 confirmButtonColor: "#4690eb",
                 confirmButtonText: "Continue"
               });
               this.getReferalType()
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
     
  
   
    
  

