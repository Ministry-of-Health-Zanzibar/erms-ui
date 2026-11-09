import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogTitle } from '@angular/material/dialog';

let nextFormHeaderId = 0;

@Component({
  selector: 'app-form-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogTitle],
  templateUrl: './form-header.component.html',
  styleUrl: './form-header.component.scss',
})
export class FormHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() titleId = `ui-form-title-${nextFormHeaderId++}`;
  @Input() description = '';
  @Input() icon = 'edit_note';
  @Input() closable = false;
  @Input() closeLabel = 'Close form';
  @Input() closeDisabled = false;

  @Output() closed = new EventEmitter<void>();
}
