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
import { FeedbackService } from '@shared/services/feedback.service';
import { PartientFormComponent } from '../partient-form/partient-form.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { EmrSegmentedModule } from '@elementar/components';
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-patiant',
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
    MatSlideToggle,
    EmrSegmentedModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
  ],
  templateUrl: './patiant.component.html',
  styleUrls: ['./patiant.component.scss'],
})
export class PatiantComponent {
  private readonly uiFeedback = inject(FeedbackService);
  public documentUrl = environment.fileUrl;
  private readonly onDestroy = new Subject<void>();
  loading: boolean = false;
  errorMessage = '';

  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  private readonly searchChanged$ = new Subject<string>();

  displayedColumns: string[] = [
    'id',
    'name',
    'matibabu_card',
    'zan_id',
    'date_of_birth',
    'gender',
    'phone',
    'action',
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public permission: PermissionService,
    private userService: PartientService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.searchChanged$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.onDestroy))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadPartients();
      });
    this.loadPartients();
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  renew() {
    this.loadPartients();
  }

  loadPartients() {
    this.loading = true;
    this.errorMessage = '';
  
    this.userService
      .getPartients({
        page: this.currentPage,
        per_page: this.pageSize,
        search: this.searchTerm,
      })
      .pipe(takeUntil(this.onDestroy))
      .subscribe({
        next: (response: any) => {
          this.loading = false;
  
          if (response && response.data) {
            this.dataSource = new MatTableDataSource(response.data);
  
            this.totalItems = response?.meta?.total ?? response.data.length;
          }
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Unable to load patient records. Please try again.';
        }
      });
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.searchChanged$.next(this.searchTerm);
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPartients();
  }

  viewPDF(file: any) {
    if (file?.file_path) {
      const url = this.documentUrl + file.file_path;
      window.open(url, '_blank');
    }
  }

  addPatient() {
    const config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.width = '80vw'; // full viewport width
    config.height = '80vh'; // full viewport height
    config.maxWidth = '80vw'; // override default 80%

    config.maxHeight = '98vh';
    // config.width = '950px';
    config.panelClass = ['full-screen-modal', 'patient-form-dialog'];

    const dialogRef = this.dialog.open(PartientFormComponent, config);
    dialogRef.afterClosed().subscribe(() => {
      this.loadPartients();
    });
  }

  updatePatient(patientData: any) {
    const config = new MatDialogConfig();
    config.disableClose = false;
    config.role = 'dialog';
    config.width = '80vw'; // full viewport width
    config.height = '80vh'; // full viewport height
    config.maxWidth = '80vw'; // override default 80%

    config.panelClass = ['full-screen-modal', 'patient-form-dialog'];

    config.data = { patient: patientData };

    const dialogRef = this.dialog.open(PartientFormComponent, config);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPartients();
      }
    });
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
          this.loadPartients();
        },
        (err) => {
          this.uiFeedback.fire('Error', 'Failed to unblock patient', 'error');
        },
      );
    } else {
      this.userService.deletePatients(data?.patient_id).subscribe(
        (res: any) => {
          this.uiFeedback.fire('Success', res.message, 'success');
          this.loadPartients();
        },
        (err) => {
          this.uiFeedback.fire('Error', 'Failed to delete patient', 'error');
        },
      );
    }
  }

  displayMoreData(data: any) {
    const id = data.patient_id;
    this.router.navigate(['/pages/patient/patient-table', id]);
  }
}
