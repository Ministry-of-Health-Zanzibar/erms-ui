import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { of } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { PartientService } from '../../../services/partient/partient.service';
import { LocationService } from '../../../services/system-configuration/location.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { DiagnosisService } from '../../../services/system-configuration/diagnosis.service';
import { PartientFormComponent } from './partient-form.component';

describe('PartientFormComponent', () => {
  let component: PartientFormComponent;
  let fixture: ComponentFixture<PartientFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartientFormComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: FeedbackService, useValue: { fire: jasmine.createSpy('fire') } },
        { provide: PartientService, useValue: {} },
        { provide: LocationService, useValue: { getLocation: () => of({ data: [] }) } },
        { provide: ReasonsService, useValue: { getAllReasons: () => of({ data: [] }) } },
        { provide: DiagnosisService, useValue: { searchDiagnosis: () => of({ data: [] }) } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartientFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function footerButton(text: string): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('.ui-form-dialog__actions button')]
      .find((button: HTMLButtonElement) => button.textContent!.includes(text));
  }

  it('shows card and ID format guidance only after invalid fields have been touched', fakeAsync(() => {
    const card = component.patientForm.get('basicInfo.matibabu_card')!;
    const id = component.patientForm.get('basicInfo.zan_id')!;
    const cardField = fixture.nativeElement.querySelector('input[formcontrolname="matibabu_card"]').closest('mat-form-field');
    const idField = fixture.nativeElement.querySelector('input[formcontrolname="zan_id"]').closest('mat-form-field');
    const message = (field: HTMLElement) => field.querySelector('mat-error')?.textContent || '';
    expect(message(cardField)).toBe('');
    expect(message(idField)).toBe('');

    card.setValue('1234', { emitEvent: false }); card.markAsTouched();
    id.setValue('1234567', { emitEvent: false }); id.markAsTouched();
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(message(cardField)).toContain('Use the 12-digit card number when available.');
    expect(message(idField)).toContain('This ID is Mandatory');
    expect(id.hasError('pattern')).toBeTrue();

    card.setValue('123456789012', { emitEvent: false });
    id.setValue('12345678', { emitEvent: false });
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(card.valid).toBeTrue(); expect(id.valid).toBeTrue();
    expect(message(cardField)).toBe(''); expect(message(idField)).toBe('');
    id.setValue('123456789', { emitEvent: false });
    expect(id.valid).toBeTrue();
    id.setValue('ABCDEFGH', { emitEvent: false });
    expect(id.hasError('pattern')).toBeTrue();
    card.setValue('', { emitEvent: false }); id.setValue('', { emitEvent: false });
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(message(cardField)).toContain('Matibabu card number is required.');
    expect(message(idField)).toContain('This ID is Mandatory');
    flush();
  }));

  it('keeps the shared header and footer outside the scrolling form body', fakeAsync(() => {
    fixture.nativeElement.style.height = '480px';
    fixture.nativeElement.style.width = '900px';
    fixture.nativeElement.querySelector('.patient-dialog').style.maxHeight = '480px';
    fixture.detectChanges(); flush(); fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('app-form-header');
    const body = fixture.nativeElement.querySelector('.ui-form-dialog__body');
    const footer = fixture.nativeElement.querySelector('.ui-form-dialog__actions');
    expect(body.contains(header)).toBeFalse();
    expect(body.contains(footer)).toBeFalse();
    expect(footer.closest('form')).toBeTruthy();
    expect(footer.textContent).toContain('Step 1 of 3');
    expect(footerButton('Cancel')).toBeTruthy();
    expect(footerButton('Continue to medical history')).toBeTruthy();
    const footerTop = footer.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    expect(footer.getBoundingClientRect().top).toBe(footerTop);
    expect(body.getBoundingClientRect().bottom).toBeLessThanOrEqual(footerTop + 1);
    expect(fixture.nativeElement.querySelector('.patient-dialog').getBoundingClientRect().height).toBeLessThanOrEqual(480);
    flush();
  }));

  it('preserves linear validation and adjusts height as Back/Continue changes the active step', fakeAsync(() => {
    const stepper = fixture.debugElement.query(By.directive(MatStepper)).componentInstance as MatStepper;
    footerButton('Continue to medical history').click(); fixture.detectChanges(); flush();
    expect(stepper.selectedIndex).toBe(0);

    component.patientForm.get('basicInfo')!.patchValue({
      name: 'Ali Juma', matibabu_card: '123456789012', zan_id: '123456789',
      date_of_birth: new Date(1990, 0, 1), gender: 'Male', phone: '0777000000', location_id: 1,
    }, { emitEvent: false });
    fixture.detectChanges();
    footerButton('Continue to medical history').click(); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(stepper.selectedIndex).toBe(1);
    footerButton('Continue to coverage').click(); fixture.detectChanges(); flush();
    expect(stepper.selectedIndex).toBe(1);

    component.patientForm.get('historyInfo')!.patchValue({
      file_number: 'A-1', referring_date: new Date(), reason_id: 1, diagnosis_ids: [1],
      history_of_presenting_illness: 'History', physical_findings: 'Findings',
      investigations: 'Investigations', management_done: 'Management',
    }, { emitEvent: false });
    fixture.detectChanges();
    const historyHeight = fixture.nativeElement.querySelector('.patient-dialog').getBoundingClientRect().height;
    footerButton('Continue to coverage').click(); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(stepper.selectedIndex).toBe(2);
    expect(fixture.nativeElement.querySelector('.patient-dialog').getBoundingClientRect().height).toBeLessThan(historyHeight);
    expect(footerButton('Save patient').disabled).toBeFalse();
    const submit = spyOn(component, 'onSubmit');
    footerButton('Save patient').click(); fixture.detectChanges(); flush();
    expect(submit).toHaveBeenCalledTimes(1);
    footerButton('Back').click(); fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(stepper.selectedIndex).toBe(1);
    const restoredHeight = fixture.nativeElement.querySelector('.patient-dialog').getBoundingClientRect().height;
    expect(Math.abs(restoredHeight - historyHeight)).toBeLessThan(2);
    flush();
  }));
});
