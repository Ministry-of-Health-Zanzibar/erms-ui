import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormHeaderComponent } from '../form-header/form-header.component';

@Component({
  selector: 'app-section-card',
  standalone: true,
  imports: [MatIconModule, FormHeaderComponent],
  templateUrl: './section-card.component.html',
  styleUrl: './section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardComponent {
  @Input() formHeader = false;
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() icon = '';
}
