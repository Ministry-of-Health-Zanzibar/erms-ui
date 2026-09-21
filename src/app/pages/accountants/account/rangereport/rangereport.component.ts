import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
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

import autoTable from 'jspdf-autotable';



import { EmrSegmentedModule } from '@elementar/components';
import { MatDialog} from '@angular/material/dialog';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { RangereportService } from '../../../../services/accountants/rangereport.service';
import { EmptyStateComponent, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent } from '@shared/ui';


@Component({
  selector: 'app-rangereport',
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
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent
  ],
  templateUrl: './rangereport.component.html',
  styleUrl: './rangereport.component.scss'
})
export class RangereportComponent implements OnInit, OnDestroy {
  private readonly onDestroy = new Subject<void>();

  reportForm: FormGroup;
  displayedColumns: string[] = ['no', 'name', 'amount', 'tin_number', 'source_name','source_type_name','category_name','document_type_name','pdf_file'];
  dataSource = new MatTableDataSource<any>();

  documents: any[] = [];
  loading = false;
  errorMessage = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public permission: PermissionService,
    // public locationService: LocationService,
    private reportService: RangereportService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}



  renew(): void {
    this.fetchReports();
  }


  configForm(): void {
    this.reportForm = new FormGroup({
      start_date: new FormControl(null,Validators.required),
      end_date: new FormControl(null,Validators.required),

    });
  }

  fetchReports() {
    if (this.reportForm.invalid) {
      this.errorMessage = 'Please select valid start and end dates.';
      return;
    }

    const { start_date, end_date } = this.reportForm.value;
    if (new Date(start_date) > new Date(end_date)) {
      this.errorMessage = 'Start date cannot be after end date.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.reportService.generateDateReport(start_date, end_date).pipe(takeUntil(this.onDestroy)).subscribe({
      next: (response) => {
        this.documents = response.data;
        // console.log("data hzii",this.documents);
        this.dataSource.data = this.documents; // Fix: Assign data to dataSource
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort; // Fix: Enable sorting
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error fetching reports';
        this.loading = false;
      }
    });
  }

  // Fix: Improve search filter to work across all columns
  ngOnInit(): void {
    this.configForm();
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return Object.values(data).some((value) =>
        String(value).toLowerCase().includes(filter)
      );
    };
  }

  // Fix: Override default search functionality
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }




  exportExcel(): void {
    // Use dataSource.data as the source for export
    const dataToExport = this.dataSource.data;
    // Create a worksheet from JSON data
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    // Create a workbook and add the worksheet
    const workbook: XLSX.WorkBook = { Sheets: { 'Reports': worksheet }, SheetNames: ['Reports'] };
    // Generate buffer
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    // Save Excel file
   // this.saveAsExcelFile(excelBuffer, 'reports');
  }

  // private saveAsExcelFile(buffer: any, fileName: string): void {
  //   const data: Blob = new Blob(
  //     [buffer],
  //     { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' }
  //   );
  //   saveAs(data, `${fileName}_export_${new Date().getTime()}.xlsx`);
  // }

  exportPDF() {
    const doc = new jsPDF();
    doc.text('Report Data', 10, 10);

    autoTable(doc, {
      head: [['No', 'name', 'amount', 'tin_number', 'source_name','source_type_name','category_name','document_type_name']],
      body: this.dataSource.data.map((element, index) => [
        index + 1,
        element.payee_name,
        element.amount,
        element.tin_number,
        element.source_name,
        element.source_type_name,
        element.category_name,
        element.document_type_name
      ]),
    });

    doc.save('report.pdf');
  }


  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }


}

// function autoTable(doc: jsPDF, arg1: { head: string[][]; body: any[][]; }) {
//   throw new Error('Function not implemented.');
// }
// function saveAs(data: Blob, arg1: string) {
//   throw new Error('Function not implemented.');
// }
