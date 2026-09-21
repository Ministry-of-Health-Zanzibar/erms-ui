import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-table-toolbar',
  standalone: true,
  templateUrl: './table-toolbar.component.html',
  styleUrl: './table-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableToolbarComponent {}
