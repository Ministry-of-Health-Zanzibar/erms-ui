import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-boarded-out-letter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './boarded-out-letter.component.html',
  styleUrls: ['./boarded-out-letter.component.scss']
})
export class BoardedOutLetterComponent {
email = 'info@mohz.go.tz'
  constructor(
    @Inject(MAT_DIALOG_DATA) public referral: any
  ) {}

  async print(): Promise<void> {
    const printContents = document.getElementById('print-section')?.outerHTML;
    if (printContents) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;

      const images = Array.from(document.body.querySelectorAll('img'));
      await Promise.all(images.map(image =>
        image.complete
          ? image.decode().catch(() => undefined)
          : new Promise<void>(resolve => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            })
      ));

      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  }
}
