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
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PermissionService } from '../../../../services/authentication/permission.service';
import { RangereportService } from '../../../../services/accountants/rangereport.service';
import { SourcesService } from '../../../../services/accountants/sources.service';
import { SourceTypeService } from '../../../../services/accountants/source-type.service';
import { CategoryService } from '../../../../services/accountants/category.service';
import { EmptyStateComponent, FilterSelectComponent, FilterSelectOption, LoadingStateComponent, PageHeaderComponent, SectionCardComponent, TableToolbarComponent, TextInputComponent } from '@shared/ui';

@Component({
  selector: 'app-parameter-report',
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
    FilterSelectComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    TableToolbarComponent,
    TextInputComponent,
  ],
  templateUrl: './parameter-report.component.html',
  styleUrl: './parameter-report.component.scss'
})
export class ParameterReportComponent implements OnInit, OnDestroy {

  loading: boolean = false;
  private readonly onDestroy = new Subject<void>();

  reportForm: FormGroup;
  displayedColumns: string[] = ['no', 'name', 'amount', 'tin_number', 'source_name','source_type_name','category_name','document_type_name','pdf_file'];
  dataSource = new MatTableDataSource<any>();

  documents: any[] = [];
  sources: FilterSelectOption[] = [];
  sourceType: FilterSelectOption[] = [];
  category: FilterSelectOption[] = [];

  errorMessage = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public permission: PermissionService,
    // public locationService: LocationService,
    private sourceServices:SourcesService,
    private sourceTypeService:SourceTypeService,
    private categoryServices:CategoryService,
    private reportService: RangereportService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}




  ngOnInit(): void {
    this.configForm();
    this.getSource();
    this.getSourceType();
    this.getCategory();
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
      source_name: new FormControl(null),
      source_type_name: new FormControl(null),
      amount: new FormControl(null),
      payee_name: new FormControl(null),
      category_name: new FormControl(null),

    });
  }

  getSource(): void {
    this.sourceServices.getAllSource().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.sources = response.data.map((source: any) => ({
        label: source.source_name,
        value: source.source_name,
      }));
    });
  }
  getSourceType(): void {
    this.sourceTypeService.getAllSourceType().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.sourceType = response.data.map((sourceType: any) => ({
        label: sourceType.source_type_name,
        value: sourceType.source_type_name,
      }));
    });
  }
  getCategory(): void {
    this.categoryServices.getAllCategory().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.category = response.data.map((category: any) => ({
        label: category.category_name,
        value: category.category_name,
      }));
    });
  }

  searchReport(): void {

    if (this.reportForm.valid) {
      this.loading = true;
      this.reportService.generateReport(this.reportForm.value).pipe(takeUntil(this.onDestroy)).subscribe(response => {
        this.loading = false;
        this.dataSource.data = response.data;
        this.dataSource.paginator = this.paginator;
        // console.log('Response Data:', response.data);
      });
    }
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
  exportPDF() {
    const doc = new jsPDF();
    doc.text('Report Data', 10, 10);

    autoTable(doc, {
      head: [['No', 'Name', 'Amount', 'TIN', 'Source', 'Source Type', 'Category', 'Doc Type']],
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






}

