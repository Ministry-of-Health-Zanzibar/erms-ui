import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export type ReportFormat = 'xlsx' | 'pdf' | 'docx';

export interface ReportDefinition {
  key: string;
  name: string;
  description: string;
  metric: string;
  filters: string[];
  group_by?: ReportOption[];
  detail_levels?: ReportOption[];
  exports: ReportFormat[];
}

export interface ReportOption {
  value: string | number;
  label: string;
  parent_id?: string | null;
}

export interface ReportFilterOptions {
  hospitals: ReportOption[];
  source_hospitals: ReportOption[];
  locations: ReportOption[];
  referral_types: ReportOption[];
  genders: ReportOption[];
  referral_statuses: ReportOption[];
  patient_history_statuses: ReportOption[];
  age_groups: ReportOption[];
  top_limits: ReportOption[];
  result_limits: ReportOption[];
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'text' | 'integer' | 'number' | 'percentage' | 'date';
}

export interface GeneratedReport {
  key: string;
  name: string;
  title: string;
  period: string;
  filters: Record<string, string>;
  metric: string;
  generated_at: string;
  generated_by: string;
  export_formats: ReportFormat[];
  filename_base: string;
  summary: Record<string, number | string>;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  sections?: ReportSection[];
  findings?: string[];
  data_quality_notes?: string[];
  notes: string[];
  pagination: {
    current_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    last_page: number;
    has_more_pages: boolean;
  };
}

export interface ReportSection {
  key: string;
  title: string;
  kind: 'text' | 'metrics' | 'table' | 'list';
  text?: string;
  items?: string[];
  metrics?: { key: string; label: string; value: unknown; type?: string }[];
  columns?: ReportColumn[];
  rows?: Record<string, unknown>[];
  pagination?: GeneratedReport['pagination'] | null;
}

export interface ReportRequest {
  report_type: string;
  start_date: string;
  end_date: string;
  top?: number | null;
  result_limit?: number | 'all' | null;
  group_by?: string | null;
  detail_level?: string | null;
  gender?: string | null;
  age_from?: number | null;
  age_to?: number | null;
  age_group?: string | null;
  location_id?: string | null;
  diagnosis_id?: number | null;
  hospital_ids?: number[];
  source_hospital_ids?: number[];
  referral_status?: string | null;
  referral_type_id?: number | null;
  patient_history_status?: string | null;
  patient_search?: string | null;
  page?: number;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private readonly baseUrl = `${environment.baseUrl}reports`;
  private readonly diagnosisUrl = `${environment.baseUrl}diagnoses/search`;

  constructor(private readonly http: HttpClient) {}

  getDefinitions(): Observable<{ data: ReportDefinition[] }> {
    return this.http.get<{ data: ReportDefinition[] }>(`${this.baseUrl}/types`);
  }

  getFilterOptions(): Observable<{ data: ReportFilterOptions }> {
    return this.http.get<{ data: ReportFilterOptions }>(`${this.baseUrl}/filters`);
  }

  generate(request: ReportRequest): Observable<{ data: GeneratedReport }> {
    return this.http.post<{ data: GeneratedReport }>(`${this.baseUrl}/generate`, this.cleanRequest(request));
  }

  export(request: ReportRequest, format: ReportFormat): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.baseUrl}/export/${format}`, this.cleanRequest(request), {
      observe: 'response',
      responseType: 'blob',
    });
  }

  searchDiagnoses(query: string, limit = 20): Observable<{ data: { diagnosis_id: number; diagnosis_name: string; diagnosis_code: string }[] }> {
    const params = new HttpParams()
      .set('q', query.trim())
      .set('limit', String(limit));

    return this.http.get<{ data: { diagnosis_id: number; diagnosis_name: string; diagnosis_code: string }[] }>(this.diagnosisUrl, { params });
  }

  private cleanRequest(request: ReportRequest): ReportRequest {
    const cleaned: ReportRequest = { ...request };
    const payload = cleaned as unknown as Record<string, unknown>;

    const integerFields = [
      'top',
      'age_from',
      'age_to',
      'diagnosis_id',
      'referral_type_id',
      'page',
      'per_page',
    ];

    integerFields.forEach(field => {
      payload[field] = this.normalizeInteger(payload[field]);
    });

    if (Array.isArray(payload['hospital_ids'])) {
      payload['hospital_ids'] = (payload['hospital_ids'] as unknown[])
        .map(value => this.normalizeInteger(value));
    }

    if (Array.isArray(payload['source_hospital_ids'])) {
      payload['source_hospital_ids'] = (payload['source_hospital_ids'] as unknown[])
        .map(value => this.normalizeInteger(value));
    }

    Object.keys(cleaned).forEach((key) => {
      const typedKey = key as keyof ReportRequest;
      const value = cleaned[typedKey];
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete cleaned[typedKey];
      }
    });

    return cleaned;
  }

  private normalizeInteger(value: unknown): unknown {
    if (typeof value === 'string' && /^[+-]?\d+$/.test(value.trim())) {
      return Number(value.trim());
    }

    return value;
  }
}
