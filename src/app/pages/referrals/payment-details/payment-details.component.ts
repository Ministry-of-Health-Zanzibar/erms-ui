import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { PaymentsService } from '../../../services/payments.service';
import { finalize } from 'rxjs';
import { LoadingStateComponent } from '@shared/ui';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule, DatePipe, LoadingStateComponent],
  templateUrl: './payment-details.component.html',
  styleUrls: ['./payment-details.component.scss']
})
export class PaymentDetailsComponent implements OnInit {
  paymentData: any;
  loading = true;
  loadError = false;

  constructor(
    private route: ActivatedRoute,
    private paymentsService: PaymentsService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.paymentsService.getPaymentById(id).pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading = false)
      ).subscribe({
        next: (res) => {
          this.paymentData = res.data || res; 
        },
        error: () => {
          this.loadError = true;
        }
      });
    } else {
      this.loading = false;
      this.loadError = true;
    }
  }
}
