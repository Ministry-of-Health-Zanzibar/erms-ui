import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { FilterSelectComponent } from '@shared/ui';
import { PermissionService } from '../../../services/authentication/permission.service';
import { PartientService } from '../../../services/partient/partient.service';
import { PatienthistoryService } from '../../../services/partient/patienthistory.service';
import { ViewpatientfromhospitalComponent } from './viewpatientfromhospital.component';

describe('ViewpatientfromhospitalComponent', () => {
  let component: ViewpatientfromhospitalComponent;
  let fixture: ComponentFixture<ViewpatientfromhospitalComponent>;
  let getHistories: jasmine.Spy;
  const patients = [
    { patient_id: 1, name: 'Patient A', latest_history: { status: 'reviewed' } },
    { patient_id: 2, name: 'Patient B', latest_history: { status: 'approved' } },
  ];

  beforeEach(async () => {
    getHistories = jasmine.createSpy('getAllBodyList').and.callFake((options) => {
      const data = patients.filter(patient => !options.status || patient.latest_history.status === options.status);
      return of({ data, meta: { total: data.length } });
    });
    await TestBed.configureTestingModule({
      imports: [ViewpatientfromhospitalComponent, NoopAnimationsModule],
      providers: [
        { provide: PermissionService, useValue: { parmissionMatched: () => true } },
        { provide: PartientService, useValue: {} },
        { provide: PatienthistoryService, useValue: { getAllBodyList: getHistories } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: FeedbackService, useValue: { fire: jasmine.createSpy('fire') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewpatientfromhospitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('filters by status from the searchable dropdown and restores all records when cleared', fakeAsync(() => {
    component.currentPage = 3;
    const dropdown = fixture.debugElement.query(By.directive(FilterSelectComponent));
    const select = dropdown.query(By.directive(MatSelect)).componentInstance as MatSelect;
    select.open(); fixture.detectChanges(); flush(); fixture.detectChanges();
    const search = document.querySelector('.ui-select-search input') as HTMLInputElement;
    expect(search).toBeTruthy();
    search.value = 'DCS'; search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges(); flush(); fixture.detectChanges();
    document.getElementById(select.options.find(option => option.value === 'approved')!.id)!.click();
    fixture.detectChanges(); flush(); fixture.detectChanges();

    expect(component.statusFilter).toBe('approved');
    expect(component.currentPage).toBe(1);
    expect(getHistories.calls.mostRecent().args[0]).toEqual({ page: 1, per_page: 10, search: '', status: 'approved' });
    expect(component.dataSource.data).toEqual([patients[1]]);
    expect(fixture.nativeElement.querySelector('table').textContent).toContain('Patient B');
    expect(fixture.nativeElement.querySelector('table').textContent).not.toContain('Patient A');

    (dropdown.nativeElement.querySelector('.ui-filter-select__clear') as HTMLButtonElement).click();
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(component.statusFilter).toBe('');
    expect(getHistories.calls.mostRecent().args[0].status).toBe('');
    expect(component.dataSource.data).toEqual(patients);
    flush();
  }));

  it('combines debounced search with the active status and resets pagination', fakeAsync(() => {
    component.onStatusChange('reviewed');
    component.currentPage = 4;
    getHistories.calls.reset();
    component.applyFilter({ target: { value: ' Ali ' } } as unknown as Event);
    tick(299); expect(getHistories).not.toHaveBeenCalled();
    tick(1);
    expect(getHistories.calls.mostRecent().args[0]).toEqual({ page: 1, per_page: 10, search: 'Ali', status: 'reviewed' });
    flush();
  }));

  it('retains search and status when changing pages or refreshing and explains empty filtered results', fakeAsync(() => {
    component.searchTerm = 'Ali';
    component.onStatusChange('requested');
    component.pageChanged({ pageIndex: 2, pageSize: 25, length: 80, previousPageIndex: 0 });
    expect(getHistories.calls.mostRecent().args[0]).toEqual({ page: 3, per_page: 25, search: 'Ali', status: 'requested' });
    component.renew();
    expect(getHistories.calls.mostRecent().args[0]).toEqual({ page: 1, per_page: 25, search: 'Ali', status: 'requested' });
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No patients match your filters.');
    flush();
  }));

  it('keeps the latest selected status results when an earlier request finishes later', () => {
    const earlier = new Subject<any>();
    const latest = new Subject<any>();
    getHistories.and.returnValues(earlier.asObservable(), latest.asObservable());
    component.onStatusChange('approved');
    component.onStatusChange('reviewed');
    latest.next({ data: [patients[0]], meta: { total: 1 } });
    earlier.next({ data: [patients[1]], meta: { total: 1 } });
    expect(component.dataSource.data).toEqual([patients[0]]);
    expect(component.totalItems).toBe(1);
    expect(component.statusFilter).toBe('reviewed');
    expect(component.loading).toBeFalse();
  });
});
