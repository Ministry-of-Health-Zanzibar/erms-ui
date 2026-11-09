import { ValidationErrors } from '@angular/forms';

export function fieldValidationMessage(errors: ValidationErrors | null, label = 'This field'): string {
  if (!errors) return '';
  const name = label.trim().replace(/[:*]+$/, '').trim() || 'This field';
  if (errors['matDatepickerParse']) return 'Enter a valid date.';
  if (errors['required']) return `${name} is required.`;
  if (errors['email']) return 'Enter a valid email address.';
  if (errors['minlength']) return `Enter at least ${errors['minlength'].requiredLength} characters.`;
  if (errors['maxlength']) return `Use ${errors['maxlength'].requiredLength} characters or fewer.`;
  if (errors['min']) return `Enter a value of ${errors['min'].min} or more.`;
  if (errors['max']) return `Enter a value of ${errors['max'].max} or less.`;
  if (errors['matDatepickerMin']) return 'Choose a date on or after the minimum date.';
  if (errors['matDatepickerMax']) return 'Choose a date on or before the maximum date.';
  if (errors['matDatepickerFilter']) return 'Choose an available date.';
  if (errors['pattern']) return `Enter a valid ${name.toLowerCase()}.`;
  if (typeof errors['server'] === 'string') return errors['server'];
  return `Check ${name.toLowerCase()} and try again.`;
}
