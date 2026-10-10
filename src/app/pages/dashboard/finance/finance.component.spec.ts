import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { of } from 'rxjs';
import { StatisticalService } from '../../../services/report/statistical.service';
import { GraphreportService } from '../../../services/accountants/graphreport.service';
import { PermissionService } from '../../../services/authentication/permission.service';
import { FinanceComponent } from './finance.component';

describe('FinanceComponent', () => {
  let component: FinanceComponent;
  let fixture: ComponentFixture<FinanceComponent>;
  let dashboard: jasmine.SpyObj<StatisticalService>;
  let router: jasmine.SpyObj<Router>;
  let permission: jasmine.SpyObj<PermissionService>;

  const phases = [
    ['reviewed', 1, 'Awaiting Medical Board', 20],
    ['assigned', 2, 'Assigned to Board Meeting', 40],
    ['requested', 3, 'Awaiting DCS Approval', 60],
    ['approved', 4, 'Approved by DCS', 80],
    ['confirmed', 5, 'Confirmed', 100],
    ['rejected', 0, 'Rejected', 0],
    ['boarded_out', 5, 'Boarded Out', 100],
  ];
  const summary = () => ({ data: { medical_history: {
    total: 9, tracked_total: 7, untracked_total: 2, under_review: 6, confirmed: 1, boarded_out: 1,
    statuses: phases.map(([status, stage, label, progress]) => ({ status, stage, label, progress_percentage: progress, count: 1, case_percentage: 100 / 7 })),
    untracked_statuses: [{ status: 'pending', label: 'Legacy submission', count: 2 }],
  } } });

  beforeEach(async () => {
    dashboard = jasmine.createSpyObj('StatisticalService', ['getCaseStatusTracking']);
    dashboard.getCaseStatusTracking.and.returnValue(of(summary()));
    router = jasmine.createSpyObj('Router', ['navigate']);
    permission = jasmine.createSpyObj('PermissionService', ['parmissionMatched']);
    permission.parmissionMatched.and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [FinanceComponent],
      providers: [
        { provide: StatisticalService, useValue: dashboard },
        { provide: GraphreportService, useValue: {} },
        { provide: Router, useValue: router },
        { provide: PermissionService, useValue: permission },
      ],
    })
    .overrideComponent(FinanceComponent, { remove: { imports: [NgApexchartsModule] }, add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] } })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinanceComponent);
    component = fixture.componentInstance;
    spyOn<any>(component, 'queueSecondaryDashboardLoads');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('uses all five exact workflow names and separate terminal outcomes', () => {
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.stage-title-row strong')).map((element: any) => element.textContent.trim());
    expect(labels).toEqual(phases.map(phase => phase[2] as string));
    expect(component.dashboardData.medical_history.statuses[3].stage).toBe(4);
    expect(component.dashboardData.medical_history.statuses[3].progress_percentage).toBe(80);
    expect((component as any).caseWorkflowChart.options.animation).toBeFalse();
  });

  it('keeps legacy cases outside the stage list without losing them from totals', () => {
    const history = component.dashboardData.medical_history;
    expect(history.total).toBe(history.tracked_total + history.untracked_total);
    expect(history.statuses.some((item: any) => item.status === 'pending')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.tracking-untracked').textContent).toContain('Legacy submission: 2');
    expect((component as any).caseWorkflowChart.data.datasets[0].data.reduce((sum: number, value: number) => sum + value, 0)).toBe(7);
  });

  it('opens the DCS-approved report with the existing approved status code', () => {
    fixture.nativeElement.querySelectorAll('.stage-summary-item')[3].click();
    expect(router.navigate).toHaveBeenCalledWith(['/pages/patient/top-diagnoses'], {
      queryParams: jasmine.objectContaining({ patient_history_status: 'approved', report_type: 'case_workflow' }),
    });
  });

  it('keeps a separate report link for legacy submissions', () => {
    fixture.nativeElement.querySelector('.tracking-untracked button').click();
    expect(router.navigate).toHaveBeenCalledWith(['/pages/patient/top-diagnoses'], {
      queryParams: jasmine.objectContaining({ patient_history_status: 'pending' }),
    });
  });

  it('also separates pending counts if an older API response arrives during deployment', () => {
    const response: any = summary();
    delete response.data.medical_history.untracked_statuses;
    delete response.data.medical_history.untracked_total;
    response.data.medical_history.statuses.unshift({ status: 'pending', count: 2, label: 'Submitted' });
    dashboard.getCaseStatusTracking.and.returnValue(of(response));
    component.loadDashboardStatistics();
    expect(component.dashboardData.medical_history.untracked_total).toBe(2);
    expect(component.dashboardData.medical_history.statuses).toHaveSize(7);
    expect(component.dashboardData.medical_history.untracked_statuses[0].label).toBe('Legacy submission');
  });

  it('preserves report permissions and explicitly refreshes cached counts', () => {
    permission.parmissionMatched.and.returnValue(false);
    component.openCaseReport('approved');
    expect(router.navigate).not.toHaveBeenCalled();
    component.loadDashboardStatistics(true);
    expect(dashboard.getCaseStatusTracking).toHaveBeenCalledWith({ include_archived: false, refresh: true });
  });
});
