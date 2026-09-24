import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAnchor, MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { EmrSegmentedModule, VDividerComponent } from '@elementar/components';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PermissionService } from '../../../services/authentication/permission.service';
import { PartientService } from '../../../services/partient/partient.service';
import { Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { InsuranceComponent } from '../insurance/insurance.component';
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-viewinsurances',
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
    EmrSegmentedModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent
  ],
  templateUrl: './viewinsurances.component.html',
  styleUrl: './viewinsurances.component.scss'
})
export class ViewinsurancesComponent {

    private readonly onDestroy = new Subject<void>()
    private readonly searchChanged$ = new Subject<string>();
    loading: boolean = false;
    errorMessage = '';
    searchTerm = '';
    totalItems = 0;
    pageSize = 25;
    currentPage = 1;


    constructor(
      public permission: PermissionService,
      private userService: PartientService,
      private dialog: MatDialog,
      private router:Router,

    ){}

    displayedColumns: string[] = ['id','name','phone','location','position','job','action','action2'];
    dataSource: MatTableDataSource<any> = new MatTableDataSource();

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;


    ngOnInit(): void {
      this.searchChanged$
        .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.onDestroy))
        .subscribe(() => {
          this.currentPage = 1;
          this.userPetient();
        });
      this.userPetient();
    }
    ngOnDestroy(): void {
      this.onDestroy.next()
      this.onDestroy.complete()
    }
    renew(){
      this.userPetient();
    }

    userPetient() {
      this.loading = true;
      this.errorMessage = '';
      this.userService.getAllPatients({
        page: this.currentPage,
        per_page: this.pageSize,
        search: this.searchTerm,
      }).pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
        this.loading = false;
        if (response.data) {
          this.dataSource = new MatTableDataSource(response.data);
          this.totalItems = response?.meta?.total ?? response.data.length;
        } else {
          // console.log('permission response errors');
        }
      }, (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Unable to load patient records. Please try again.';
      });
    }

    applyFilter(event: Event) {
      this.searchTerm = (event.target as HTMLInputElement).value.trim();
      this.searchChanged$.next(this.searchTerm);
    }

    pageChanged(event: PageEvent): void {
      this.currentPage = event.pageIndex + 1;
      this.pageSize = event.pageSize;
      this.userPetient();
    }

    getInsurance(id:any){
      let config = new MatDialogConfig()
      config.disableClose = false
      config.role = 'dialog'
      config.maxWidth ='100vw'
      config.maxHeight = '100vh'
      config.width = '850px'
      config.panelClass = 'full-screen-modal'
      config.data = {id: id}

      const dialogRef = this.dialog.open(InsuranceComponent,config);

      dialogRef.afterClosed().subscribe(result => {
        this.userPetient();
      });
    }

    displayMoreData(data: any) {

      const id = data.patient_id;
      this.router.navigate(['/pages/patient/more', id]); // Navigate to the new page with complain_id
    }
  }
