import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { Subject, finalize, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';
import { PermissionService } from '../../../services/authentication/permission.service';
import { PageHeaderComponent, SectionCardComponent } from '@shared/ui';

interface DiagnosisPatient {
  patient_id: number;
  name: string;
  gender: string | null;
  history_count: number;
  referred_hospitals: { hospital_id: number; hospital_name: string }[];
}

interface DiagnosisReport {
  diagnosis_name: string;
  patient_count: number;
  history_count: number;
  patients: DiagnosisPatient[];
}

@Component({
  selector: 'app-top-diagnoses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, PageHeaderComponent, SectionCardComponent],
  templateUrl: './top-diagnoses.component.html',
})
export class TopDiagnosesComponent implements OnDestroy {
  private readonly destroyed = new Subject<void>();
  private readonly url = `${environment.baseUrl}reports/top-diagnoses`;
  readonly today = new Date().toLocaleDateString('en-CA');
  startDate = '2026-03-01';
  endDate = this.today;
  report: DiagnosisReport[] = [];
  generatedPeriod: { start_date: string; end_date: string } | null = null;
  loading = false;
  exporting = false;
  error = '';

  constructor(private http: HttpClient, public permission: PermissionService) {}

  generate(): void {
    if (this.loading || this.exporting) return;
    if (!this.startDate || !this.endDate || this.startDate > this.endDate || this.endDate > this.today) {
      this.error = 'Choose a valid date range ending on or before today.';
      return;
    }
    this.error = '';
    this.loading = true;
    this.report = [];
    this.generatedPeriod = null;
    const params = { start_date: this.startDate, end_date: this.endDate };
    this.http.get<{ data: DiagnosisReport[] }>(this.url, { params })
      .pipe(takeUntil(this.destroyed), finalize(() => this.loading = false))
      .subscribe({
        next: response => { this.report = response.data; this.generatedPeriod = params; },
        error: () => { this.error = 'Unable to generate the report. Check your access and try again.'; },
      });
  }

  hospitals(patient: DiagnosisPatient): string {
    return patient.referred_hospitals.map(hospital => hospital.hospital_name).join('; ') || 'No matching referral';
  }

  download(format: 'csv' | 'pdf' | 'docx'): void {
    if (!this.generatedPeriod || !this.report.length || this.loading || this.exporting) return;
    const period = this.generatedPeriod;
    this.error = '';
    this.exporting = true;
    this.http.get(this.url, { params: { ...period, format }, responseType: 'blob' })
      .pipe(takeUntil(this.destroyed), finalize(() => this.exporting = false))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `top-diagnoses-${period.start_date}-to-${period.end_date}.${format}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: () => { this.error = 'Unable to export the report. Please try again.'; },
      });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
