import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FileViewerComponent } from './file-viewer.component';

describe('FileViewerComponent letter loading', () => {
  let fixture: ComponentFixture<FileViewerComponent>;
  let component: FileViewerComponent;
  let http: HttpTestingController;
  let dialog: jasmine.SpyObj<MatDialogRef<FileViewerComponent>>;

  beforeEach(async () => {
    dialog = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [FileViewerComponent],
      providers: [
        provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: {
          url: '', loading: true, fileName: 'letter.pdf', mimeType: 'application/pdf',
          title: 'Referral letter', printTrackingUrl: '/test-letter/print', printTrackingBody: { language: 'sw' },
        } },
        { provide: MatDialogRef, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FileViewerComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows the reusable loading state without requesting an empty iframe URL', () => {
    expect(fixture.nativeElement.textContent).toContain('Preparing your letter');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    const buttons = fixture.nativeElement.querySelectorAll('.file-viewer__action');
    expect(Array.from(buttons).every((button: any) => button.disabled)).toBeTrue();
  });

  it('starts PDF loading eagerly and enables printing only after the frame is ready', fakeAsync(() => {
    component.setFile('about:blank#zoom=100');
    fixture.detectChanges();
    const frame = fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement;
    expect(frame.loading).toBe('eager');
    expect(component.isLoading).toBeFalse();
    expect(component.isPreviewLoading).toBeTrue();
    frame.dispatchEvent(new Event('load'));
    flushMicrotasks();
    fixture.detectChanges();
    expect(component.isPreviewLoading).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-loading-state')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.file-viewer__action')[1].disabled).toBeFalse();
  }));

  it('does not record a print while preparing or loading the PDF', () => {
    component.printFile();
    component.setFile('about:blank');
    component.printFile();
    http.expectNone('/test-letter/print');
    expect(component.printStarted).toBeFalse();
  });

  it('keeps the existing print tracking once the PDF is ready', fakeAsync(() => {
    spyOn(window, 'setTimeout').and.returnValue(0);
    component.setFile('about:blank');
    component.previewLoaded();
    flushMicrotasks();
    component.printFile();
    const request = http.expectOne('/test-letter/print');
    expect(request.request.body).toEqual({ language: 'sw' });
    request.flush({ statusCode: 200 });
    component.close();
    expect(dialog.close).toHaveBeenCalledWith({ printed: true });
  }));

  it('allows closing the loading viewer without marking the letter printed', () => {
    component.close();
    expect(dialog.close).toHaveBeenCalledWith({ printed: false });
    http.expectNone('/test-letter/print');
  });
});
