import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type UiButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'danger'
  | 'outline'
  | 'text';

export type UiButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() iconPosition: 'start' | 'end' = 'start';
  @Input() type: UiButtonType = 'button';
  @Input() variant: UiButtonVariant = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() ariaLabel = '';

  @Output() readonly pressed = new EventEmitter<MouseEvent>();
}
