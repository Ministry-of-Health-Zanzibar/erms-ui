import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { DiagnosisService } from '../../../services/system-configuration/diagnosis.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { MedicalhistoryService } from '../../../services/partient/medicalhistory.service';
import { AddmedicalformComponent } from './addmedicalform.component';

describe('AddmedicalformComponent', () => {
  let component: AddmedicalformComponent;
  let fixture: ComponentFixture<AddmedicalformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddmedicalformComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {
          mode: 'edit', patient: { name: 'Ali Juma', latest_history: { patient_histories_id: 1 } },
        } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: FeedbackService, useValue: { fire: jasmine.createSpy('fire') } },
        { provide: DiagnosisService, useValue: { searchDiagnosis: () => of({ data: [] }) } },
        { provide: ReasonsService, useValue: { getAllReasons: () => of({ data: [] }) } },
        { provide: MedicalhistoryService, useValue: {} },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddmedicalformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps the assessment footer visible while its contents scroll', fakeAsync(() => {
    fixture.nativeElement.style.height = '480px';
    fixture.nativeElement.style.width = '900px';
    fixture.detectChanges(); flush(); fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.ui-form-dialog__body');
    const footer = fixture.nativeElement.querySelector('.ui-form-dialog__actions');
    expect(fixture.nativeElement.querySelector('app-form-header').textContent).toContain('Edit Medical Board information');
    expect(body.contains(footer)).toBeFalse();
    expect(footer.closest('form')).toBeTruthy();
    const footerTop = footer.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    expect(footer.getBoundingClientRect().top).toBe(footerTop);
    expect(body.getBoundingClientRect().bottom).toBeLessThanOrEqual(footerTop + 1);
    flush();
  }));

  it('preserves the existing save and cancel actions in the shared footer', fakeAsync(() => {
    const footer = fixture.nativeElement.querySelector('.ui-form-dialog__actions');
    const save = footer.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(save.disabled).toBeTrue();
    component.medicalForm.patchValue({ board_reason_id: 1, board_comments: 'Assessment', board_diagnosis_ids: [1] });
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(save.disabled).toBeFalse();
    const submit = spyOn(component, 'onSubmit');
    save.click(); fixture.detectChanges(); flush();
    expect(submit).toHaveBeenCalledTimes(1);
    footer.querySelector('button[type="button"]').click();
    expect(TestBed.inject(MatDialogRef).close).toHaveBeenCalledTimes(1);
    flush();
  }));
});
