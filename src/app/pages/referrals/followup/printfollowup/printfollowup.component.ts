import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import Swal from 'sweetalert2';
import { FollowsService } from '../../../../services/Referral/follows.service';
import { ReferralService } from '../../../../services/Referral/referral.service';

@Component({
  selector: 'app-printfollowup',
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
  templateUrl: './printfollowup.component.html',
  styleUrls: ['./printfollowup.component.scss']
})
export class PrintfollowupComponent implements OnInit {
  referralID: string | null = null;
  referral: any = null;

  email = 'info@mohz.go.tz';
  dg = 'dg@mohz.go.tz';

  calculateAge(dob: string) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  // Adjust days
  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  // Adjust months
  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

formatAge(ageDetails: any): string {
  if (!ageDetails) return 'N/A';

  const { years, months, days } = ageDetails;

  if (years > 0) {
    return `MIAKA ${years}`;
  }

  if (months > 0) {
    return `MIEZI ${months}`;
  }

  return `SIKU ${days}`;
}

  constructor(
    private printService: FollowsService,
    private referralsService: ReferralService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
  //  console.log("Injected dialog data:", this.data);
   this.referral = this.data;
   }

 

  getReferralData(): void {
  this.referralsService.getReferralById(this.referralID!).subscribe(
    (response: any) => {
      // console.log('API response:', response);

      this.referral = response.data;

      // ✅ Set hospital
      if (this.referral?.hospitals?.length > 0) {
        this.referral.hospital = this.referral.hospitals[0];
      }

      // ✅ Calculate age from DOB
      const dob = this.referral?.patient?.date_of_birth;
      this.referral.patient.ageDetails = this.calculateAge(dob);

      // console.log('Referral hospital:', this.referral.hospital);
    },
    error => {
      console.error('Failed to load referral data:', error);
      Swal.fire('Error', 'Unable to fetch referral data', 'error');
    }
  );
}


   async print(): Promise<void> {
     const printContents = document.getElementById('print-section')?.innerHTML;
     if (printContents) {
       const originalContents = document.body.innerHTML;
       document.body.innerHTML = printContents;

       // Ensure images are decoded before the browser creates the print preview.
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
