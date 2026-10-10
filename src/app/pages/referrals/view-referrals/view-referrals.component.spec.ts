import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { LetterDocumentsService } from '../../../services/letters/letter-documents.service';
import { ReferralService } from '../../../services/Referral/referral.service';
import { PermissionService } from '../../../services/authentication/permission.service';
import { ViewReferralsComponent } from './view-referrals.component';

describe('ViewReferralsComponent', () => {
  let component: ViewReferralsComponent;
  let fixture: ComponentFixture<ViewReferralsComponent>;
  let router: jasmine.SpyObj<Router>;
  const record = {
    status: 'Confirmed', case_status: null, case_status_label: 'Case link needs review', case_link_resolved: false,
    record_type: 'referral', patient: { name: 'Test patient' }, referrals: [{ referral_id: 8 }],
    hospitals: [{ hospital_id: 1 }], has_followup: true,
  };

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [ViewReferralsComponent],
      providers: [
        provideNoopAnimations(),
        { provide: PermissionService, useValue: { parmissionMatched: () => true } },
        { provide: ReferralService, useValue: { getAllRefferal: () => of({ data: [record], meta: { total: 1 } }) } },
        { provide: FeedbackService, useValue: { fire: jasmine.createSpy('fire') } },
        { provide: LetterDocumentsService, useValue: {} },
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewReferralsComponent);
    component = fixture.componentInstance;
    spyOn(component, 'getUserRole').and.returnValue('ROLE DG');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('shows the referral status normally and the link warning in its own column', () => {
    const status = fixture.nativeElement.querySelector('td.mat-column-status');
    const warning = fixture.nativeElement.querySelector('td.mat-column-record_check');
    expect(status.textContent.trim()).toBe('Confirmed');
    expect(status.textContent).not.toContain('needs review');
    expect(warning.textContent).toContain('Case link needs review');
    expect(warning.querySelector('.ui-status-badge').getAttribute('data-tone')).toBe('warning');
  });

  it('does not substitute the confirmed case status for referral outcome statuses', () => {
    for (const status of ['Closed', 'Transferred', 'Death', 'Expired', 'Cancelled', 'Pending', 'BoardedOut']) {
      expect(component.displayStatus({ ...record, status, case_status: 'confirmed', case_status_label: 'Confirmed', case_link_resolved: true })).toBe(status);
    }
  });

  it('does not warn on linked referrals or older responses with no warning', () => {
    expect(component.recordWarning({ ...record, case_link_resolved: true, case_status_label: 'Confirmed' })).toBeNull();
    expect(component.recordWarning({ status: 'Closed' })).toBeNull();
    expect(component.displayStatus({ status: 'Confirmed', case_status_label: 'Confirmed by DG' })).toBe('Confirmed');
  });

  it('keeps legacy warning responses separate without requiring new API fields', () => {
    expect(component.recordWarning({ status: 'Confirmed', case_status_label: 'Case link needs review' })?.label).toBe('Case link needs review');
    expect(component.displayStatus({ ...record, status: undefined })).toBe('N/A');
  });

  it('distinguishes an unrecognised case status from a missing case link', () => {
    expect(component.recordWarning({ ...record, case_link_resolved: true })?.label).toBe('Case status needs review');
    expect(component.displayStatus({ ...record, case_link_resolved: true })).toBe('Confirmed');
  });

  it('preserves workflow labels for histories that have no referral yet', () => {
    expect(component.displayStatus({ record_type: 'history', status: 'Pending', case_status: 'approved', case_status_label: 'Approved by DCS' })).toBe('Approved by DCS');
    expect(component.displayStatus({ is_recommendation_only: true, case_status: 'requested' })).toBe('Awaiting DCS Approval');
    expect(component.displayStatus({ record_type: 'history', status: 'BoardedOut', case_status: 'boarded_out' })).toBe('Boarded Out');
  });

  it('keeps follow-up and record navigation independent of a case-link warning', () => {
    expect(component.canViewFollowup(record)).toBeTrue();
    expect(component.canViewFollowup({ ...record, status: 'Pending' })).toBeFalse();
    component.viewfollowup(record);
    expect(router.navigate).toHaveBeenCalledWith(['/pages/config/referrals/view-follow-up', 8]);
    component.displayMoreData(record);
    expect(router.navigate).toHaveBeenCalledWith(['/pages/config/referrals/more', 8], { queryParams: { type: 'referral' } });
  });
});
