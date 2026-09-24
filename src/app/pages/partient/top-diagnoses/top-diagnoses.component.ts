import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { PermissionService } from '../../../services/authentication/permission.service';
import {
  GeneratedReport,
  ReportColumn,
  ReportDefinition,
  ReportFilterOptions,
  ReportFormat,
  ReportRequest,
  ReportSection,
  ReportingService,
} from '../../../services/report/reporting.service';
import {
  DatePickerComponent,
  EmptyStateComponent,
  FilterSelectComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
} from '@shared/ui';

interface DiagnosisOption {
  diagnosis_id: number;
  diagnosis_name: string;
  diagnosis_code: string;
}

@Component({
  selector: 'app-top-diagnoses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    DatePickerComponent,
    EmptyStateComponent,
    FilterSelectComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  templateUrl: './top-diagnoses.component.html',
})
export class TopDiagnosesComponent implements OnInit, OnDestroy {
  private readonly destroyed = new Subject<void>();
  private readonly diagnosisSearchInput = new Subject<string>();

  readonly topDiagnosesKey = 'top_diagnoses';
  readonly referralsByHospitalKey = 'referrals_by_hospital';
  readonly today = this.toIsoDate(new Date());

  reportDefinitions: ReportDefinition[] = [];
  filterOptions: ReportFilterOptions = {
    hospitals: [],
    source_hospitals: [],
    locations: [],
    referral_types: [],
    genders: [],
    referral_statuses: [],
    patient_history_statuses: [],
    age_groups: [],
    top_limits: [],
    result_limits: [],
  };

  selectedReportType = this.topDiagnosesKey;
  startDate = this.today.substring(0, 4) + '-01-01';
  endDate = this.today;
  top = 10;
  resultLimit: number | 'all' = 10;
  groupBy = 'diagnosis';
  detailLevel = 'breakdown';
  gender: string | null = null;
  ageGroup: string | null = null;
  ageFrom: number | null = null;
  ageTo: number | null = null;
  locationId: string | null = null;
  hospitalIds: number[] = [];
  sourceHospitalIds: number[] = [];
  referralStatus: string | null = null;
  referralTypeId: number | null = null;
  patientHistoryStatus: string | null = null;
  patientSearch = '';

  diagnosisSearchText = '';
  selectedDiagnosis: DiagnosisOption | null = null;
  diagnosisResults: DiagnosisOption[] = [];
  diagnosisLoading = false;

  report: GeneratedReport | null = null;
  loading = false;
  loadingOptions = false;
  exporting: ReportFormat | null = null;
  error = '';

  constructor(
    private readonly reporting: ReportingService,
    public readonly permission: PermissionService,
  ) {}

