import { Component, DestroyRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BillItermService } from '../../../../services/Bills/bill-iterm.service';
import { BillItermFormComponent } from '../bill-iterm-form/bill-iterm-form.component';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { EmptyStateComponent, LoadingStateComponent } from '@shared/ui';

export interface BillItem {
  bill_id?: number;
  description: string;
  amount: number;
}

@Component({
  selector: 'app-bill-items-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    EmptyStateComponent,
    LoadingStateComponent
  ],
  templateUrl: './bill-items-list.component.html',
  styleUrls: ['./bill-items-list.component.scss']
})
export class BillItemsListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['bill_id', 'description', 'amount'];
  dataSource = new MatTableDataSource<BillItem>([]);
  loading = true;
  errorMessage = '';
  totalItems = 0;
  pageSize = 25;
  currentPage = 1;
  searchTerm = '';
  private readonly searchChanged = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private billService: BillItermService,
    private dialog: MatDialog,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.searchChanged.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadBillItems();
    });
    this.loadBillItems();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  loadBillItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.billService.getAllBillIterm({
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (data) => {
        this.dataSource.data = Array.isArray(data?.data)
          ? data.data
          : (Array.isArray(data) ? data : []);
        this.totalItems = data?.meta?.total ?? this.dataSource.data.length;
      },
      error: (error) => {
        this.dataSource.data = [];
        this.errorMessage = error?.error?.message || 'Unable to load bill items.';
      }
    });
  }

  applyFilter(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.searchChanged.next(this.searchTerm);
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBillItems();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(BillItermFormComponent, {
      width: '400px',
      data: null
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result === 'saved') {
        this.loadBillItems();
      }
    });
  }
}
