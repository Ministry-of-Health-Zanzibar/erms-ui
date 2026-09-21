import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatInputModule, MatLabel } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { MonthBillService } from '../../../services/Referral/month-bill.service';
import { RolePermissionService } from '../../../services/users/role-permission.service';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HospitalService } from '../../../services/system-configuration/hospital.service';

@Component({
  selector: 'app-add-monthbill',
  standalone: true,
  imports: [
    CommonModule,
       MatButtonModule,
       MatDialogModule,
       MatInput,
       MatFormField,
       MatLabel,
       MatDialogModule,
       MatCheckbox,
       MatError,
       ReactiveFormsModule,
       HDividerComponent,
       MatSelectModule,
       MatDatepickerModule,
       MatNativeDateModule,
       MatInputModule,
       MatIcon
  ],
  templateUrl: './add-monthbill.component.html',
  styleUrl: './add-monthbill.component.scss'
})
export class AddMonthbillComponent  {

 readonly data = inject<any>(MAT_DIALOG_DATA);
       private readonly onDestroy = new Subject<void>()
       public sidebarVisible:boolean = true

       referralsForm: FormGroup;
       parent: any;
       uploadProgress: number = 0;
       uploading: boolean = false;
       errorMessage: string | null = null;
       id: any;
      patients: any;
      hospital: any;
   referralTypes: any;
   reason: any;
    patientData: any;
    selectedAttachement: File | null = null;

       constructor(private formBuilder:FormBuilder,
         private monthService:MonthBillService,
         private hostpitalService:HospitalService,

         private dialogRef: MatDialogRef<AddMonthbillComponent>) {
       }


       ngOnInit(): void {
         this.getHospital();

           this.configForm();
           if (this.data?.data) {
      this.patientData = this.data.data;
      // console.log("hiziii ",this.patientData)
      this.referralsForm.patchValue(this.patientData);
    }



         }



         ngOnDestroy(): void {
           this.onDestroy.next()
           this.onDestroy.complete()
         }
         onClose() {
           this.dialogRef.close(false)
         }

         configForm(){
           this.referralsForm = new FormGroup({
             current_monthly_bill_amount: new FormControl(null, Validators.required),
             hospital_id: new FormControl(null, Validators.required),
             after_audit_monthly_bill_amount: new FormControl(null, ),
             bill_date: new FormControl(null, Validators.required),
             bill_file: new FormControl(null, Validators.required),

           });
         }

          onAttachmentSelected(event: any): void {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      this.referralsForm.patchValue({ bill_file: file.name });
      this.selectedAttachement = file;
    }
  }


saveReferrals() {
  if (this.referralsForm.valid) {
    const formData = new FormData();
    Object.keys(this.referralsForm.controls).forEach(key => {
      if (key === 'bill_file') {
        if (this.selectedAttachement) {
          formData.append('bill_file', this.selectedAttachement);
        }
      } else {
        const value = this.referralsForm.get(key)?.value;
        formData.append(key, value ?? '');
      }
    });

    this.monthService.addMonthBill(formData).subscribe(response => {
      if (response.statusCode === 201) {
        Swal.fire({
          title: "Success",
          text: "Data saved successfully",
          icon: "success",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Continue"
        }).then(() => {
          this.dialogRef.close(true);
        });
      } else {
        Swal.fire({
          title: "Error",
          text: response.message,
          icon: "error",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Continue"
        });
      }
    });
  } else {
    Swal.fire({
      title: "Form Invalid",
      text: "Please fill all required fields correctly.",
      icon: "warning",
      confirmButtonColor: "#4690eb",
      confirmButtonText: "Okay"
    });
  }
}




         getHospital() {
           this.hostpitalService.getAllHospitalByRefferal().subscribe(response => {
             this.hospital = response.data;
            //  console.log("data ",this.hospital)
           });
         }


        //  getReferralDetails(id: number) {
        //    this.referralsService.getReferralById(id).subscribe(response => {
        //      if (response.statusCode === 200) {
        //        this.referralsForm.patchValue(response.data);
        //      }
        //    });
        //  }


     updateReferrals() {
  if (this.referralsForm.valid) {
    const formData = new FormData();

    Object.keys(this.referralsForm.controls).forEach(key => {
      if (key === 'bill_file') {
        if (this.selectedAttachement) {
          formData.append('bill_file', this.selectedAttachement);
        }
      } else {
        const value = this.referralsForm.get(key)?.value;
        formData.append(key, value ?? '');
      }
    });

    this.monthService.updateMonth(formData, this.patientData.monthly_bill_id).subscribe(response => {
      if (response.statusCode === 200) {
        Swal.fire({
          title: 'Success',
          text: 'Referral updated successfully',
          icon: 'success',
          confirmButtonColor: '#4690eb',
          confirmButtonText: 'Continue',
        });
        this.dialogRef.close(true); // optional: close modal
      } else {
        Swal.fire({
          title: 'Error',
          text: response.message,
          icon: 'error',
          confirmButtonColor: '#4690eb',
          confirmButtonText: 'Continue',
        });
      }
    });
  } else {
    Swal.fire({
      title: 'Form Invalid',
      text: 'Please fill all required fields correctly.',
      icon: 'warning',
      confirmButtonColor: '#4690eb',
      confirmButtonText: 'Okay',
    });
  }
}




 }
