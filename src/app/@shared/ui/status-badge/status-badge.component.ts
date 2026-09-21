import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type StatusTone =
  | 'neutral'
  | 'info'
  | 'warning'
  | 'success'
  | 'danger';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  @Input() status: string | null | undefined;
  @Input() tone: StatusTone | 'auto' = 'auto';

  get label(): string {
    return this.status?.trim() || 'N/A';
  }

  get resolvedTone(): StatusTone {
    if (this.tone !== 'auto') {
      return this.tone;
    }

    const value = this.label.toLowerCase();

    if (['approved', 'assigned', 'boardedout', 'confirmed', 'completed', 'paid', 'active'].some(status => value.includes(status))) {
      return 'success';
    }

    if (['rejected', 'cancelled', 'closed', 'deleted', 'failed', 'denied'].some(status => value.includes(status))) {
      return 'danger';
    }

    if (['pending', 'reviewed', 'partially paid'].some(status => value.includes(status))) {
      return 'warning';
    }

    if (['requested', 'transferred', 'ongoing', 'in progress'].some(status => value.includes(status))) {
      return 'info';
    }

    return 'neutral';
  }
}
