# Shared form fields

Use `FormHeaderComponent` for the form heading and the shared `TextInputComponent`,
`FilterSelectComponent`, `DatePickerComponent`, or `TextAreaComponent` for simple fields.
They use the host form control to show required markers and validation directly below
the field after it is touched or the form is submitted. Existing validators, value
types, and change handlers remain owned by the form.

```html
<app-text-input label="Name" formControlName="name">
  <mat-error *ngIf="form.controls.name.hasError('pattern')">
    Use alphabetical characters only.
  </mat-error>
</app-text-input>
```

Optional `mat-error` and `mat-hint` content is displayed by the shared feedback
component. When there is no custom error, common Angular validators receive a
standard message. Error and hint IDs are linked to the input for assistive tools.

For fields with existing Material bindings, autocomplete, chips, file triggers,
or custom option templates, import `FormFieldDirective` and add `appFormField`:

```html
<mat-form-field appFormField>
  <mat-label>Hospital</mat-label>
  <mat-select appSearchableSelect formControlName="hospital_id">
    <mat-option *ngFor="let hospital of hospitals" [value]="hospital.hospital_id">
      {{ hospital.hospital_name }}
    </mat-option>
  </mat-select>
</mat-form-field>
```

The shared defaults are outlined fields and dynamically sized feedback so messages
can wrap. Explicit Material field inputs still take precedence. Input heights use
the existing global `--rms-field-height` token.

Use `[fieldControl]="form.get('location_id')"` when the visible input is a search
control but validation belongs to a selected ID. Use `[fieldInvalid]` to reflect an
existing group validator, such as password confirmation. Keep the existing error
message in these cases. Native file pickers and checkbox/radio controls retain their
specialized interfaces.
