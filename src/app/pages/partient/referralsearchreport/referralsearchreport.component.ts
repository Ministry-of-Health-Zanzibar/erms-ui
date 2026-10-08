import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

import { Subject, takeUntil } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';

import { MatIcon } from '@angular/material/icon';

import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// import { saveAs } from 'file-saver';

import { formatDate } from '@angular/common';







import autoTable from 'jspdf-autotable';



import { EmrSegmentedModule } from '@elementar/components';
import { PermissionService } from '../../../services/authentication/permission.service';
import { MatDialog } from '@angular/material/dialog';
import { ReferralreportService } from '../../../services/Referral/referralreport.service';
import { HospitalService } from '../../../services/system-configuration/hospital.service';
import { ReasonsService } from '../../../services/system-configuration/reasons.service';
import { ReferalTypeService } from '../../../services/system-configuration/referal-type.service';
import { EmptyStateComponent, FilterSelectComponent, FilterSelectOption, DatePickerComponent, LoadingStateComponent, PageHeaderComponent, ReportTableComponent, SectionCardComponent, TableToolbarComponent, TextInputComponent } from '@shared/ui';

@Component({
  selector: 'app-referralsearchreport',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    MatInput,
    MatIcon,
    EmrSegmentedModule,


    DatePickerComponent,
    EmptyStateComponent,
    FilterSelectComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    ReportTableComponent,
    SectionCardComponent,
    TableToolbarComponent,
    TextInputComponent,
],
  templateUrl: './referralsearchreport.component.html',
  styleUrl: './referralsearchreport.component.scss'
})
export class ReferralsearchreportComponent implements OnInit, OnDestroy {

  loading: boolean = false;
  private readonly onDestroy = new Subject<void>();

  reportForm: FormGroup;
displayedColumns: string[] = [
  'no',
  'referral_id',
  'patient_name',
  'hospital',
  'insurance_provider_name',
  'start_date',
  'end_date',
  'board_diagnoses',
  'created_at'
];
  dataSource = new MatTableDataSource<any>();

  documents: any[] = [];
  reasons: FilterSelectOption[] = [];
  referralType:any;
  hospital: FilterSelectOption[] = [];

  errorMessage = '';
  noResults = false;


  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public permission: PermissionService,
    private hospitalServices:HospitalService,
    private reasonServi:ReasonsService,
    private typeServices:ReferalTypeService,
    private reportService: ReferralreportService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.configForm();
    this.configureTableFilter();

    this.getReasons();
    this.getReferralType();
    this.getHospital();
  }

  renew(): void {
    this.searchReport();
  }
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
  
    this.dataSource.filter = filterValue;
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private configureTableFilter(): void {
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
  
      const searchableText = [
        data.referral_id,
        data.referral_number,
  
        data.patient_name,
  
        // FROM hospital
        data.from_hospital_name,
        data.from_hospital_address,
  
        // TO hospital
        data.to_hospital_name,
        data.to_hospital_address,
  
        data.insurance_provider_name,
  
        data.start_date,
        data.end_date,
  
        data.created_at,
  
        // Referral reason
        data.referral_reason_name,
  
        // Diagnoses
        ...(data.board_diagnoses || []).flatMap((diagnosis: any) => [
          diagnosis.diagnosis_code,
          diagnosis.diagnosis_name
        ])
      ]
        .filter(value => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();
  
      return searchableText.includes(filter);
    };
  }

  configForm(): void {
    this.reportForm = new FormGroup({
      hospital_name: new FormControl(null),
      referral_reason_name: new FormControl(null),
      referral_type_name: new FormControl(null),
      patient_name: new FormControl(null),
      start_date: new FormControl(null),
      end_date: new FormControl(null),
      // category_name: new FormControl(null),

    });
  }

  getReasons(): void {
    this.reasonServi.getAllReasons().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.reasons = response.data.map((reason: any) => ({
        label: reason.referral_reason_name,
        value: reason.referral_reason_name,
      }));
    });
  }
  getReferralType(): void {
    this.typeServices.getAllReferalType().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.referralType = response.data;
    });
  }

  getHospital() {
    this.hospitalServices.getAllHospital().pipe(takeUntil(this.onDestroy)).subscribe({
      next: (response: any) => {
        this.hospital = response.data.map((item: any) => ({
          label: item.hospital_name,
          value: item.hospital_name,
        }));
      },
      error: (err) => {
        console.error('Error fetching hospitals:', err);
      },
    });
  }

  searchReport(): void {
    this.loading = true;
    this.noResults = false;
    this.errorMessage = '';

    const formData = { ...this.reportForm.value };

    // format dates if they exist
    if (formData.start_date) {
      formData.start_date = new Date(formData.start_date).toISOString().split('T')[0];
    }
    if (formData.end_date) {
      formData.end_date = new Date(formData.end_date).toISOString().split('T')[0];
    }

    this.reportService.generateReport(formData).pipe(takeUntil(this.onDestroy)).subscribe({
      next: response => {
        this.loading = false;
        this.dataSource.data = response.data;
        this.noResults = response.data.length === 0;
      },
      error: err => {
        this.loading = false;
        if (err.status === 404) {
          this.dataSource.data = [];
          this.noResults = true;
        } else {
          this.errorMessage = 'Error fetching reports';
        }
      }
    });
  }

  // Export Excel
  exportExcel(): void {
    const dataToExport = this.dataSource.data;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'Reports': worksheet }, SheetNames: ['Reports'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
   // this.saveAsExcelFile(excelBuffer, 'reports');
  }

  getImageBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = reject;

    img.src = url;
  });
}
async exportPDF() {

  const logo = await this.getImageBase64(
    'assets/img/SMZ_header.png'
  );

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();


  // Add Logo
  doc.addImage(
    logo,
    'PNG',
    pageWidth / 2 - 10,
    8,
    22,
    22
  );


  // Government Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  doc.text(
    'THE REVOLUTIONARY GOVERNMENT OF ZANZIBAR',
    pageWidth / 2,
    35,
    { align: 'center' }
  );


  // Ministry Title
  doc.setFontSize(15);

  doc.text(
    'MINISTRY OF HEALTH',
    pageWidth / 2,
    43,
    { align: 'center' }
  );


  // Line
  doc.setLineWidth(0.5);
  doc.line(
    14,
    48,
    pageWidth - 14,
    48
  );


  // Report title
  doc.setFontSize(14);

  const patientName = this.reportForm.value.patient_name;
