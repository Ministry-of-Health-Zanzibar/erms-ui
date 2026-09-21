import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReferralService } from '../../../services/Referral/referral.service';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import html2pdf from 'html2pdf.js';
import { MatTableModule } from '@angular/material/table';
import { LoadingStateComponent } from '@shared/ui';

@Component({
  selector: 'app-individualreport',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIcon,
    MatTableModule,
    LoadingStateComponent
  ],
  templateUrl: './individualreport.component.html',
  styleUrl: './individualreport.component.scss'
})
export class IndividualreportComponent implements OnInit {

  referral: any;
  isLoading = true;
  email="info@mohz.go.tz";

  constructor(
    private route: ActivatedRoute,
    private referralService: ReferralService
  ) {}

  ngOnInit(): void {
    const referralId = this.route.snapshot.paramMap.get('id');
    // console.log("naipata hapa    ....",referralId)
    this.getReferralDetails(referralId);
  }

  getReferralDetails(id: any) {
    this.referralService.getReportById(id).subscribe({
      next: (res: any) => {
        this.referral = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

 printReport() {
  window.print();
}

downloadReport() {
  const element = document.getElementById('print-area');

  if (!element) {
    return;
  }

 const options = {
  margin: 0.5,
  filename: `Referral_Report_${this.referral?.referral_number}.pdf`,
  image: {
    type: 'jpeg',
    quality: 0.98
  },
  html2canvas: {
    scale: 2,
    useCORS: true
  },
  jsPDF: {
    unit: 'in',
    format: 'a4',
    orientation: 'portrait'
  }
} as const;

html2pdf().from(element).set(options).save();

}

getTotalBillAmount(): number {
  if (!this.referral?.bills?.length) return 0;

  return this.referral.bills.reduce((sum: number, bill: any) => {
    return sum + Number(bill.total_amount || 0);
  }, 0);
}

getTotalPaidAmount(): number {
  if (!this.referral?.bills?.length) return 0;

  return this.referral.bills.reduce((sum: number, bill: any) => {
    const billPaymentsTotal = (bill.payments || []).reduce(
      (pSum: number, p: any) =>
        pSum + Number(p.pivot?.allocated_amount || p.amount_paid || 0),
      0
    );
    return sum + billPaymentsTotal;
  }, 0);
}

getRemainingAmount(): number {
  return this.getTotalBillAmount() - this.getTotalPaidAmount();
}


}
