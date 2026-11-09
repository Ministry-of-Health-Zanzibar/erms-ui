import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { FilterSelectComponent } from './filter-select.component';
import { SearchableSelectDirective } from './searchable-select.directive';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, SearchableSelectDirective, FilterSelectComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submissions = submissions + 1">
      <mat-form-field>
        <mat-label>Hospital</mat-label>
        <mat-select appSearchableSelect formControlName="single" [selectSearchRemote]="remote"
          (selectSearchChange)="searches.push($event)" (selectionChange)="changes.push($event.value)">
          <mat-option *ngFor="let item of items" [value]="item.value" [disabled]="item.disabled">{{ item.label }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Members</mat-label>
        <mat-select appSearchableSelect multiple formControlName="multiple">
          <mat-option *ngFor="let item of items" [value]="item.value">{{ item.label }}</mat-option>
        </mat-select>
      </mat-form-field>
      <app-filter-select formControlName="shared" label="Patients" [multiple]="true" [options]="sharedOptions" />
    </form>
  `,
})
class SearchHostComponent {
  items = [
    { value: 1, label: 'Alpha hospital', disabled: false },
    { value: 2, label: 'Beta hospital', disabled: false },
    { value: 3, label: 'Gamma hospital', disabled: true },
  ];
  sharedOptions = [{ label: 'Alpha patient', value: 1 }, { label: 'Beta patient', value: 2 }];
  form = new FormGroup({
    single: new FormControl<number | null>(1),
    multiple: new FormControl<number[]>([1]),
    shared: new FormControl<number[]>([1]),
  });
  remote = false;
  searches: string[] = [];
  changes: number[] = [];
  submissions = 0;
}

describe('Searchable dropdowns', () => {
  let fixture: ComponentFixture<SearchHostComponent>;
  let host: SearchHostComponent;
  let overlay: HTMLElement;
  let selects: MatSelect[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SearchHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    selects = fixture.debugElement.queryAll(By.directive(MatSelect)).map((element) => element.componentInstance);
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  function open(index = 0): HTMLInputElement {
    selects[index].open();
    fixture.detectChanges(); flush(); fixture.detectChanges();
    return overlay.querySelector('.ui-select-search input') as HTMLInputElement;
  }

  function search(input: HTMLInputElement, term: string): void {
    input.value = term;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges(); flush(); fixture.detectChanges();
  }

  function visibleValues(index = 0): unknown[] {
    return selects[index].options.filter((option) =>
      !document.getElementById(option.id)?.classList.contains('ui-select-search-hidden')).map((option) => option.value);
  }

  function choose(value: number, index = 0): void {
    const option = selects[index].options.find((option) => option.value === value)!;
    document.getElementById(option.id)!.click();
    fixture.detectChanges(); flush(); fixture.detectChanges();
  }

  it('focuses the labelled search field and filters without changing a selected ID or emitting selection changes', fakeAsync(() => {
    const input = open();
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-label')).toBe('Search Hospital');
    search(input, ' BETA ');
    expect(visibleValues()).toEqual([2]);
    expect(host.form.controls.single.value).toBe(1);
    expect(host.form.controls.single.pristine).toBeTrue();
    expect(host.changes).toEqual([]);
    choose(2);
    expect(host.form.controls.single.value).toBe(2);
    expect(host.changes).toEqual([2]);
  }));

  it('preserves checked values across searches and when selecting an additional result', fakeAsync(() => {
    const input = open(1);
    search(input, 'Beta');
    expect(host.form.controls.multiple.value).toEqual([1]);
    choose(2, 1);
    expect(host.form.controls.multiple.value).toEqual([1, 2]);
    search(input, 'Alpha');
    expect(host.form.controls.multiple.value).toEqual([1, 2]);
    selects[1].close(); fixture.detectChanges(); flush();
    open(1);
    expect(visibleValues(1)).toEqual([1, 2, 3]);
    expect(host.form.controls.multiple.value).toEqual([1, 2]);
  }));

  it('uses the same selection-preserving behaviour in the shared multi-select component', fakeAsync(() => {
    const input = open(2);
    search(input, 'Beta');
    expect(host.form.controls.shared.value).toEqual([1]);
    choose(2, 2);
    expect(host.form.controls.shared.value).toEqual([1, 2]);
    expect(selects[2].options.length).toBe(2);
  }));

  it('keeps disabled options disabled after filtering and clearing a query', fakeAsync(() => {
    const input = open();
    search(input, 'Beta'); search(input, '');
    expect(selects[0].options.find((option) => option.value === 3)!.disabled).toBeTrue();
    choose(3);
    expect(host.form.controls.single.value).toBe(1);
    expect(host.changes).toEqual([]);
  }));

  it('filters newly loaded options using the active query without clearing an existing selection', fakeAsync(() => {
    const input = open(); search(input, 'Beta');
    host.items = [...host.items, { value: 4, label: 'Beta clinic', disabled: false }, { value: 5, label: 'Other clinic', disabled: false }];
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(visibleValues()).toEqual([2, 4]);
    expect(host.form.controls.single.value).toBe(1);
  }));

  it('forwards server searches without hiding results whose names differ from the queried phone or card', fakeAsync(() => {
    host.remote = true; fixture.detectChanges();
    const input = open(); search(input, 'CARD-123');
    expect(host.searches).toEqual(['CARD-123']);
    expect(visibleValues()).toEqual([1, 2, 3]);
    host.items = [host.items[0], { value: 4, label: 'Matched by card number', disabled: false }];
    fixture.detectChanges(); flush(); fixture.detectChanges();
    expect(visibleValues()).toEqual([1, 4]);
    expect(host.form.controls.single.value).toBe(1);
    selects[0].close(); fixture.detectChanges(); flush();
    open();
    expect(host.searches).toEqual(['CARD-123', '']);
  }));

  it('navigates only matching results and does not submit the form when Enter is used in search', fakeAsync(() => {
    const input = open(); search(input, 'Beta');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    expect(host.form.controls.single.value).toBe(1);
    expect(host.submissions).toBe(0);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true }));
    expect(selects[0]._keyManager.activeItem?.value).toBe(2);
    const element = fixture.debugElement.query(By.directive(MatSelect)).nativeElement;
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    fixture.detectChanges(); flush();
    expect(host.form.controls.single.value).toBe(2);
  }));

  it('reports no matches and Escape closes the panel while preserving the value', fakeAsync(() => {
    const input = open(); search(input, 'No such hospital');
    expect(visibleValues()).toEqual([]);
    expect((overlay.querySelector('.ui-select-search__empty') as HTMLElement).hidden).toBeFalse();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
    fixture.detectChanges(); flush();
    expect(selects[0].panelOpen).toBeFalse();
    expect(host.form.controls.single.value).toBe(1);
  }));

  it('keeps normal arrow-key selection working after a search is dismissed', fakeAsync(() => {
    const input = open(); search(input, 'Beta');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
    fixture.detectChanges(); flush();
    expect(host.changes).toEqual([]);
    const element = fixture.debugElement.query(By.directive(MatSelect)).nativeElement;
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true }));
    fixture.detectChanges(); flush();
    expect(host.form.controls.single.value).toBe(2);
    expect(host.changes).toEqual([2]);
  }));
});
