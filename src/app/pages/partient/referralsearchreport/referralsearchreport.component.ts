import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

import { Subject, takeUntil } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

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
import { MatDatepicker, MatDatepickerModule } from "@angular/material/datepicker";
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';

@Component({
  selector: 'app-referralsearchreport',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    MatInput,
    MatIcon,
    MatFormFieldModule,
    EmrSegmentedModule,


    MatDatepickerModule,
    MatNativeDateModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
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
  reasons:any;
  referralType:any;
  hospital:any;

  errorMessage = '';
  noResults = false;


  @ViewChild(MatPaginator) paginator: MatPaginator;
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
    this.getReasons();
    this.getReferralType()
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
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
      this.reasons = response.data;
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
        this.hospital = response.data;
      },
      error: (err) => {
        console.error('Error fetching hospitals:', err);
      },
    });
  }
  // getHospital(): void {
  //   this.hospitalServices.getAllHospital().subscribe(response => {
  //     this.hospital = response.data;
  //     //console.log("hospitali hiziii",response.data)
  //   });
  // }

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
      this.dataSource.paginator = this.paginator;
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



  // Fix: Improve search filter to work across all columns






  // Export Excel
  exportExcel(): void {
    const dataToExport = this.dataSource.data;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'Reports': worksheet }, SheetNames: ['Reports'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
   // this.saveAsExcelFile(excelBuffer, 'reports');
  }

  // private saveAsExcelFile(buffer: any, fileName: string): void {
  //   const data: Blob = new Blob(
  //     [buffer],
  //     { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' }
  //   );
  //   saveAs(data, `${fileName}_export_${new Date().getTime()}.xlsx`);
  // }

  // Export PDF

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
      'Hospital',
      'Insurance',
      'Start Date',
      'End Date',
      'Board Diagnoses',
      'Created Date'
    ]],

    body: this.dataSource.data.map(
      (element:any,index:number)=>[
        index+1,
        element.patient_name,
        `${element.hospital_name}\n${element.hospital_address}`,
        element.insurance_provider_name,
        element.start_date,
        element.end_date,
        element.board_diagnoses?.map(
          (d:any)=>
          `${d.diagnosis_code} - ${d.diagnosis_name}`
        ).join('\n') || 'N/A',
        element.created_at
      ]
    ),

    styles:{
      fontSize:8
    },

    headStyles:{
      fillColor:[41,128,185],
      textColor:255
    }
  });


  doc.save('Referral_Report.pdf');

}




}
