
import { ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StatisticalService } from '../../../services/report/statistical.service';
import { GraphreportService } from '../../../services/accountants/graphreport.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const PATIENT_WORKFLOW_COLORS = [
  '#4a90e2',
  '#c0504d',
  '#9bbb59',
  '#2cb7a9',
  '#8064a2',
  '#f4b183',
  '#7f8c8d',
  '#5b9bd5',
];

const patientWorkflowCenterTextPlugin = {
  id: 'patientWorkflowCenterText',
  afterDraw(chart: any) {
    const dataset = chart.data.datasets?.[0];
    const values = (dataset?.data ?? []).map((value: unknown) => Number(value) || 0);
    const total = values.reduce((sum: number, value: number) => sum + value, 0);
    const firstArc = chart.getDatasetMeta(0)?.data?.[0];

    if (!firstArc) {
      return;
    }

    const { ctx } = chart;
    const centerX = firstArc.x;
    const centerY = firstArc.y;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--rms-text')
      .trim() || '#334155';
    ctx.font = '700 24px Arial, sans-serif';
    ctx.fillText(total.toLocaleString(), centerX, centerY - 7);
    ctx.font = '600 11px Arial, sans-serif';
    ctx.fillText('Patients', centerX, centerY + 15);
    ctx.restore();
  },
};

const patientWorkflowOutsideLabelsPlugin = {
  id: 'patientWorkflowOutsideLabels',
  afterDraw(chart: any) {
    const dataset = chart.data.datasets?.[0];
    const labels = chart.data.labels ?? [];
    const values = (dataset?.data ?? []).map((value: unknown) => Number(value) || 0);
    const total = values.reduce((sum: number, value: number) => sum + value, 0);
    const arcs = chart.getDatasetMeta(0)?.data ?? [];

    if (!arcs.length || !dataset) {
      return;
    }

    const chartArea = chart.chartArea;
    const leftItems: any[] = [];
    const rightItems: any[] = [];

    arcs.forEach((arc: any, index: number) => {
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const value = values[index] ?? 0;
      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
      const item = {
        arc,
        index,
        side: cosine >= 0 ? 'right' : 'left',
        startX: arc.x + cosine * arc.outerRadius,
        startY: arc.y + sine * arc.outerRadius,
        elbowX: arc.x + cosine * (arc.outerRadius + 16),
        elbowY: arc.y + sine * (arc.outerRadius + 16),
        labelY: arc.y + sine * (arc.outerRadius + 22),
        label: `${labels[index] ?? 'Unknown'}: ${percentage}%`,
        color: dataset.backgroundColor[index] || '#64748b',
      };

      (item.side === 'right' ? rightItems : leftItems).push(item);
    });

    const lineHeight = 16;
    const minimumY = chartArea.top + 18;
    const maximumY = chartArea.bottom - 18;

    const distributeLabels = (items: any[]) => {
      items.sort((first, second) => first.labelY - second.labelY);

      items.forEach((item, index) => {
        item.labelY = index === 0
          ? Math.max(minimumY, item.labelY)
          : Math.max(item.labelY, items[index - 1].labelY + lineHeight);
      });

      const overflow = items[items.length - 1].labelY - maximumY;
      if (overflow > 0) {
        items.forEach((item) => item.labelY -= overflow);
      }

      const underflow = minimumY - items[0].labelY;
      if (underflow > 0) {
        items.forEach((item) => item.labelY += underflow);
      }
    };

    distributeLabels(leftItems);
    distributeLabels(rightItems);

    const { ctx } = chart;
    ctx.save();
    ctx.font = '500 10px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;

    [...leftItems, ...rightItems].forEach((item) => {
      const isRight = item.side === 'right';
      const textX = isRight ? chartArea.right + 8 : chartArea.left - 8;
      const lineEndX = isRight ? textX - 4 : textX + 4;

      ctx.strokeStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(item.startX, item.startY);
      ctx.lineTo(item.elbowX, item.elbowY);
      ctx.lineTo(lineEndX, item.labelY);
      ctx.stroke();

      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--rms-text')
        .trim() || '#334155';
      ctx.textAlign = isRight ? 'left' : 'right';
      ctx.fillText(item.label, textX, item.labelY);
    });

    ctx.restore();
  },
};

import {
  ApexChart,
  ApexLegend,
  ApexTitleSubtitle,
  ApexNonAxisChartSeries,
  ApexResponsive,
} from 'ng-apexcharts';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    NgApexchartsModule,
  ],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
})
export class FinanceComponent implements OnInit, OnDestroy {
  referral: any = {};
  dashboardData: any = {};
  @ViewChild('patientWorkflowChart') patientWorkflowCanvas?: ElementRef<HTMLCanvasElement>;
  private patientWorkflowChart?: Chart;
  private readonly platformId = inject(PLATFORM_ID);

