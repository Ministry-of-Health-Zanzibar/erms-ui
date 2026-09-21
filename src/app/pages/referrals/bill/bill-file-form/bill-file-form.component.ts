import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { BillFileService } from '../../../../services/Bills/bill-file.service';
import Swal from 'sweetalert2';
import { HospitalService } from '../../../../services/system-configuration/hospital.service';

@Component({
  selector: 'app-bill-file-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './bill-file-form.component.html',
  styleUrls: ['./bill-file-form.component.scss'],
})
export class BillFileFormComponent {
  private readonly onDestroy = new Subject<void>();
  readonly data = inject<any>(MAT_DIALOG_DATA);

  billForm: FormGroup;
  isLoading = false;
  selectedAttachment: File | null = null;
  billData: any;



  hospitals: any[] = [];
filteredHospitals: any[] = [];
hospitalSearch: string = '';
  referrals: any[] = [];

  constructor(
    private billService: BillFileService,
    private hospitalService: HospitalService,
    private dialogRef: MatDialogRef<BillFileFormComponent>
  ) {}

  ngOnInit(): void {
    this.configForm();
    if (this.data?.data) {
      this.billData = this.data.data;

      this.billForm.patchValue({
        ...this.billData,
        bill_start: this.billData.bill_start
          ? new Date(this.billData.bill_start)
          : null,
        bill_end: this.billData.bill_end
          ? new Date(this.billData.bill_end)
          : null,
      });
    }

    this.fetchAllHospitals();
   
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

 fetchAllHospitals() {
  this.billService.getAllHospital().subscribe(
    (response) => {
      this.hospitals = response.data;
      this.filteredHospitals = [...response.data];
    },
    (error) => {
      console.error('Failed to fetch hospitals', error);
    }
  );
}

  onClose() {
    this.dialogRef.close(false);
  }

  configForm() {
    this.billForm = new FormGroup({
      bill_file: new FormControl(null, Validators.required),
      bill_file_amount: new FormControl(null, [Validators.required]),
      hospital_id: new FormControl(null, [Validators.required]),
      bill_start: new FormControl(null, [Validators.required]),
      bill_end: new FormControl(null, [Validators.required]),
    });
  }

  endDateFilter = (d: Date | null): boolean => {
    if (!d) return true;
    const startDate = this.billForm.get('bill_start')?.value;
    if (!startDate) return true; // no start date selected, allow all
    return d >= startDate;
  };

 

 onAttachmentSelected(event: any): void {
  const file = event.target.files?.[0];

  if (!file) return;

  const maxSizeInBytes = 1 * 1024 * 1024; // 1MB

  if (file.size > maxSizeInBytes) {
    Swal.fire({
      icon: 'error',
      title: 'File Too Large',
      html: `
        <p>The selected file exceeds <b>1 MB</b>.</p>
        <p>Please compress your file before uploading.</p>
        <a href="https://www.ilovepdf.com/compress_pdf" target="_blank">
          👉 iLovePDF Compress Tool
        </a>
      `,
      confirmButtonText: 'OK'
    });

    // reset input + form
    (event.target as HTMLInputElement).value = '';
    this.billForm.patchValue({ bill_file: null });
    this.selectedAttachment = null;

    return;
  }

  // valid file
  this.billForm.patchValue({
    bill_file: file.name
  });

  this.selectedAttachment = file;
}

 saveBill() {
  if (this.billForm.invalid) return;

  this.isLoading = true; // 🔥 start loader

  const formData = new FormData();
  Object.keys(this.billForm.controls).forEach((key) => {
    if (key === 'bill_file') {
      if (this.selectedAttachment) {
        formData.append('bill_file', this.selectedAttachment);
      }
    } else {
      const value = this.billForm.get(key)?.value;
      formData.append(key, value ?? '');
    }
  });

  this.billService.addBillFiles(formData).subscribe({
    next: (response) => {
      this.isLoading = false; // 🔥 stop loader

      if (response.statusCode === 201) {
        Swal.fire('Success', response.message, 'success');
        this.dialogRef.close(true);
      } else {
        Swal.fire('Error', response.message, 'error');
      }
    },
    error: () => {
      this.isLoading = false; // 🔥 stop loader on error
      Swal.fire('Error', 'Something went wrong', 'error');
    }
  });
}

updateBill() {
  if (this.billForm.invalid) return;

  this.isLoading = true;

  const formData = new FormData();
  Object.keys(this.billForm.controls).forEach((key) => {
    if (key === 'bill_file') {
      if (this.selectedAttachment) {
        formData.append('bill_file', this.selectedAttachment);
      }
    } else {
      const value = this.billForm.get(key)?.value;
      formData.append(key, value ?? '');
    }
  });

  this.billService
    .updatebillFiles(formData, this.billData.bill_file_id)
    .subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.statusCode === 200) {
          Swal.fire('Success', response.message, 'success');
          this.dialogRef.close(true);
        } else {
          Swal.fire('Error', response.message, 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        Swal.fire('Error', 'Something went wrong', 'error');
      }
    });
}

  getHospital() {
    this.hospitalService
      .getAllHospital()
      .pipe(takeUntil(this.onDestroy))
      .subscribe(
        (response: any) => {
          if (response.statusCode == 200) {
            this.hospitals = response.data;
            this.filteredHospitals = this.hospitals;

            // Patch hospital_id if editing
            if (this.billData?.hospital_id) {
              this.billForm.patchValue({
                hospital_id: this.billData.hospital_id,
              });
            }
          }
        },
        (error) => {
          // console.log('hospital api failed to load');
        }
      );
  }

  onHospitalSearchChange() {
    const search = this.hospitalSearch.toLowerCase();
    this.filteredHospitals = this.hospitals.filter((h) =>
      h.hospital_name.toLowerCase().includes(search)
    );
  }
}
