import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { getApiErrorMessage } from '../../@shared/utils/api-error';
import { LetterDocumentsService, resolveReferralLetterLanguage } from './letter-documents.service';
import { environment } from '../../../environments/environment.prod';
import { createSubmissionKey } from '../../@shared/utils/submission-key';
import { FileViewerData } from '../../@shared/ui/file-viewer/file-viewer.component';

describe('LetterDocumentsService', () => {
  let service: LetterDocumentsService;
  let http: HttpTestingController;
  let dialog: jasmine.SpyObj<MatDialog>;
  let closed: Subject<unknown>;
  let viewer: { setFile: jasmine.Spy };
  let close: jasmine.Spy;

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    closed = new Subject();
    viewer = { setFile: jasmine.createSpy('setFile') };
    close = jasmine.createSpy('close').and.callFake(() => closed.next(undefined));
    dialog.open.and.returnValue({ componentInstance: viewer, close, afterClosed: () => closed } as any);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test-letter');
    spyOn(URL, 'revokeObjectURL');
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialog },
    ] });
    service = TestBed.inject(LetterDocumentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    closed.next(undefined);
    closed.complete();
    http.verify();
  });

  it('opens the same referral viewer and print tracking endpoint for a transfer', () => {
    service.openReferralLetter(8, 'sw', 'Test Patient').subscribe();
    const request = http.expectOne(`${environment.baseUrl}letter-documents/referrals/8/pdf?language=sw`);
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect((dialog.open.calls.mostRecent().args[1]?.data as FileViewerData).loading).toBeTrue();
    expect(viewer.setFile).not.toHaveBeenCalled();
    expect(request.request.headers.get('X-Skip-Cache')).toBe('true');
    request.flush(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
    expect(viewer.setFile).toHaveBeenCalledOnceWith('blob:test-letter#zoom=100');
    const config = dialog.open.calls.mostRecent().args[1];
    const data = config?.data as { title: string; printTrackingUrl: string };
    expect(data.title).toBe('Referral letter · Test Patient');
    expect(data.printTrackingUrl).toBe(`${environment.baseUrl}letter-documents/referrals/8/print`);
  });

  it('shows the useful API explanation when a PDF failure arrives as a JSON blob', (done) => {
    service.openReferralLetter(8, 'sw').subscribe({
      next: () => done.fail('Expected an error'),
      error: (error) => {
        expect(getApiErrorMessage(error, 'Fallback')).toBe('Transfer needs a verified case link.');
        expect(error.status).toBe(422);
        expect(close).toHaveBeenCalledTimes(1);
        done();
      },
    });
    http.expectOne(`${environment.baseUrl}letter-documents/referrals/8/pdf?language=sw`).flush(
      new Blob([JSON.stringify({ message: 'Transfer needs a verified case link.' })], { type: 'application/json' }),
      { status: 422, statusText: 'Unprocessable Entity' },
    );
  });

  it('cancels a pending PDF when the viewer is closed', () => {
    const next = jasmine.createSpy('next');
    service.openReferralLetter(8, 'sw').subscribe(next);
    const request = http.expectOne(`${environment.baseUrl}letter-documents/referrals/8/pdf?language=sw`);
    closed.next(undefined);
    expect(request.cancelled).toBeTrue();
    expect(next).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('releases the downloaded PDF after closing the viewer', () => {
    service.openReferralLetter(8, 'sw').subscribe();
    http.expectOne(`${environment.baseUrl}letter-documents/referrals/8/pdf?language=sw`)
      .flush(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    closed.next(undefined);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-letter');
  });

  for (const [type, open] of [
    ['follow-ups', (service: LetterDocumentsService) => service.openFollowUpLetter(12, 'sw')],
    ['boarded-out', (service: LetterDocumentsService) => service.openBoardedOutLetter(12, 'sw')],
  ] as const) {
    it(`opens ${type} immediately and keeps its own tracking endpoint`, () => {
      open(service).subscribe();
      expect(dialog.open).toHaveBeenCalledTimes(1);
      const data = dialog.open.calls.mostRecent().args[1]?.data as FileViewerData;
      expect(data.loading).toBeTrue();
      expect(data.printTrackingUrl).toBe(`${environment.baseUrl}letter-documents/${type}/12/print`);
      http.expectOne(`${environment.baseUrl}letter-documents/${type}/12/pdf?language=sw`)
        .flush(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
      expect(viewer.setFile).toHaveBeenCalledTimes(1);
    });
  }

  it('resolves the language of the transferred hospital', () => {
    expect(resolveReferralLetterLanguage({
      transferred_referral_id: 8,
      transferred_referral: { hospital: { referral_type: { referral_type_code: 'REFTYPE2' } } },
      referral: { hospital: { referral_type: { referral_type_code: 'REFTYPE1' } } },
    }, 8)).toBe('en');
  });

  it('can generate a retry UUID on HTTP without crypto.randomUUID', () => {
    const provider = { getRandomValues: (array: Uint8Array) => array.fill(1) } as unknown as Crypto;
    expect(createSubmissionKey(provider)).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  });
});
