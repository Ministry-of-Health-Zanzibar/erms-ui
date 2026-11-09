import { Component, inject, Input } from '@angular/core';
import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import { fieldValidationMessage } from './validation-message';

let nextFeedbackId = 0;

/** Feedback below shared value accessors, including messages projected by their callers. */
@Component({
  selector: 'app-field-feedback',
  standalone: true,
  styles: [':host { display: block; min-width: 0; width: 100%; }'],
  template: `
    <div class="ui-form-field__hint" [id]="hintId" [hidden]="showError || !hasHints">
      <ng-content select="[uiFieldHints]" />
    </div>
    <div class="ui-form-field__error" [id]="errorId" [hidden]="!showError" aria-live="polite">
      <ng-content select="[uiFieldErrors]" />
      @if (!hasCustomErrors && showError) { <span>{{ message }}</span> }
    </div>
  `,
})
export class FieldFeedbackComponent {
  @Input() control: AbstractControl | null = null;
  @Input() label = '';
  @Input() hasCustomErrors = false;
  @Input() hasHints = false;
  private readonly parentForm = inject(FormGroupDirective, { optional: true, skipSelf: true });
  private readonly parentNgForm = inject(NgForm, { optional: true, skipSelf: true });
  readonly errorId = `ui-feedback-error-${nextFeedbackId++}`;
  readonly hintId = `${this.errorId}-hint`;

  get showError(): boolean {
    if (this.control?.disabled) return false;
    const interacted = !this.control || this.control.touched || this.parentForm?.submitted || this.parentNgForm?.submitted;
    return !!interacted && (this.control ? this.control.invalid : this.hasCustomErrors);
  }

  get message(): string {
    return fieldValidationMessage(this.control?.errors ?? null, this.label);
  }
}
