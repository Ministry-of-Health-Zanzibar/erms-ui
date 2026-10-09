import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFollowUpComponent } from './view-follow-up.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, of } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { FollowsService } from '../../../../services/Referral/follows.service';
import { LetterDocumentsService } from '../../../../services/letters/letter-documents.service';

describe('ViewFollowUpComponent', () => {
  let component: ViewFollowUpComponent;
  let fixture: ComponentFixture<ViewFollowUpComponent>;
  let documents: jasmine.SpyObj<LetterDocumentsService>;
  const transfer = {
    letter_id: 10, referral_id: 1, outcome: 'Transferred', transferred_referral_id: 2,
    is_printed: true, transfer_letter: { referral_id: 2, is_printed: false, print_count: 0 },
  };
  const normal = { letter_id: 11, referral_id: 1, outcome: 'Follow-up', is_printed: true };
  const data = {
    patient: { name: 'Test Patient' }, status: 'Confirmed', hospital_letters: [transfer, normal],
    referrals: [
      { referral_id: 1, hospital: { referral_type: { referral_type_code: 'REFTYPE1' } } },
      { referral_id: 2, hospital: { referral_type: { referral_type_code: 'REFTYPE2' } } },
    ],
  };

  beforeEach(async () => {
    documents = jasmine.createSpyObj('LetterDocumentsService', ['openReferralLetter', 'openFollowUpLetter']);
    documents.openReferralLetter.and.returnValue(of({ afterClosed: () => EMPTY } as any));
    documents.openFollowUpLetter.and.returnValue(of({ afterClosed: () => EMPTY } as any));
    await TestBed.configureTestingModule({
      imports: [ViewFollowUpComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: PermissionService, useValue: { parmissionMatched: () => true } },
        { provide: FollowsService, useValue: { getFollowListById: () => of({ data }) } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
        { provide: LetterDocumentsService, useValue: documents },
        { provide: FeedbackService, useValue: { error: jasmine.createSpy('error') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewFollowUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('enables transfer printing and uses the destination referral and its language', () => {
    const button = fixture.nativeElement.querySelector('button[aria-label="Print referral letter for the transferred hospital"]');
    expect(button.disabled).toBeFalse();
    button.click();
    expect(documents.openReferralLetter).toHaveBeenCalledOnceWith(2, 'en', 'Test Patient');
    expect(documents.openFollowUpLetter).not.toHaveBeenCalled();
  });

  it('preserves normal follow-up printing', () => {
    component.printFollowUp(data, normal);
    expect(documents.openFollowUpLetter).toHaveBeenCalledOnceWith(11, 'sw', 'Test Patient');
    expect(documents.openReferralLetter).not.toHaveBeenCalled();
  });

  it('uses the transfer letter print status instead of the uploaded follow-up print status', () => {
    expect(component.printStatus(transfer).is_printed).toBeFalse();
    expect(component.printStatus(normal).is_printed).toBeTrue();
  });

  it('does not guess a destination for an unresolved transfer', () => {
    const unresolved = { ...transfer, transfer_letter: null, transferred_referral_id: null };
    expect(component.canPrintLetter(unresolved)).toBeFalse();
    component.printFollowUp(data, unresolved);
    expect(documents.openReferralLetter).not.toHaveBeenCalled();
    expect(documents.openFollowUpLetter).not.toHaveBeenCalled();
    expect(component.printTooltip(unresolved)).toContain('verified referral letter');
  });

  it('does not enable attendance printing for Finished or Death outcomes', () => {
    expect(component.canPrintLetter({ ...normal, outcome: 'Finished' })).toBeFalse();
    expect(component.canPrintLetter({ ...normal, outcome: 'Death' })).toBeFalse();
  });

  it('keeps follow-up actions on the referral selected in the URL', () => {
    component.followListId = '2';
    component.getFeedbackById();
    expect(component.referralId).toBe(2);
  });
});
