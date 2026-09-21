import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { takeUntil, Subject } from 'rxjs';
import { BillItermService } from '../../../../services/Bills/bill-iterm.service';
import { LoadingStateComponent } from '@shared/ui';

@Component({
  selector: 'app-bill-iterm-by-id',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, LoadingStateComponent],
  templateUrl: './bill-iterm-by-id.component.html',
  styleUrls: ['./bill-iterm-by-id.component.scss'],
})  
export class BillItermByIdComponent implements OnInit {
  private readonly onDestroy = new Subject<void>();

  loading = false;
  billId: any;
  billItem: any = null;

  constructor(private route: ActivatedRoute, private billService: BillItermService) {}

  ngOnInit(): void {
    this.billId = this.route.snapshot.paramMap.get('id');
    this.loadBillItem(this.billId);
  }

  loadBillItem(id: any) {
    this.loading = true;
    this.billService.getbillItermByID(id)
      .pipe(takeUntil(this.onDestroy))
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.billItem = res.data || null;
        },
        error: (err) => {
          this.loading = false;
          console.error('Failed to load bill item', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
