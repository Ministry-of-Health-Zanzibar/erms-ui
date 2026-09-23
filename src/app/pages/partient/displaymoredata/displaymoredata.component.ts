import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { PartientService } from '../../../services/partient/partient.service';
import { LoadingStateComponent } from '@shared/ui';

@Component({
  selector: 'app-displaymoredata',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatIcon,
    MatDialogModule,
    LoadingStateComponent
  ],
  templateUrl: './displaymoredata.component.html',
  styleUrl: './displaymoredata.component.scss'
})
export class DisplaymoredataComponent implements OnInit{
  public displayRoleForm!: FormGroup;
  patientID: string | null = null;
  patient: any = null;
  insurance: any = null;
  userRole: string | null;

  constructor(private route: ActivatedRoute,
    public displayServices:PartientService,
    private dialog: MatDialog

  ) {}

  // ngOnInit(): void {
  //   this.getFeedbackById()

  // }

  ngOnInit() {
    this.patientID = this.route.snapshot.paramMap.get('id');
    // console.log("inafika value",this.patientID) // Get complaint ID from URL
    if (this.patientID) {
      this.getMoreData();
      //this.getFeedbackById();


    }
  }


  public getMoreData() {
    if (!this.patientID) return;

    this.displayServices.getPatientInsurances(this.patientID).subscribe(
      response => {
        // console.log('Full API Response:', response);
        this.patient = response;


      },
      error => {
        console.error('Failed to load patient data', error);
      }
    );
  }





}
