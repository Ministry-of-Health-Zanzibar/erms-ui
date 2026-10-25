import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { ReferralService } from '../../../../services/Referral/referral.service';

import { SearchfollowUpComponent } from './searchfollow-up.component';

describe('SearchfollowUpComponent', () => {
  let component: SearchfollowUpComponent;
  let fixture: ComponentFixture<SearchfollowUpComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SearchfollowUpComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: router },
        { provide: PermissionService, useValue: {
          parmissionMatched: () => true,
          isHospitalDoctor: () => false,
        } },
        { provide: ReferralService, useValue: {
          getAllRefferal: () => of({ data: [], meta: { total: 0 } }),
        } },
        { provide: FeedbackService, useValue: { fire: jasmine.createSpy('fire') } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchfollowUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the referral that actually contains the follow-up in a grouped case', () => {
    component.viewfollowup({
      status: 'Confirmed',
      referrals: [
        { referral_id: 11, has_followup: false },
        { referral_id: 12, has_followup: true },
      ],
    });

    expect(router.navigate).toHaveBeenCalledWith(['/pages/config/referrals/view-follow-up', 12]);
  });

  it('lets a hospital user open a pending referral to submit the first proposal', () => {
    spyOn(component.permission, 'isHospitalDoctor').and.returnValue(true);

    expect(component.canViewFollowup({ status: 'Pending' })).toBeTrue();
  });
});
