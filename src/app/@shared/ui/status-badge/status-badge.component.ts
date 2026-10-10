import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { patientHistoryStatusLabel } from '../../utils/patient-history-status';

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
  @Input() context: 'default' | 'patient-history' = 'default';

  get label(): string {
    const value = this.status?.trim() || '';

    if (this.context === 'patient-history') {
      return patientHistoryStatusLabel(value);
    }

    if (value.toLowerCase() === 'boarded_out' || value.toLowerCase() === 'boardedout') {
      return 'Boarded Out';
    }

    return value || 'N/A';
  }

  get resolvedTone(): StatusTone {
    if (this.tone !== 'auto') {
      return this.tone;
    }

    const value = this.status?.trim().toLowerCase() || '';

    if (['approved', 'assigned', 'boardedout', 'boarded_out', 'boarded out', 'confirmed', 'completed', 'paid', 'active'].some(status => value.includes(status))) {
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
