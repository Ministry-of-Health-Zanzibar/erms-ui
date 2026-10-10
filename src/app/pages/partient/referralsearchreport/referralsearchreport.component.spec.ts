import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PermissionService } from '../../../services/authentication/permission.service';
import { ReferralreportService } from '../../../services/Referral/referralreport.service';
import { HospitalService } from '../../../services/system-configuration/hospital.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { ReferalTypeService } from '../../../services/system-configuration/referal-type.service';
import { ReferralsearchreportComponent } from './referralsearchreport.component';

describe('ReferralsearchreportComponent', () => {
  let component: ReferralsearchreportComponent;
  let fixture: ComponentFixture<ReferralsearchreportComponent>;
  let reports: jasmine.SpyObj<ReferralreportService>;
  const row = { referral_id: 1, patient_name: 'Test patient', from_hospital_name: 'Source One', to_hospital_name: 'Destination Two' };
  beforeEach(async () => {
    reports = jasmine.createSpyObj('ReferralreportService', ['generateReport']); reports.generateReport.and.returnValue(of({ data: [row] }));
    await TestBed.configureTestingModule({ imports: [ReferralsearchreportComponent], providers: [provideNoopAnimations(),
      { provide: PermissionService, useValue: { parmissionMatched: () => true } },
      { provide: HospitalService, useValue: { getAllHospital: () => of({ data: [] }) } },
      { provide: ReasonsService, useValue: { getAllReasons: () => of({ data: [] }) } },
      { provide: ReferalTypeService, useValue: { getAllReferalType: () => of({ data: [] }) } },
      { provide: ReferralreportService, useValue: reports }, { provide: MatDialog, useValue: {} },
    ] }).compileComponents();

    fixture = TestBed.createComponent(ReferralsearchreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());
  it('renders source and destination hospitals in separate columns', () => {
    component.searchReport(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('td.mat-column-source_hospital').textContent).toContain('Source One');
    expect(fixture.nativeElement.querySelector('td.mat-column-destination_hospital').textContent).toContain('Destination Two');
  });
  it('submits independent filters with selected local calendar dates', () => {
    component.reportForm.patchValue({ from_hospital_name: 'Source One', to_hospital_name: 'Destination Two', start_date: new Date(2026, 8, 1), end_date: '2026-09-30' });
    component.searchReport(); expect(reports.generateReport.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ from_hospital_name: 'Source One', to_hospital_name: 'Destination Two', start_date: '2026-09-01', end_date: '2026-09-30' }));
  });
  it('clears stale results when a new search fails', () => {
    component.searchReport(); reports.generateReport.and.returnValue(throwError(() => ({ status: 500 }))); component.searchReport();
    expect(component.dataSource.data).toEqual([]); expect(component.errorMessage).toBeTruthy();
  });
  it('ignores late responses from an older search', () => {
    const older = new Subject<any>(); reports.generateReport.and.returnValue(older); component.searchReport();
    reports.generateReport.and.returnValue(of({ data: [row] })); component.searchReport(); older.next({ data: [] });
    expect(component.dataSource.data).toEqual([row]);
  });
});