  // =========================
  // OTHER DIAGNOSES POPUP
  // =========================
  showOthersModal = false;
  othersData: any[] = [];
  othersLoading = false;
  othersError = '';

  constructor(
    private dashboardService: StatisticalService,
    private reportService: GraphreportService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getReferralSummary();
    this.getReferralSummaryByReason();
    this.fetchReferralByMonth();
    this.fetchReferralTrends();
    this.fetchData();
    this.loadDashboardStatistics();
  }

  ngOnDestroy(): void {
    this.patientWorkflowChart?.destroy();
  }

  // =========================
  // OPEN / CLOSE MODAL
  // =========================
  openOthersDiagnoses(): void {
    this.showOthersModal = true;
    this.othersLoading = true;
    this.othersError = '';
    this.othersData = [];

    this.reportService.getOtherDiagnosesList().subscribe({
      next: (res: any) => {
        this.othersData = res?.data || [];
        this.othersLoading = false;
      },
      error: (err) => {
        console.error('Error fetching other diagnoses:', err);
        this.othersLoading = false;
        this.othersError = err?.error?.message || 'Unable to load other diagnoses. Please try again.';
      },
    });
  }

  closeModal(): void {
    this.showOthersModal = false;
  }

  loadDashboardStatistics() {
    this.dashboardService.getWorkFlowCount().subscribe({
      next: (response: any) => {
        const statuses = (response?.data?.medical_history?.statuses ?? []).map((item: any) => ({
          ...item,
          display_label: this.getDashboardStatusLabel(item.status, item.label),
        }));

        this.dashboardData = {
          ...response.data,
          medical_history: {
            ...response.data.medical_history,
            statuses,
          },
        };

        // The canvas is created by the status-data *ngIf, so run one view update
        // before drawing the Chart.js sample chart.
        this.changeDetectorRef.detectChanges();
        this.renderPatientWorkflowChart(statuses);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  private renderPatientWorkflowChart(statuses: any[]): void {
    this.patientWorkflowChart?.destroy();

    const canvas = this.patientWorkflowCanvas?.nativeElement;
    if (!isPlatformBrowser(this.platformId) || !canvas || statuses.length === 0) {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const textColor = rootStyles.getPropertyValue('--rms-text').trim() || '#334155';
    const mutedColor = rootStyles.getPropertyValue('--rms-text-muted').trim() || '#64748b';

    this.patientWorkflowChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: statuses.map((item: any) => item.display_label),
        datasets: [
          {
            data: statuses.map((item: any) => Number(item.count) || 0),
            backgroundColor: statuses.map(
              (_item: any, index: number) => PATIENT_WORKFLOW_COLORS[index % PATIENT_WORKFLOW_COLORS.length],
            ),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '57%',
        radius: '68%',
        layout: {
          padding: { top: 20, right: 116, bottom: 42, left: 116 },
        },
        plugins: {
          title: {
            display: true,
            text: 'Patient Status Tracking',
            color: textColor,
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 8 },
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: mutedColor,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 12,
              font: { size: 10 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = Number(context.raw) || 0;
                const total = statuses.reduce(
                  (sum: number, item: any) => sum + (Number(item.count) || 0),
                  0,
                );
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return ` ${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
      plugins: [patientWorkflowCenterTextPlugin, patientWorkflowOutsideLabelsPlugin],
    });
  }

  private getDashboardStatusLabel(status: string, fallback: string): string {
    const labels: Record<string, string> = {
      pending: 'Submitted',
      reviewed: 'Reviewed',
      assigned: 'Medical Board',
      requested: 'Referral Created',
      approved: 'Approved',
      confirmed: 'Confirmed',
      rejected: 'Rejected',
      boarded_out: 'Boarded Out',
    };

    return labels[status] ?? fallback;
  }

  // =========================
  // REFERRAL TRENDS
  // =========================
  fetchReferralTrends(): void {
    this.reportService.getAnalyticalReferalTrend().subscribe(
      (response) => {
        if (!response?.data) return;

        const categories: string[] = response.dates || [];
        const dataObj = response.data;

        const series = Object.keys(dataObj).map((key) => ({
          name: key,
          data: categories.map((month: string) => {
            const entry = dataObj[key].find(
              (i: any) => i.date === month,
            );
            return entry ? entry.total : 0;
          }),
        }));

        this.lineChartOptions = {
          ...this.lineChartOptions,
          series,
          xaxis: {
            ...this.lineChartOptions.xaxis,
            categories: categories.map((m) => this.formatMonth(m)),
          },
        };
      },
      (error) => {
        console.error('Error fetching referral trend:', error);
      },
    );
  }

  private formatMonth(month: string): string {
    const [year, m] = month.split('-');

    const names = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec',
    ];

    return `${names[+m - 1]} ${year}`;
  }

  // =========================
  // DASHBOARD DATA
  // =========================
  fetchData(): void {
    this.reportService.getCount().subscribe(
      (response) => {
        this.referral = response;
      },
      (error) => console.error(error),
    );
  }

  fetchReferralByMonth(): void {
    this.reportService.getMonthRefferalByGender().subscribe(
      (response) => {
        const chartData = response?.data || [];
  
        const monthYearLabels = chartData.map((item: any) =>
          this.formatMonth(item.month)
        );
  
        const maleReferrals = chartData.map(
          (item: any) => item.male_referrals || 0
        );
  
        const femaleReferrals = chartData.map(
          (item: any) => item.female_referrals || 0
        );
  
        this.barChartOptions = {
          ...this.barChartOptions,
          series: [
            { name: 'Male', data: maleReferrals },
            { name: 'Female', data: femaleReferrals },
          ],
          xaxis: {
            ...this.barChartOptions.xaxis,
            categories: monthYearLabels,
          },
        };
      },
      (error) => console.error(error),
    );
  }

  // =========================
  // PIE CHARTS
  // =========================
  pieColors: string[] = [
    '#1E88E5',
    '#43A047',
    '#FB8C00',
    '#E53935',
    '#8E24AA',
    '#3949AB',
    '#00897B',
    '#F4511E',
  ];

  pieSeries: ApexNonAxisChartSeries = [];
  pieLabels: string[] = [];
  pieChart: ApexChart = { type: 'pie', height: 350, width: 600 };
  pieTitle: ApexTitleSubtitle = { text: 'Referrals by Hospitals' };
  pieLegend: ApexLegend = { position: 'right' };

  pieResponsive: ApexResponsive[] = [
    {
      breakpoint: 480,
      options: { chart: { width: '100%' }, legend: { position: 'bottom' } },
    },
  ];

  getReferralSummary(): void {
    this.reportService.getReportreferralByHospital().subscribe(
      (data) => {
        if (!data) return;

        const hospitalMap: any = {
          totalReferralsByLumumba: 'Lumumba Regional Hospital',
          totalReferralsByMuhimbiliOrthopaedicInstitute: 'Muhimbili Orthopaedic Institute',
          totalReferralsByJakayaKikweteCardiacInstitute: 'Jakaya Kikwete Cardiac Institute',
          totalReferralsByMuhimbiliNationalHospital: 'Muhimbili National Hospital',
          totalReferralsByOceanRoadCancerInstitute: 'Ocean Road Cancer Institute',
          totalReferralsByKilimanjaroChristianMedicalCentre: 'KCMC',
          totalReferralsByMadrasInstituteOfOrthopaedicsAndTraumatology: 'MIOT',
        };

        this.pieLabels = Object.values(hospitalMap);
        this.pieSeries = Object.keys(hospitalMap).map((k) => data[k] || 0);
      },
      (error) => console.error(error),
    );
  }

  // =========================
  // GENDER PIE
  // =========================
  reasonSeries: ApexNonAxisChartSeries = [];
  reasonLabels: string[] = [];
  reasonChart: ApexChart = { type: 'pie', height: 350 };
  reasonTitle: ApexTitleSubtitle = { text: 'Referrals by Gender' };
  reasonLegend: ApexLegend = { position: 'right' };

  reasonResponsive: ApexResponsive[] = [
    {
      breakpoint: 480,
      options: { chart: { width: 300 }, legend: { position: 'bottom' } },
    },
  ];

  getReferralSummaryByReason(): void {
    this.reportService.getReportreferralreferralsByReason().subscribe(
      (data) => {
        this.reasonLabels = ['Male', 'Female'];
        this.reasonSeries = [data.Male || 0, data.Female || 0];
      },
      (error) =>
        console.error('Error fetching referral summary by reason', error),
    );
  }

  // =========================
  // LINE CHART
  // =========================
  lineChartOptions: any = {
    series: [],
    chart: {
      type: 'line',
      height: 400,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: [] },
    yaxis: { title: { text: 'Referrals' } },
    colors: [
      '#008FFB','#FEB019','#00E396','#FF4560','#EC4899',
      '#7a6054ff','#2664a6ff','#D10CE8','#69d3ebff','#1E88E5',
    ],
    tooltip: { shared: true, intersect: false },
  };

  // =========================
  // BAR CHART
  // =========================
  barChartOptions: any = {
    series: [],
    chart: { type: 'bar', stacked: true, height: 350 },
    xaxis: { categories: [] },
  };
}