const hospitalName = this.reportForm.value.hospital_name;

let reportTitle = 'REFERRAL REPORT';

if (patientName) {
  reportTitle = `REFERRAL REPORT FOR PATIENT: ${patientName.toUpperCase()}`;
} 
else if (hospitalName) {
  reportTitle = `REFERRAL REPORT FOR HOSPITAL: ${hospitalName.toUpperCase()}`;
}


// Report title
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);

doc.text(
  reportTitle,
  pageWidth / 2,
  57,
  { align: 'center' }
);


  const printedDate = new Date();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);


  doc.text(
    `Printed Date: ${printedDate.toLocaleDateString()}`,
    14,
    66
  );


  const startDate = this.reportForm.value.start_date;
  const endDate = this.reportForm.value.end_date;


  if(startDate && endDate){

    doc.text(
      `Reporting Period: ${startDate} - ${endDate}`,
      14,
      72
    );

  }


  autoTable(doc, {
    startY: 78,
  
    head: [[
      'No',
      'Patient Name',
      'From Hospital → To Hospital',
      'Insurance',
      'Start Date',
      'End Date',
      'Board Diagnoses',
      'Created Date'
    ]],
  
    body: this.dataSource.data.map(
      (element: any, index: number) => [
  
        index + 1,
  
        element.patient_name || 'N/A',
  
        [
          `FROM: ${element.from_hospital_name || 'N/A'}`,
          element.from_hospital_address || '',
  
          '↓ TO',
  
          `TO: ${element.to_hospital_name || 'N/A'}`,
          element.to_hospital_address || ''
        ].join('\n'),
  
        element.insurance_provider_name || 'N/A',
  
        element.start_date
          ? formatDate(element.start_date, 'dd/MM/yyyy', 'en-US')
          : 'N/A',
  
        element.end_date
          ? formatDate(element.end_date, 'dd/MM/yyyy', 'en-US')
          : 'N/A',
  
        element.board_diagnoses?.length
          ? element.board_diagnoses
              .map(
                (d: any) =>
                  `${d.diagnosis_code} - ${d.diagnosis_name}`
              )
              .join('\n')
          : 'N/A',
  
        element.created_at
          ? formatDate(element.created_at, 'dd/MM/yyyy HH:mm', 'en-US')
          : 'N/A'
      ]
    ),
  
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'top'
    },
  
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255
    },
  
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 65 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 65 },
      7: { cellWidth: 30 }
    }
  });

  doc.save('Referral_Report.pdf');

}

}