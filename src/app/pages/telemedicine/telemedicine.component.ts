import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, StatusBadgeComponent } from '@shared/ui';
import { FeedbackService } from '@shared/services/feedback.service';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { PermissionService } from '../../services/authentication/permission.service';
import { TelemedicineService } from '../../services/telemedicine/telemedicine.service';

@Component({
  selector: 'app-telemedicine',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './telemedicine.component.html',
  styleUrl: './telemedicine.component.scss',
})
export class TelemedicineComponent implements OnInit, OnDestroy {
  private readonly destroyed = new Subject<void>();
  private readonly patientSearchChanged = new Subject<string>();
  private readonly feedback = inject(FeedbackService);
  private readonly formBuilder = inject(FormBuilder);

  requests: any[] = [];
  patients: any[] = [];
  hospitals: any[] = [];
  coordinators: any[] = [];
  doctors: any[] = [];
  selectedPatient: any = null;
  selectedFile: File | null = null;
  loading = false;
  loadingPatients = false;
  loadingHospitals = false;
  loadingOptions = false;
  errorMessage = '';
  filterSearch = '';
  filterStatus = '';
  activeScheduleId: number | null = null;
  activeReviewId: number | null = null;
  activeReportId: number | null = null;
  activeDecisionId: number | null = null;

  readonly requestForm = this.formBuilder.group({
    request_type: ['follow_up', Validators.required],
    reason: [''],
    clinical_notes: [''],
  });
  readonly scheduleForm = this.formBuilder.group({
    hospital_id: ['', Validators.required],
    telemedicine_coordinator_id: ['', Validators.required],
    assigned_doctor_id: ['', Validators.required],
    scheduled_at: ['', Validators.required],
  });
  readonly reviewForm = this.formBuilder.group({
    decision: ['confirm', Validators.required],
    comments: ['', Validators.required],
    scheduled_at: [''],
  });
  readonly reportForm = this.formBuilder.group({
    report_text: [''],
  });
  readonly decisionForm = this.formBuilder.group({
    decision: ['completed_in_zbr', Validators.required],
    comments: ['', Validators.required],
    reason_id: [''],
  });

  constructor(
    public readonly permission: PermissionService,
    private readonly telemedicine: TelemedicineService,
  ) {}

  get allowed(): boolean {
    return this.permission.parmissionMatched(['View Telemedicine']) || this.hasAnyRole([
      'ROLE ADMIN',
      'ROLE SUPER ADMIN',
      'ROLE SUPERADMIN',
      'ROLE DG',
      'ROLE DIRECTOR GENERAL',
      'ROLE MKURUGENZI TIBA',
      'ROLE BILL VERIFICATION OFFICER',
      'ROLE HOSPITAL USER',
      'ROLE TELEMEDICINE COORDINATOR',
    ]);
  }

  get canCreateRequest(): boolean {
    return this.permission.parmissionMatched(['Create Telemedicine Request']) || this.hasAnyRole([
      'ROLE ADMIN',
      'ROLE MKURUGENZI TIBA',
      'ROLE HOSPITAL USER',
      'ROLE TELEMEDICINE COORDINATOR',
    ]);
  }

  get canSchedule(): boolean {
    return this.permission.parmissionMatched(['Schedule Telemedicine Appointment']) || this.hasAnyRole([
      'ROLE ADMIN',
      'ROLE BILL VERIFICATION OFFICER',
      'ROLE TELEMEDICINE COORDINATOR',
    ]);
  }

  get canReview(): boolean {
    return this.permission.parmissionMatched(['Review Telemedicine Appointment']) || this.hasAnyRole([
      'ROLE ADMIN',
      'ROLE HOSPITAL USER',
      'ROLE TELEMEDICINE COORDINATOR',
    ]);
  }

  get canReport(): boolean {
    return this.permission.parmissionMatched(['Manage Telemedicine Report']) || this.hasAnyRole([
      'ROLE ADMIN',
      'ROLE HOSPITAL USER',
      'ROLE TELEMEDICINE COORDINATOR',
    ]);
  }

  get canDecide(): boolean {
    return this.permission.parmissionMatched(['Record Telemedicine Decision']) || this.hasAnyRole([
      'ROLE ADMIN',
      'ROLE HOSPITAL USER',
    ]);
  }

