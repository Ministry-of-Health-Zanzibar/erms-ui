import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
  TableToolbarComponent,
} from '@shared/ui';
import { UserService } from '../../services/users/user.service';
import { PermissionService } from '../../services/authentication/permission.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
  ],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss',
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  readonly displayedColumns = ['created_at', 'actor', 'action', 'module', 'description', 'details'];
  readonly destroyed$ = new Subject<void>();
  readonly searchChanged$ = new Subject<string>();

  logs: any[] = [];
  selectedLog: any = null;
  loading = false;
  errorMessage = '';
  searchTerm = '';
  action = '';
  module = '';
  userId = '';
  entityId = '';
  patientHistoryId = '';
  patientId = '';
  dateFrom = '';
  dateTo = '';
  actors: any[] = [];
  totalItems = 0;
  pageSize = 25;
  currentPage = 1;

  constructor(
    public permission: PermissionService,
    private readonly users: UserService,
  ) {}

  ngOnInit(): void {
    this.searchChanged$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(() => {
        this.currentPage = 1;
        this.load();
      });

    this.load();
    this.loadActors();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.users.getLogs({
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm,
      action: this.action,
      module: this.module,
      user_id: this.numericFilter(this.userId),
      entity_id: this.numericFilter(this.entityId),
      patient_history_id: this.numericFilter(this.patientHistoryId),
      patient_id: this.numericFilter(this.patientId),
      date_from: this.dateFrom,
      date_to: this.dateTo,
    }).pipe(takeUntil(this.destroyed$)).subscribe({
      next: (response: any) => {
        this.logs = response?.data || response?.activity || [];
        this.totalItems = response?.meta?.total ?? this.logs.length;
        this.loading = false;
      },
      error: () => {
        this.logs = [];
        this.totalItems = 0;
        this.errorMessage = 'Audit activity could not be loaded. Please try again.';
        this.loading = false;
      },
    });
  }

  private loadActors(): void {
    this.users.getAllUsers({ per_page: 100 }).pipe(takeUntil(this.destroyed$)).subscribe({
      next: (response: any) => {
        this.actors = response?.data || [];
      },
      error: () => {
        this.actors = [];
      },
    });
  }

  private numericFilter(value: string): number | undefined {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  refresh(): void {
    this.load();
  }

  search(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.trim();
    this.searchChanged$.next(this.searchTerm);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.load();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.action = '';
    this.module = '';
    this.userId = '';
    this.entityId = '';
    this.patientHistoryId = '';
    this.patientId = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage = 1;
    this.load();
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  showDetails(log: any): void {
    this.selectedLog = this.selectedLog?.id === log.id ? null : log;
  }

  formatProperties(properties: any): string {
    return JSON.stringify(properties || {}, null, 2);
  }
}
