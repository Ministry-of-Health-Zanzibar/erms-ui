import { inject, Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BillService } from '../../../../services/system-configuration/bill.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDivider } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-bills-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDivider,
    MatListModule,
    MatChipsModule,
  ],
  templateUrl: './bills-details.component.html',
  styleUrls: ['./bills-details.component.scss'],
  providers: [DatePipe],
})
export class BillsDetailsComponent implements OnInit {
  private readonly uiFeedback = inject(FeedbackService);
  public loading = false;
  public billId: string | null = null;
  public billData: any = null;

  constructor(
    private route: ActivatedRoute,
    private billService: BillService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.billId = this.route.snapshot.paramMap.get('id');
    if (this.billId) {
      this.fetchBillDetails(this.billId);
    }
  }

  fetchBillDetails(id: string) {
    this.loading = true;
    this.billService.getBillById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res: any) => {
        if (!res?.data) {
          this.uiFeedback.fire('Info', 'No bill found', 'info');
          return;
        }
        this.billData = res.data;
      },
      error: (error: unknown) => {
        this.uiFeedback.fire('Error', getApiErrorMessage(error, 'Failed to fetch bill details.'), 'error');
      },
    });
  }
}
