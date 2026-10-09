import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferralDetailsComponent } from './referral-details.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, of } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { LetterDocumentsService } from '../../../services/letters/letter-documents.service';
import { ReferralService } from '../../../services/Referral/referral.service';

describe('ReferralDetailsComponent', () => {
  let component: ReferralDetailsComponent;
  let fixture: ComponentFixture<ReferralDetailsComponent>;
  let documents: jasmine.SpyObj<LetterDocumentsService>;
  let feedback: jasmine.SpyObj<FeedbackService>;
  const original = {
    referral_id: 1, hospital_id: 1, status: 'Confirmed',
    hospital: { hospital_name: 'Original Hospital', referral_type: { referral_type_code: 'REFTYPE1' } },
  };
  const data = {
    referral_id: 8, parent_referral_id: 7, status: 'Transferred',
    patient: { name: 'Test Patient', patient_histories: [] },
    hospital: { hospital_name: 'Transferred Hospital', referral_type: { referral_type_code: 'REFTYPE2' } },
    original_referral: original,
  };

  beforeEach(async () => {
    documents = jasmine.createSpyObj('LetterDocumentsService', ['openReferralLetter']);
    documents.openReferralLetter.and.returnValue(of({ afterClosed: () => EMPTY } as any));
    feedback = jasmine.createSpyObj('FeedbackService', ['alert', 'error', 'fire']);
    await TestBed.configureTestingModule({
      imports: [ReferralDetailsComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: {
          paramMap: of(convertToParamMap({ id: '8' })), queryParamMap: of(convertToParamMap({})),
        } },
        { provide: ReferralService, useValue: { getReferralById: () => of({ data }) } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
        { provide: LetterDocumentsService, useValue: documents },
        { provide: FeedbackService, useValue: feedback },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferralDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('prints the original hospital letter and its language from the record page', () => {
    const button = fixture.nativeElement.querySelector('.referral-action-button--print');
    expect(button.disabled).toBeFalse();
    button.click();
    expect(documents.openReferralLetter).toHaveBeenCalledOnceWith(1, 'sw', 'Test Patient');
  });

  it('uses the original hospital even when patient-history mode shows a newer transfer', () => {
    component.referralType = 'history';
    component.referralsLetterPopup({ ...data, status: 'Pending', is_recommendation_only: true });
    expect(documents.openReferralLetter).toHaveBeenCalledOnceWith(1, 'sw', 'Test Patient');
    expect(component.isReferralPrintDisabled({ ...data, status: 'Pending' })).toBeFalse();
  });

  it('keeps normal original referral printing compatible with older API responses', () => {
    component.referralsLetterPopup({ ...original, patient: data.patient });
    expect(documents.openReferralLetter).toHaveBeenCalledOnceWith(1, 'sw', 'Test Patient');
  });

  it('does not print the transferred hospital when original ancestry is unresolved', () => {
    const unresolved = { ...data, original_referral: null };
    expect(component.isReferralPrintDisabled(unresolved)).toBeTrue();
    component.referralsLetterPopup(unresolved);
    expect(documents.openReferralLetter).not.toHaveBeenCalled();
    expect(feedback.alert).toHaveBeenCalled();
  });

  it('does not fall back to a transfer when an older response has no original referral metadata', () => {
    const { original_referral, ...legacy } = data;
    component.referralsLetterPopup(legacy);
    expect(documents.openReferralLetter).not.toHaveBeenCalled();
  });

  it('preserves pending and cancelled original letter restrictions', () => {
    expect(component.isReferralPrintDisabled({ ...data, original_referral: { ...original, status: 'Pending' } })).toBeTrue();
    expect(component.isReferralPrintDisabled({ ...data, original_referral: { ...original, status: 'Cancelled' } })).toBeTrue();
  });
});
