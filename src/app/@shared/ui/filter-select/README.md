# Searchable dropdowns

For new fields, import `FilterSelectComponent` from `@shared/ui` and bind it
to the existing form control. Search is enabled by default; `multiple` adds
the standard Material checkboxes.

```html
<app-filter-select
  formControlName="hospital_id"
  label="Hospital"
  [options]="hospitals"
  optionLabelKey="hospital_name"
  optionValueKey="hospital_id"
/>
```

For an existing Material select, import `SearchableSelectDirective` and add
`appSearchableSelect`. Keep the original `formControlName`, option values,
`compareWith`, multiple-selection setting, validators, and event handlers.

```html
<mat-select appSearchableSelect formControlName="hospital_id"
  (selectionChange)="onHospitalSelected()">
  <mat-option *ngFor="let hospital of hospitals" [value]="hospital.hospital_id">
    {{ hospital.hospital_name }}
  </mat-option>
</mat-select>
```

Filtering hides nonmatching options without destroying them. This retains
selected values, checked items, and option identity. Searching never emits a
selection event or changes a form value. The search header is separate from
the selectable options and supports Arrow keys, Escape, Tab, and Enter.

For a server search, set `[selectSearchRemote]="true"` on a Material select
and connect `(selectSearchChange)` to the existing debounced search control.
For `app-filter-select`, use `[remoteSearch]="true"` and `(searchChange)`.
Server results are not filtered again by their display names, so a match on
a phone number or card remains visible. Keep a disabled status option when
remote results are empty, so the dropdown can still open for another search.

The shared directive uses the CDK key manager exposed by Material 18 to skip
hidden options while preserving the original disabled states. Its browser
regression tests cover both direct selects and the shared multi-select.
