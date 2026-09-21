import { GraphreportService } from './../../../services/accountants/graphreport.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderComponent, SectionCardComponent } from '@shared/ui';
Chart.register(...registerables);




@Component({
  standalone: true,
  imports: [

   
    CommonModule,
    PageHeaderComponent,
    SectionCardComponent,


  ],
  templateUrl: './basic.component.html',
  styleUrl: './basic.component.scss'
})
export class BasicComponent implements OnInit, OnDestroy {
  private readonly onDestroy = new Subject<void>();
  private readonly charts = new Map<string, Chart>();



  constructor(private reportService: GraphreportService) {}


  ngOnInit(): void {

  
   this.getDocumentPerWeekReport();
   this.getDocumentPerMonthReport();
   this.getSourceSummaryReport();
   this.getDocumentTypeSummaryReport();
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }




  public getDocumentPerWeekReport(): void {
    this.reportService.getDocumentPerWeekReport().pipe(takeUntil(this.onDestroy)).subscribe((data) => {
      if (!data.weeklyData) {
        console.error('No weeklyData found');
        return;
      }

      // Use raw ISO week as labels (e.g., "2025-17")
      const labels = data.weeklyData.map((item: any) => `Week ${item.week}`);

      const reportData = data.weeklyData.map((item: any) => item.total);

      this.renderChart(
        'documentPerWeekChart',
        labels,
        reportData,
        'bar',
        'Documents per Week'
      );
    });
  }





  public getDocumentPerMonthReport(): void {
    this.reportService.getDocumentPerMonthReport()
      .pipe(takeUntil(this.onDestroy))
      .subscribe((data) => {
        if (!data.monthlyData) {
          console.error('No monthlyData data found');
          return;
        }


        const labels = data.monthlyData.map((item: any) => {
          const [year, month] = item.month.split('-'); // Split "2025-02" into ["2025", "02"]
          const date = new Date(Number(year), Number(month) - 1); // Create a Date object
          return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric',
          }).format(date);
        });

        const complainData = data.monthlyData.map(
          (item: any) => item.total
        );



        this.renderChart(
          'documentPerMonthChart',
          labels,
          complainData,
          'bar',
          'Document Per Month'
        );
      });
  }

  public getSourceSummaryReport(): void {
    this.reportService.getSourceReport().pipe(takeUntil(this.onDestroy)).subscribe((data) => {
      if (!data.sourceSummary) {
        console.error('No sourceSummary data found');
        return;
      }

      const labels = data.sourceSummary.map((item: any) => item.source_name);
      const totals = data.sourceSummary.map((item: any) => item.total);

      this.renderChart(
        'sourcePieChart',     // ID of your canvas element
        labels,
        totals,
        'pie',
        'Documents by Source'
      );
    });
  }

  public getDocumentTypeSummaryReport(): void {
    this.reportService.getDocumentTypeReport().pipe(takeUntil(this.onDestroy)).subscribe((data) => {
      if (!data.documentTypeSummary) {
        console.error('No documentTypeSummary data found');
        return;
      }

      const labels = data.documentTypeSummary.map((item: any) => item.document_type_name);
      const totals = data.documentTypeSummary.map((item: any) => item.total);

      this.renderChart(
        'documentTypeChart',  // ID of your canvas element
        labels,
        totals,
        'pie',
        'Documents by Type'
      );
    });
  }






    // With Months
    renderChart(
      canvasId: string,
      labels: string[],
      complailData: number[],
      chartType: any,
      chartName: string
    ): void {
      this.charts.get(canvasId)?.destroy();
      const chart = new Chart(canvasId, {
        type: chartType,
        data: {
          labels: labels,
          datasets: [
            {
              label: chartName,
              data: complailData,
              // backgroundColor: 'rgba(75, 192, 192, 0.2)',
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(201, 203, 207, 0.2)',
              ],
              // borderColor: 'rgba(75, 192, 192, 1)',
              borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)',
                'rgb(153, 102, 255)',
                'rgb(201, 203, 207)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
      this.charts.set(canvasId, chart);
    }
}
