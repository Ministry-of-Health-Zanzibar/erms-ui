# Shared form headers

Import `FormHeaderComponent` from `@shared/ui` in the standalone component's imports.
Use one header for each data-entry form or workflow dialog. Keep the existing
page header for navigation and use the form header inside the form's card.

```html
<div class="ui-form-dialog">
  <app-form-header
    eyebrow="Medical board session"
    title="Add patients"
    description="Select patients for this board session."
    icon="group_add"
    [closable]="true"
    [closeDisabled]="saving"
    (closed)="close()"
  />

  <div class="ui-form-dialog__body">
    <!-- Existing fields and validation -->
  </div>

  <mat-dialog-actions class="ui-form-dialog__actions" align="end">
    <!-- Existing cancel and submit actions -->
  </mat-dialog-actions>
</div>
```

The shared layout is included by `src/styles.scss`. It provides a scrolling
body, responsive field rows, theme-aware surfaces, and an action footer.

Inputs: `eyebrow`, `title`, `description`, `icon`, `titleId`, `closable`,
`closeLabel`, and `closeDisabled`. The optional `titleId` preserves existing
`aria-labelledby` references. Otherwise the heading receives a unique ID.
The title also labels Material dialogs automatically.

Project existing badges or actions with `uiFormHeaderActions`:

```html
<app-form-header title="Patient record" icon="person_add">
  <span uiFormHeaderActions class="ui-form-header__badge">3-step workflow</span>
</app-form-header>
```

For an embedded form in a section card, use the same header through the card:

```html
<app-section-card
  [formHeader]="true"
  eyebrow="My account"
  title="Personal information"
  description="Keep your contact details up to date."
  icon="person"
>
  <!-- Form contents -->
</app-section-card>
```
