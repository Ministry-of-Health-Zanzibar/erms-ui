import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { PermissionService } from '../../../services/authentication/permission.service';
import { GeneratedReport, ReportingService } from '../../../services/report/reporting.service';
import { CaseJourneyComponent } from './case-journey.component';

describe('CaseJourneyComponent', () => {
  let component: CaseJourneyComponent;
  let fixture: ComponentFixture<CaseJourneyComponent>;
  let reports: jasmine.SpyObj<ReportingService>;
  const result = {
    rows: [{ case_id: 7, patient: 'Test patient', matibabu_card: '0001', status: 'confirmed', status_label: 'Confirmed' }],
    columns: [{ key: 'patient', label: 'Patient', type: 'text' }, { key: 'status_label', label: 'Approval status', type: 'text' }],
    summary: { cases: 1 }, period: 'September 2026', notes: [], filename_base: 'case_journey',
    pagination: { current_page: 1, per_page: 25, total: 1 },
    sections: [{ key: 'movements', kind: 'table', title: 'Movements', rows: [{ activity: 'Follow-up visit', outcome: 'Death', period_context: 'In period', actor: 'Not recorded' }] }],
  } as unknown as GeneratedReport;

  beforeEach(async () => {
    reports = jasmine.createSpyObj('ReportingService', ['getFilterOptions', 'generate', 'export']);
    reports.getFilterOptions.and.returnValue(of({ data: { hospitals: [], source_hospitals: [], followup_outcomes: [] } } as any));
    reports.generate.and.returnValue(of({ data: result }));
    await TestBed.configureTestingModule({ imports: [CaseJourneyComponent], providers: [provideNoopAnimations(),
      { provide: ReportingService, useValue: reports }, { provide: PermissionService, useValue: { isSuperAdmin: () => false, parmissionMatched: () => true } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(CaseJourneyComponent); component = fixture.componentInstance; fixture.detectChanges();
    component.filters.start_date = '2026-09-01'; component.filters.end_date = '2026-09-30';
  });
  afterEach(() => fixture.destroy());

  it('opens a separate report with approval labels and a complete journey', () => {
    component.search(); component.viewJourney(result.rows[0]); fixture.detectChanges();
    expect(reports.generate.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ case_id: 7, detail_level: 'details', report_type: 'case_journey' }));
    expect(fixture.nativeElement.textContent).toContain('Complete case journey');
    expect(fixture.nativeElement.textContent).toContain('Death');
    expect(component.outcomeTone('Death')).toBe('danger'); expect(component.outcomeTone('Finished')).toBe('success');
  });

  it('uses generated filters for pagination and detail, not unsubmitted edits', () => {
    component.filters.source_hospital_ids = [1]; component.search();
    component.filters.source_hospital_ids.push(2); component.filters.patient_search = 'Unsubmitted edit';
    component.changePage({ pageIndex: 1, pageSize: 10, length: 20 });
    expect(reports.generate.calls.mostRecent().args[0].source_hospital_ids).toEqual([1]);
    expect(reports.generate.calls.mostRecent().args[0].patient_search).toBeUndefined();
    component.viewJourney(result.rows[0]); expect(reports.generate.calls.mostRecent().args[0].page).toBe(1);
  });

  it('rejects invalid periods without sending a request', () => {
    component.filters.end_date = '2026-08-31'; component.search();
    expect(reports.generate).not.toHaveBeenCalled(); expect(component.error).toContain('valid activity date');
  });

  it('cancels older requests so a late result cannot replace the report', () => {
    const old = new Subject<{ data: GeneratedReport }>(); const fresh = new Subject<{ data: GeneratedReport }>();
    reports.generate.and.returnValues(old, fresh); component.search(); component.search();
    fresh.next({ data: result }); old.next({ data: { ...result, rows: [] } }); expect(component.report?.rows.length).toBe(1);
  });

  it('exports the generated report or selected journey with the same filters', () => {
    const pending = new Subject<any>(); reports.export.and.returnValue(pending);
    component.search(); component.filters.outcome = 'Finished'; component.exportReport('xlsx');
    expect(reports.export.calls.mostRecent().args[0].outcome).toBeUndefined();
    pending.complete(); component.viewJourney(result.rows[0]); component.exportReport('pdf', true);
    expect(reports.export.calls.mostRecent().args).toEqual([jasmine.objectContaining({ case_id: 7, detail_level: 'details' }), 'pdf']);
  });
});
