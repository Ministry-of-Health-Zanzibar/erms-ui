import { inject, Component, ViewChild } from '@angular/core';
import { environment } from '../../../../environments/environment.prod';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PartientService } from '../../../services/partient/partient.service';
import { PermissionService } from '../../../services/authentication/permission.service';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { EmrSegmentedModule } from '@elementar/components';
import { FeedbackService } from '@shared/services/feedback.service';
import { PatienthistoryService } from '../../../services/partient/patienthistory.service';
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, StatusBadgeComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-viewpatientfromhospital',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
    EmrSegmentedModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TableToolbarComponent,
  ],
  templateUrl: './viewpatientfromhospital.component.html',
  styleUrl: './viewpatientfromhospital.component.scss',
})
export class ViewpatientfromhospitalComponent {
  private readonly uiFeedback = inject(FeedbackService);
  public documentUrl = environment.fileUrl;
  private readonly onDestroy = new Subject<void>();
  loading: boolean = false;
  errorMessage = '';
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  private readonly searchChanged = new Subject<string>();

  displayedColumns: string[] = [
    'id',
    'name',
    'matibabu_card',
    'phone',
    'hospital',
    'case_type',
    'status',
    'action',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public permission: PermissionService,
    private userService: PartientService,
    private patientHistory: PatienthistoryService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.searchChanged
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.onDestroy))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadPatients();
      });
    this.loadPatients();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  renew() {
    this.currentPage = 1;
    this.loadPatients();
  }

  loadPatients() {
    this.loading = true;
    this.errorMessage = '';
    this.patientHistory.getAllBodyList({
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
    })
      .pipe(takeUntil(this.onDestroy))
      .subscribe(
        (response: any) => {
          this.loading = false;
          if (response.data) {
            this.dataSource = new MatTableDataSource(response.data);
            this.dataSource.sort = this.sort;
            this.totalItems = response.meta?.total ?? response.data.length;
          } else {

          }
        },
        (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.message || 'Unable to load hospital patients. Please try again.';
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
    this.loadPatients();
  }

  viewPDF(file: any) {
    if (file?.file_path) {
      const url = this.documentUrl + file.file_path;
      window.open(url, '_blank');
    }
  }

  confirmBlock(data: any) {
    const message = data.deleted_at
      ? 'Are you sure you want to unblock'
      : 'Are you sure you want to block';
    this.uiFeedback.fire({
      title: 'Confirm',
      html: `${message} <b>${data.name}</b>?`,
      icon: 'warning',
      confirmButtonColor: '#4690eb',
      confirmButtonText: 'Confirm',
      cancelButtonColor: '#D5D8DC',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.blockPatient(data, data.deleted_at);
      }
    });
  }

  blockPatient(data: any, deleted: any) {
    if (deleted) {
      this.userService.unblockPatients(data, data?.patient_id).subscribe(
        (res: any) => {
          this.uiFeedback.fire('Success', res.message, 'success');
          this.loadPatients();
        },
        (err) => {
          this.uiFeedback.fire('Error', 'Failed to unblock patient', 'error');
        },
      );
    } else {
      this.userService.deletePatients(data?.patient_id).subscribe(
        (res: any) => {
          this.uiFeedback.fire('Success', res.message, 'success');
          this.loadPatients();
        },
        (err) => {
          this.uiFeedback.fire('Error', 'Failed to delete patient', 'error');
        },
      );
    }
  }
  
  displayMoreData(data: any) {
    const id = data?.latest_history?.patient_histories_id;

    if (!id) {
      this.uiFeedback.fire('Error', 'No history ID available.', 'error');
      return;
    }

    this.router.navigate(['/pages/patient/patientfromhospital', id]);
  }
}
