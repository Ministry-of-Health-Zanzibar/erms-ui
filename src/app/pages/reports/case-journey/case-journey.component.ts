import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, finalize, takeUntil } from 'rxjs';
import { DatePickerComponent, EmptyStateComponent, FilterSelectComponent, LoadingStateComponent, PageHeaderComponent,
  SectionCardComponent, StatusBadgeComponent, TextInputComponent } from '@shared/ui';
import { PermissionService } from '../../../services/authentication/permission.service';
import { GeneratedReport, ReportFilterOptions, ReportFormat, ReportRequest, ReportSection, ReportingService } from '../../../services/report/reporting.service';

@Component({
  selector: 'app-case-journey', standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCheckboxModule, MatIconModule, MatPaginatorModule,
    DatePickerComponent, EmptyStateComponent, FilterSelectComponent, LoadingStateComponent, PageHeaderComponent,
    SectionCardComponent, StatusBadgeComponent, TextInputComponent],
  templateUrl: './case-journey.component.html', styleUrl: './case-journey.component.scss',
})
export class CaseJourneyComponent implements OnInit, OnDestroy {
  private readonly destroyed = new Subject<void>();
  private readonly cancelSummary = new Subject<void>();
  private readonly cancelJourney = new Subject<void>();
  private appliedRequest: ReportRequest | null = null;
  private journeyRequest: ReportRequest | null = null;
  readonly today = this.isoDate(new Date());
  filters: ReportRequest = { report_type: 'case_journey', start_date: `${this.today.slice(0, 4)}-01-01`, end_date: this.today,
    detail_level: 'summary', source_hospital_ids: [], hospital_ids: [], include_archived: false, page: 1, per_page: 25 };
  options: ReportFilterOptions | null = null;
  report: GeneratedReport | null = null;
  journey: GeneratedReport | null = null;
  loading = false;
  loadingJourney = false;
  loadingOptions = false;
  exporting = false;
  error = '';
  journeyError = '';
  optionsError = '';
  exportError = '';
  readonly formats: ReportFormat[] = ['pdf', 'xlsx', 'docx'];
  readonly metrics = [
    { key: 'cases', label: 'Cases' }, { key: 'hospital_referrals', label: 'Hospital referrals' },
    { key: 'follow_up_visits_in_period', label: 'Visits in period' }, { key: 'transfers_in_period', label: 'Transfers in period' },
    { key: 'finished_visits_in_period', label: 'Finished visits in period' }, { key: 'death_visits_in_period', label: 'Death visits in period' },
  ];

  constructor(private readonly reports: ReportingService, public readonly permission: PermissionService) {}

  get allowed(): boolean { return this.permission.isSuperAdmin() || this.permission.parmissionMatched(['View Report']); }

  ngOnInit(): void { if (this.allowed) this.loadOptions(); }

  loadOptions(): void {
    this.loadingOptions = true; this.optionsError = '';
    this.reports.getFilterOptions('case_journey').pipe(takeUntil(this.destroyed), finalize(() => this.loadingOptions = false)).subscribe({
      next: result => this.options = result.data,
      error: () => this.optionsError = 'Unable to load hospital and outcome filters. Please retry.',
    });
  }

  search(): void {
    if (!this.allowed || !this.filters.start_date || !this.filters.end_date || this.filters.start_date > this.filters.end_date || this.filters.end_date > this.today) {
      this.error = 'Choose a valid activity date range ending today or earlier.'; return;
    }
    this.appliedRequest = { ...this.filters, hospital_ids: [...(this.filters.hospital_ids || [])],
      source_hospital_ids: [...(this.filters.source_hospital_ids || [])], page: 1, case_id: null, detail_level: 'summary' };
    this.closeJourney(); this.report = null;
    this.loadSummary(this.appliedRequest);
  }

  changePage(event: PageEvent): void {
    if (this.appliedRequest) {
      this.appliedRequest = { ...this.appliedRequest, page: event.pageIndex + 1, per_page: event.pageSize };
      this.closeJourney(); this.loadSummary(this.appliedRequest);
    }
  }

  private loadSummary(request: ReportRequest): void {
    this.cancelSummary.next(); this.loading = true; this.error = ''; this.exportError = '';
    this.reports.generate(request).pipe(takeUntil(this.cancelSummary), takeUntil(this.destroyed), finalize(() => this.loading = false)).subscribe({
      next: result => this.report = result.data,
      error: () => { this.report = null; this.error = 'Unable to generate the report. Please retry.'; },
    });
  }

  viewJourney(row: Record<string, unknown>): void {
    if (!this.appliedRequest) return;
    this.cancelJourney.next(); this.loadingJourney = true; this.journeyError = ''; this.exportError = ''; this.journey = null;
    this.journeyRequest = { ...this.appliedRequest, case_id: Number(row['case_id']), detail_level: 'details', page: 1 };
    this.reports.generate(this.journeyRequest).pipe(takeUntil(this.cancelJourney), takeUntil(this.destroyed), finalize(() => this.loadingJourney = false)).subscribe({
      next: result => this.journey = result.data,
      error: () => this.journeyError = 'Unable to load this case journey. Please retry.',
    });
  }

  closeJourney(): void {
    this.cancelJourney.next(); this.journey = null; this.journeyRequest = null; this.journeyError = '';
  }

  get journeySections(): ReportSection[] {
    return (this.journey?.sections || []).filter(section => ['hospital_outcomes', 'movements', 'data_quality'].includes(section.key));
  }

  exportReport(format: ReportFormat, selectedCase = false): void {
    const request = selectedCase ? this.journeyRequest : this.appliedRequest;
    const report = selectedCase ? this.journey : this.report;
    if (!request || !report || this.exporting) return;
    this.exporting = true; this.exportError = '';
    this.reports.export({ ...request }, format).pipe(takeUntil(this.destroyed), finalize(() => this.exporting = false)).subscribe({
      next: response => {
        if (!response.body) { this.exportError = 'The export was empty. Please retry.'; return; }
        const url = URL.createObjectURL(response.body);
        const link = document.createElement('a'); link.href = url; link.download = `${report.filename_base}.${format}`;
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.exportError = 'Unable to export the report. Please retry.',
    });
  }

  text(value: unknown): string { return value === null || value === undefined || value === '' ? 'Not recorded' : String(value); }
  outcomeTone(outcome: unknown): 'danger' | 'success' | 'info' | 'warning' | 'neutral' {
    return outcome === 'Death' ? 'danger' : outcome === 'Finished' ? 'success' : outcome === 'Transferred' ? 'info' : outcome === 'Follow-up' ? 'warning' : 'neutral';
  }

  ngOnDestroy(): void { this.destroyed.next(); this.destroyed.complete(); this.cancelSummary.complete(); this.cancelJourney.complete(); }
  private isoDate(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
}
