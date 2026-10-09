import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  SectionCardComponent,
} from '@shared/ui';
import { ReferralService } from '../../../services/Referral/referral.service';

@Component({
  selector: 'app-individualreport',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIcon,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  templateUrl: './individualreport.component.html',
  styleUrl: './individualreport.component.scss',
})
export class IndividualreportComponent implements OnInit {
  referral: any;
  isLoading = true;
  isDownloading = false;
  errorMessage = '';
  downloadError = '';
  email = 'info@mohz.go.tz';

  get primaryHistory(): any {
    return this.referral?.case_history || this.referral?.patient?.patient_histories?.[0];
  }

  constructor(
    private route: ActivatedRoute,
    private referralService: ReferralService,
  ) {}

  ngOnInit(): void {
    this.getReferralDetails(this.route.snapshot.paramMap.get('id'));
  }

  getReferralDetails(id: any): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.referralService.getReportById(id).subscribe({
      next: (res: any) => {
        this.referral = res.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.referral = null;
        this.errorMessage = error?.status === 404
          ? 'This referral report could not be found.'
          : 'Unable to load the referral report. Please try again.';
        this.isLoading = false;
      },
    });
  }

  retryReport(): void {
    this.getReferralDetails(this.route.snapshot.paramMap.get('id'));
  }

  async downloadReport(): Promise<void> {
    const element = document.getElementById('print-area');

    if (!element || this.isDownloading) {
      return;
    }

    this.isDownloading = true;
    this.downloadError = '';

    // Export a separate copy so PDF styles cannot change the on-screen report.
    const report = element.cloneNode(true) as HTMLElement;
    report.classList.add('report--export');

    const options = {
      margin: 12,
      filename: `Referral_Report_${this.referral?.referral_number}.pdf`,
      image: {
        type: 'jpeg',
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1280,
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['tr', '.letter-header', '.signature-section', '.letter-footer'],
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
    } as const;

    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf().from(report).set(options).save();
    } catch {
      this.downloadError = 'Unable to download the report. Please try again.';
    } finally {
      this.isDownloading = false;
    }
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
        (paymentSum: number, payment: any) =>
          paymentSum + Number(payment.pivot?.allocated_amount ?? payment.amount_paid ?? 0),
        0,
      );
      return sum + billPaymentsTotal;
    }, 0);
  }

  getRemainingAmount(): number {
    return this.getTotalBillAmount() - this.getTotalPaidAmount();
  }
}
