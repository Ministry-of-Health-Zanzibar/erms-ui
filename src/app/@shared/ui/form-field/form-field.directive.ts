import {
  AfterContentChecked, ContentChild, ContentChildren, Directive, ElementRef,
  inject, Input, OnDestroy, QueryList, Renderer2,
} from '@angular/core';
import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatError, MatFormFieldControl } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatChipGrid } from '@angular/material/chips';
import { fieldValidationMessage } from './validation-message';

let nextFieldId = 0;

/** Shared appearance and below-field validation, retaining Material's original control structure. */
@Directive({
  selector: 'mat-form-field[appFormField]',
  standalone: true,
  host: { class: 'ui-form-field' },
  providers: [{
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
  }],
})
export class FormFieldDirective implements AfterContentChecked, OnDestroy {
  @Input() fieldControl: AbstractControl | null = null;
  @Input() fieldInvalid = false;
  @Input() fieldLabel = '';
  @Input() fieldErrorId = '';
  @Input() fieldHintId = '';

  @ContentChild(MatFormFieldControl) private inputControl?: MatFormFieldControl<unknown>;
  @ContentChildren(MatError, { descendants: true }) private customErrors!: QueryList<MatError>;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly parentForm = inject(FormGroupDirective, { optional: true, skipSelf: true });
  private readonly parentNgForm = inject(NgForm, { optional: true, skipSelf: true });
  private readonly errorId = `ui-field-error-${nextFieldId++}`;
  private readonly feedbackIds = new Set([this.errorId]);
  private errorElement?: HTMLElement;
  private originalMatcher?: ErrorStateMatcher;
  private readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => this.showError };

  get effectiveControl(): AbstractControl | null {
    return this.fieldControl ?? this.inputControl?.ngControl?.control ?? null;
  }

  get showError(): boolean {
    const control = this.effectiveControl;
    if (control?.disabled) return false;
    const interacted = !control || control.touched || this.parentForm?.submitted || this.parentNgForm?.submitted;
    return !!interacted && (this.fieldInvalid || (control ? control.invalid : !!this.customErrors?.length));
  }

  ngAfterContentChecked(): void {
    const input = this.inputControl;
    if (input instanceof MatInput || input instanceof MatSelect || input instanceof MatChipGrid) {
      this.originalMatcher ??= input.errorStateMatcher;
      input.errorStateMatcher = this.errorMatcher;
      input.updateErrorState();
    }

    const fallbackVisible = this.showError && !this.fieldErrorId && !this.customErrors?.length;
    if (fallbackVisible && !this.errorElement) {
      this.errorElement = this.renderer.createElement('div');
      this.renderer.addClass(this.errorElement, 'ui-form-field__error');
      this.renderer.setAttribute(this.errorElement, 'id', this.errorId);
      this.renderer.setAttribute(this.errorElement, 'aria-live', 'polite');
      this.renderer.appendChild(this.element.nativeElement, this.errorElement);
    }
    if (this.errorElement) {
      const label = this.fieldLabel || this.element.nativeElement.querySelector('mat-label')?.textContent || 'This field';
      this.renderer.setProperty(this.errorElement, 'textContent', fieldValidationMessage(this.effectiveControl?.errors ?? null, label));
      this.renderer.setProperty(this.errorElement, 'hidden', !fallbackVisible);
    }
    fallbackVisible
      ? this.renderer.addClass(this.element.nativeElement, 'ui-form-field--fallback-error')
      : this.renderer.removeClass(this.element.nativeElement, 'ui-form-field--fallback-error');
    this.showError && this.fieldErrorId
      ? this.renderer.addClass(this.element.nativeElement, 'ui-form-field--external-error')
      : this.renderer.removeClass(this.element.nativeElement, 'ui-form-field--external-error');

    if (input instanceof MatInput || input instanceof MatSelect) {
      const ids = new Set((input.userAriaDescribedBy || '').split(/\s+/).filter(Boolean));
      if (this.fieldErrorId) this.feedbackIds.add(this.fieldErrorId);
      if (this.fieldHintId) this.feedbackIds.add(this.fieldHintId);
      this.feedbackIds.forEach((id) => ids.delete(id));
      if (fallbackVisible) ids.add(this.errorId);
      if (this.showError && this.fieldErrorId) ids.add(this.fieldErrorId);
      if (!this.showError && this.fieldHintId) ids.add(this.fieldHintId);
      const describedBy = [...ids].join(' ');
      if (input.userAriaDescribedBy !== describedBy) {
        input.userAriaDescribedBy = describedBy;
        input.stateChanges.next();
      }
    }
  }

  ngOnDestroy(): void {
    const input = this.inputControl;
    if ((input instanceof MatInput || input instanceof MatSelect || input instanceof MatChipGrid) && this.originalMatcher) {
      input.errorStateMatcher = this.originalMatcher;
    }
    if (this.errorElement) this.renderer.removeChild(this.element.nativeElement, this.errorElement);
  }
}
