import { AfterContentInit, ChangeDetectionStrategy, Component, ContentChild, Input } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-report-table',
  standalone: true,
  templateUrl: './report-table.component.html',
  styleUrl: './report-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportTableComponent implements AfterContentInit {
  @Input({ required: true }) dataSource!: MatTableDataSource<any>;

  @ContentChild(MatPaginator) private paginator?: MatPaginator;

  ngAfterContentInit(): void {
    if (this.dataSource && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }
}
