import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export type IconActionTone = 'neutral' | 'primary' | 'success' | 'danger';

@Component({
  selector: 'app-icon-action',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './icon-action.component.html',
  styleUrl: './icon-action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconActionComponent {
  @Input({ required: true }) icon = '';
  @Input({ required: true }) label = '';
  @Input() tone: IconActionTone = 'neutral';
  @Input() disabled = false;
  @Output() readonly action = new EventEmitter<void>();
}
