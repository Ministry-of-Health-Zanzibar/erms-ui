import { AfterContentInit, ChangeDetectorRef, ContentChildren, Directive, DoCheck, inject, Injector, OnDestroy, QueryList } from '@angular/core';
import { AbstractControl, FormGroupDirective, NgControl, NgForm, Validators } from '@angular/forms';
import { MatError, MatHint } from '@angular/material/form-field';
import { Subscription } from 'rxjs';

/** Connects an OnPush value accessor to its parent control's validation events. */
@Directive()
export abstract class FieldControlBridge implements AfterContentInit, DoCheck, OnDestroy {
  @ContentChildren(MatError, { descendants: true }) readonly fieldErrors!: QueryList<MatError>;
  @ContentChildren(MatHint, { descendants: true }) readonly fieldHints!: QueryList<MatHint>;
  protected readonly fieldChangeDetector = inject(ChangeDetectorRef);
  private readonly fieldInjector = inject(Injector);
  private readonly parentForm = inject(FormGroupDirective, { optional: true, skipSelf: true });
  private readonly parentNgForm = inject(NgForm, { optional: true, skipSelf: true });
  private watchedControl: AbstractControl | null = null;
  private validationState = '';
  private controlEvents?: Subscription;
  private readonly contentEvents = new Subscription();

  get fieldControl(): AbstractControl | null {
    // Resolve after construction to avoid the NG_VALUE_ACCESSOR / NgControl cycle.
    return this.fieldInjector.get(NgControl, null, { self: true })?.control ?? null;
  }

  get isFieldRequired(): boolean {
    return !!this.fieldControl?.hasValidator(Validators.required);
  }

  ngAfterContentInit(): void {
    this.contentEvents.add(this.fieldErrors.changes.subscribe(() => this.fieldChangeDetector.markForCheck()));
    this.contentEvents.add(this.fieldHints.changes.subscribe(() => this.fieldChangeDetector.markForCheck()));
  }

  ngDoCheck(): void {
    const control = this.fieldControl;
    if (control !== this.watchedControl) {
      this.controlEvents?.unsubscribe();
      this.watchedControl = control;
      this.controlEvents = control?.events.subscribe(() => this.fieldChangeDetector.markForCheck());
      this.fieldChangeDetector.markForCheck();
    }
    const state = `${control?.status}:${control?.touched}:${this.parentForm?.submitted || this.parentNgForm?.submitted}`;
    if (state !== this.validationState) {
      this.validationState = state;
      this.fieldChangeDetector.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.controlEvents?.unsubscribe();
    this.contentEvents.unsubscribe();
  }
}
