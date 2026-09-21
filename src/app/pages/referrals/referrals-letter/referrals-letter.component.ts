import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReferralService } from '../../../services/Referral/referral.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-referrals-letter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './referrals-letter.component.html',
  styleUrl: './referrals-letter.component.scss'
})
export class ReferralsLetterComponent implements OnInit {
  referralID: string | null = null;
  referral: any = null;



formatAge(ageDetails: any): string {
  if (!ageDetails) return 'N/A';

  const { years, months, days } = ageDetails;

  if (years > 0) {
    return `MIAKA ${years} ${years !== 1 ? '' : ''}`;
  }

  if (months > 0) {
    return `MIEZI ${months} ${months !== 1 ? '' : ''}`;
  }

  return `SIKU ${days} ${days !== 1 ? '' : ''}`;
}


  constructor(
    private referralsService: ReferralService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}


  email = 'info@mohz.go.tz'
  dg = 'dg@mohz.go.tz'
  katibu= 'ps@mohz.go.tz'

  ngOnInit(): void {
    this.referral = this.data;
  
    // ✅ Safety fallback
    if (!this.referral) {
      console.warn('No referral data passed');
    }
  
    // ✅ Ensure boardedOut flag exists
    this.referral.is_boarded_out = !!this.referral?.is_boarded_out;
  }

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