  ngOnInit(): void {
    if (!this.allowed) return;

    this.patientSearchChanged.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.destroyed),
    ).subscribe((term) => this.searchPatients(term));

    this.loadRequests();
    if (this.canSchedule) this.loadHospitals();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';
    this.telemedicine.getRequests({
      page: 1,
      per_page: 50,
      search: this.filterSearch,
      status: this.filterStatus,
    }).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loading = false),
    ).subscribe({
      next: (response) => this.requests = response?.data || [],
      error: (error) => this.errorMessage = getApiErrorMessage(error, 'Unable to load the telemedicine work queue.'),
    });
  }

  searchPatients(term: string): void {
    if (term.trim().length < 2) {
      this.patients = [];
      return;
    }

    this.loadingPatients = true;
    this.telemedicine.searchPatients(term.trim()).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loadingPatients = false),
    ).subscribe({
      next: (response) => this.patients = response?.data || [],
      error: () => this.patients = [],
    });
  }

  onPatientSearch(event: Event): void {
    this.patientSearchChanged.next(String((event.target as HTMLInputElement).value || ''));
  }

  selectPatient(patient: any): void {
    this.selectedPatient = patient;
    this.patients = [];
  }

  clearSelectedPatient(): void {
    this.selectedPatient = null;
  }

  onRequestFile(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
  }

  submitRequest(): void {
    if (!this.selectedPatient || this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.feedback.error('Patient selection required', 'Search for and select an existing patient before submitting the request.');
      return;
    }

    const value = this.requestForm.getRawValue();
    const historyId = this.selectedPatient?.latest_history?.patient_histories_id;
    if (value.request_type === 'follow_up' && !historyId) {
      this.feedback.error('Patient history required', 'This follow-up must be linked to an existing patient history. Open Patients to register or update the patient history first.');
      return;
    }

    const payload = new FormData();
    payload.append('request_type', String(value.request_type || 'follow_up'));
    payload.append('patient_id', String(this.selectedPatient.patient_id));
    if (historyId) payload.append('patient_histories_id', String(historyId));
    if (value.reason) payload.append('reason', value.reason);
    if (value.clinical_notes) payload.append('clinical_notes', value.clinical_notes);
    if (this.selectedFile) payload.append('documents[]', this.selectedFile, this.selectedFile.name);

    this.loading = true;
    this.telemedicine.createRequest(payload).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loading = false),
    ).subscribe({
      next: (response) => {
        this.feedback.success('Telemedicine request registered', response?.message || 'The request was added to the workflow.');
        this.requestForm.reset({ request_type: 'follow_up', reason: '', clinical_notes: '' });
        this.selectedPatient = null;
        this.selectedFile = null;
        this.loadRequests();
      },
      error: (error) => this.feedback.error('Unable to register request', getApiErrorMessage(error, 'The telemedicine request could not be saved.')),
    });
  }

  loadHospitals(): void {
    this.loadingHospitals = true;
    this.telemedicine.getHospitals().pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loadingHospitals = false),
    ).subscribe({
      next: (response) => this.hospitals = response?.data || [],
      error: (error) => this.errorMessage = getApiErrorMessage(error, 'Unable to load eligible Zanzibar/internal hospitals.'),
    });
  }

  beginSchedule(request: any): void {
    this.activeScheduleId = Number(request.telemedicine_request_id);
    this.activeReviewId = null;
    this.activeReportId = null;
    this.activeDecisionId = null;
    this.coordinators = [];
    this.doctors = [];
    this.scheduleForm.reset({ hospital_id: '', telemedicine_coordinator_id: '', assigned_doctor_id: '', scheduled_at: '' });
  }

  closeActions(): void {
    this.activeScheduleId = null;
    this.activeReviewId = null;
    this.activeReportId = null;
    this.activeDecisionId = null;
  }

  onHospitalSelected(): void {
    const hospitalId = Number(this.scheduleForm.get('hospital_id')?.value);
    this.coordinators = [];
    this.doctors = [];
    this.scheduleForm.patchValue({ telemedicine_coordinator_id: '', assigned_doctor_id: '' });
    if (!hospitalId) return;

    this.loadingOptions = true;
    this.telemedicine.getCoordinators(hospitalId).pipe(takeUntil(this.destroyed)).subscribe({
      next: (response) => this.coordinators = response?.data || [],
      error: () => this.coordinators = [],
    });
    this.telemedicine.getDoctors(hospitalId).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loadingOptions = false),
    ).subscribe({
      next: (response) => this.doctors = response?.data || [],
      error: () => this.doctors = [],
    });
  }

  submitSchedule(request: any): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.telemedicine.schedule(Number(request.telemedicine_request_id), this.scheduleForm.getRawValue()).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loading = false),
    ).subscribe({
      next: (response) => {
        this.feedback.success('Appointment proposed', response?.message || 'The assigned doctor has been notified.');
        this.closeActions();
        this.loadRequests();
      },
      error: (error) => this.feedback.error('Unable to schedule appointment', getApiErrorMessage(error, 'The appointment could not be saved.')),
    });
  }

  beginReview(request: any): void {
    this.activeReviewId = Number(request.telemedicine_request_id);
    this.activeScheduleId = null;
    this.activeReportId = null;
    this.activeDecisionId = null;
    this.reviewForm.reset({ decision: 'confirm', comments: '', scheduled_at: '' });
  }

  submitReview(request: any): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.telemedicine.reviewAppointment(Number(request.telemedicine_request_id), this.reviewForm.getRawValue()).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loading = false),
    ).subscribe({
      next: (response) => {
        this.feedback.success('Appointment review saved', response?.message || 'The appointment workflow was updated.');
        this.closeActions();
        this.loadRequests();
      },
      error: (error) => this.feedback.error('Unable to review appointment', getApiErrorMessage(error, 'The appointment decision could not be saved.')),
    });
  }

  beginReport(request: any): void {
    this.activeReportId = Number(request.telemedicine_request_id);
    this.activeScheduleId = null;
    this.activeReviewId = null;
    this.activeDecisionId = null;
    this.reportForm.reset({ report_text: '' });
    this.selectedFile = null;
  }

  submitReport(request: any): void {
    const reportText = String(this.reportForm.get('report_text')?.value || '').trim();
    if (!reportText && !this.selectedFile) {
      this.reportForm.markAllAsTouched();
      this.feedback.error('Report required', 'Enter the consultation report or choose a report file.');
      return;
    }

    const payload = new FormData();
    if (reportText) payload.append('report_text', reportText);
    if (this.selectedFile) payload.append('report_file', this.selectedFile, this.selectedFile.name);

    this.loading = true;
    this.telemedicine.uploadReport(Number(request.telemedicine_request_id), payload).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loading = false),
    ).subscribe({
      next: (response) => {
        this.feedback.success('Consultation report recorded', response?.message || 'The responsible doctor has been notified.');
        this.closeActions();
        this.selectedFile = null;
        this.loadRequests();
      },
      error: (error) => this.feedback.error('Unable to record report', getApiErrorMessage(error, 'The consultation report could not be saved.')),
    });
  }

  beginDecision(request: any): void {
    this.activeDecisionId = Number(request.telemedicine_request_id);
    this.activeScheduleId = null;
    this.activeReviewId = null;
    this.activeReportId = null;
    this.decisionForm.reset({ decision: 'completed_in_zbr', comments: '', reason_id: '' });
  }

  submitDecision(request: any): void {
    if (this.decisionForm.invalid) {
      this.decisionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.telemedicine.recordDecision(Number(request.telemedicine_request_id), this.decisionForm.getRawValue()).pipe(
      takeUntil(this.destroyed),
      finalize(() => this.loading = false),
    ).subscribe({
      next: (response) => {
        this.feedback.success('Clinical decision recorded', response?.message || 'The telemedicine workflow was updated.');
        this.closeActions();
        this.loadRequests();
      },
      error: (error) => this.feedback.error('Unable to record decision', getApiErrorMessage(error, 'The clinical decision could not be saved.')),
    });
  }

  onReportFile(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0] || null;
  }

  openFile(url: string | null | undefined, fileName = 'telemedicine-document'): void {
    if (!url) return;

    this.telemedicine.getFile(url).pipe(takeUntil(this.destroyed)).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      },
      error: (error) => this.feedback.error('Unable to open document', getApiErrorMessage(error, `The file ${fileName} could not be opened.`)),
    });
  }

  requestTypeLabel(type: string): string {
    return type === 'new_consultation' ? 'New patient consultation' : 'Existing patient follow-up';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      registered: 'Registered',
      awaiting_bill_verification: 'Awaiting appointment coordination',
      appointment_requested: 'Appointment proposed',
      appointment_confirmed: 'Appointment confirmed',
      report_available: 'Report available',
      referred: 'Referral started',
      closed: 'Completed in ZBR',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  personName(person: any): string {
    return [person?.first_name, person?.middle_name, person?.last_name].filter(Boolean).join(' ') || 'Not assigned';
  }

  appointment(request: any): any {
    return request?.latest_appointment || null;
  }

  canScheduleRequest(request: any): boolean {
    return this.canSchedule && ['registered', 'awaiting_bill_verification', 'appointment_requested'].includes(request?.status);
  }

  canReviewRequest(request: any): boolean {
    return this.canReview && !!this.appointment(request) && request?.status === 'appointment_requested';
  }

  canReportRequest(request: any): boolean {
    return this.canReport && request?.status === 'appointment_confirmed';
  }

  canDecisionRequest(request: any): boolean {
    return this.canDecide && request?.status === 'report_available';
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    this.patientSearchChanged.complete();
  }

  private hasAnyRole(expected: string[]): boolean {
    const values = [localStorage.getItem('roles'), localStorage.getItem('all_roles')].filter(Boolean) as string[];
    return values.some((stored) => {
      try {
        const parsed = JSON.parse(stored);
        const roles = Array.isArray(parsed) ? parsed : [parsed];
        return roles.some((role: any) => expected.includes(String(typeof role === 'string' ? role : role?.name || '').trim().toUpperCase()));
      } catch {
        return expected.includes(stored.trim().toUpperCase());
      }
    });
  }
}