  ngOnInit(): void {
    if (!this.permission.parmissionMatched(['View Report'])) {
      return;
    }

    this.loadingOptions = true;
    forkJoin({
      definitions: this.reporting.getDefinitions(),
      filters: this.reporting.getFilterOptions(),
    })
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => this.loadingOptions = false),
      )
      .subscribe({
        next: response => {
          this.reportDefinitions = response.definitions.data ?? [];
          this.filterOptions = response.filters.data;
          if (!this.reportDefinitions.some(definition => definition.key === this.selectedReportType)) {
            this.selectedReportType = this.reportDefinitions[0]?.key ?? this.topDiagnosesKey;
          }
          this.applyReportDefaults();
        },
        error: () => {
          this.error = 'The report options could not be loaded. Please try again.';
        },
      });

    this.diagnosisSearchInput
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.trim().length < 2) {
            this.diagnosisLoading = false;
            return of({ data: [] as DiagnosisOption[] });
          }

          this.diagnosisLoading = true;
          return this.reporting.searchDiagnoses(query).pipe(
            finalize(() => this.diagnosisLoading = false),
          );
        }),
        takeUntil(this.destroyed),
      )
      .subscribe({
        next: response => this.diagnosisResults = response.data ?? [],
        error: () => {
          this.diagnosisResults = [];
          this.diagnosisLoading = false;
        },
      });
  }

  get selectedDefinition(): ReportDefinition | undefined {
    return this.reportDefinitions.find(definition => definition.key === this.selectedReportType);
  }

  get isTopDiagnoses(): boolean {
    return this.selectedReportType === this.topDiagnosesKey;
  }

  get isReferralReport(): boolean {
    return this.selectedReportType === this.referralsByHospitalKey;
  }

  get canGenerate(): boolean {
    return Boolean(this.startDate && this.endDate && this.startDate <= this.endDate && this.endDate <= this.today);
  }

  reportTypeChanged(value: unknown): void {
    this.selectedReportType = String(value || this.topDiagnosesKey);
    this.applyReportDefaults();
    this.report = null;
    this.error = '';
  }

  resultLimitChanged(value: unknown): void {
    this.resultLimit = value === 'all' ? 'all' : Number(value) || 10;
  }

  groupByChanged(value: unknown): void {
    this.groupBy = String(value || (this.isTopDiagnoses ? 'diagnosis' : 'destination'));
  }

  detailLevelChanged(value: unknown): void {
    this.detailLevel = String(value || 'breakdown');
  }

  ageGroupChanged(value: unknown): void {
    this.ageGroup = value === null || value === undefined || value === '' ? null : String(value);
    if (this.ageGroup !== null) {
      this.ageFrom = null;
      this.ageTo = null;
    }
  }

  generate(page = 1): void {
    if (this.loading || this.exporting || !this.canGenerate) {
      this.error = 'Choose a valid date range ending on or before today.';
      return;
    }

    this.error = '';
    this.loading = true;
    this.report = null;
    this.reporting
      .generate(this.request(page))
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => this.loading = false),
      )
      .subscribe({
        next: response => this.report = response.data,
        error: response => {
          this.error = response?.error?.message || 'Unable to generate the report. Check your access and try again.';
        },
      });
  }

  resetFilters(): void {
    this.startDate = this.today.substring(0, 4) + '-01-01';
    this.endDate = this.today;
    this.top = 10;
    this.resultLimit = this.isTopDiagnoses ? 10 : 'all';
    this.groupBy = this.isTopDiagnoses ? 'diagnosis' : 'destination';
    this.detailLevel = 'breakdown';
    this.gender = null;
    this.ageGroup = null;
    this.ageFrom = null;
    this.ageTo = null;
    this.locationId = null;
    this.hospitalIds = [];
    this.sourceHospitalIds = [];
    this.referralStatus = null;
    this.referralTypeId = null;
    this.patientHistoryStatus = null;
    this.patientSearch = '';
    this.clearDiagnosis();
    this.report = null;
    this.error = '';
  }

  diagnosisInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.diagnosisSearchText = value;
    if (this.selectedDiagnosis && value !== this.diagnosisLabel(this.selectedDiagnosis)) {
      this.selectedDiagnosis = null;
    }
    this.diagnosisSearchInput.next(value);
  }

  selectDiagnosis(diagnosis: DiagnosisOption): void {
    this.selectedDiagnosis = diagnosis;
    this.diagnosisSearchText = this.diagnosisLabel(diagnosis);
    this.diagnosisResults = [];
  }

  clearDiagnosis(): void {
    this.selectedDiagnosis = null;
    this.diagnosisSearchText = '';
    this.diagnosisResults = [];
    this.diagnosisSearchInput.next('');
  }

  exportReport(format: ReportFormat): void {
    if (!this.report || this.exporting || this.loading) {
      return;
    }

    this.error = '';
    this.exporting = format;
    this.reporting
      .export(this.request(1), format)
      .pipe(
        takeUntil(this.destroyed),
        finalize(() => this.exporting = null),
      )
      .subscribe({
        next: response => this.saveDownload(response, format),
        error: () => this.error = 'The report could not be exported. Please try again.',
      });
  }

  goToPage(page: number): void {
    if (!this.report?.pagination || page < 1 || page > this.report.pagination.last_page || page === this.report.pagination.current_page) {
      return;
    }
    this.generate(page);
  }

  goToSectionPage(section: ReportSection, page: number): void {
    const pagination = section.pagination;
    if (!pagination || page < 1 || page > pagination.last_page || page === pagination.current_page) {
      return;
    }

    this.generate(page);
  }

  visibleFilter(filter: string): boolean {
    return this.selectedDefinition?.filters.includes(filter) ?? false;
  }

  formatCell(value: unknown, column: ReportColumn): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (column.type === 'percentage') {
      return Number(value).toFixed(2) + '%';
    }

    if (column.type === 'integer' || column.type === 'number') {
      return new Intl.NumberFormat().format(Number(value));
    }

    if (column.type === 'date') {
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
    }

    return String(value);
  }

  formatMetric(value: unknown, type?: string): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (type === 'percentage') {
      return Number(value).toFixed(2) + '%';
    }

    if (type === 'integer' || type === 'number') {
      return new Intl.NumberFormat().format(Number(value));
    }

    return String(value);
  }

  summaryLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  generatedAt(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  diagnosisLabel(diagnosis: DiagnosisOption): string {
    return diagnosis.diagnosis_code + ' — ' + diagnosis.diagnosis_name;
  }

  trackColumn(_index: number, column: ReportColumn): string {
    return column.key;
  }

  trackRow(index: number): number {
    return index;
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private request(page: number): ReportRequest {
    return {
      report_type: this.selectedReportType,
      start_date: this.startDate,
      end_date: this.endDate,
      top: this.isTopDiagnoses && this.resultLimit !== 'all' ? Number(this.resultLimit) : null,
      result_limit: this.resultLimit,
      group_by: this.groupBy,
      detail_level: this.detailLevel,
      gender: this.gender,
      age_from: this.ageGroup ? null : this.ageFrom,
      age_to: this.ageGroup ? null : this.ageTo,
      age_group: this.ageGroup,
      location_id: this.locationId,
      diagnosis_id: this.selectedDiagnosis?.diagnosis_id ?? null,
      hospital_ids: this.hospitalIds,
      source_hospital_ids: this.sourceHospitalIds,
      referral_status: this.referralStatus,
      referral_type_id: this.referralTypeId,
      patient_history_status: this.isTopDiagnoses ? this.patientHistoryStatus : null,
      patient_search: this.isReferralReport && this.patientSearch.trim() ? this.patientSearch.trim() : null,
      page,
      per_page: 25,
    };
  }

  private applyReportDefaults(): void {
    if (this.isTopDiagnoses) {
      this.resultLimit = 10;
      this.groupBy = 'diagnosis';
      return;
    }

    this.resultLimit = 'all';
    this.groupBy = 'destination';
  }

  private saveDownload(response: HttpResponse<Blob>, format: ReportFormat): void {
    if (!response.body) {
      this.error = 'The server returned an empty report.';
      return;
    }

    const header = response.headers.get('content-disposition') || '';
    const match = header.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    const filename = match?.[1] || this.defaultFilename(format);
    const url = URL.createObjectURL(response.body);
    const link = document.createElement('a');
    link.href = url;
    link.download = decodeURIComponent(filename);
    link.click();
    URL.revokeObjectURL(url);
  }

  private defaultFilename(format: ReportFormat): string {
    const base = this.report?.filename_base || 'report';
    return base + '.' + format;
  }

  private toIsoDate(value: Date): string {
    return value.getFullYear()
      + '-'
      + String(value.getMonth() + 1).padStart(2, '0')
      + '-'
      + String(value.getDate()).padStart(2, '0');
  }
}
