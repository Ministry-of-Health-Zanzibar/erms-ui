import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { HDividerComponent } from '@elementar/components';
import { Subject } from 'rxjs';
import { ReferralService } from '../../../services/Referral/referral.service';

@Component({
  selector: 'app-displaycomments',
  standalone: true,
  imports: [
      CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatInputModule,
        MatFormFieldModule,
        MatLabel,
        MatCheckbox,
        ReactiveFormsModule,
        HDividerComponent,
        MatAutocompleteModule,
        MatSelect,
        MatDatepickerModule,
        MatIcon
  ],
  templateUrl: './displaycomments.component.html',
  styleUrl: './displaycomments.component.scss'
})
export class DisplaycommentsComponent {

 private readonly onDestroy = new Subject<void>()
   readonly data = inject<any>(MAT_DIALOG_DATA);
   public sidebarVisible:boolean = true

   clientForm: FormGroup;
   user: any;
   id: any;
   comment: any = null;

   constructor(

    private refferalServices:ReferralService,
     private dialogRef: MatDialogRef<DisplaycommentsComponent>)
     {

   }

   ngOnInit(): void {

     if(this.data){
       this.id = this.data.id;
    //  console.log("comment ID   here  ",this.id);
    // console.log("comment amount   here  ",this.data);

     }
     this.getComments()
    // this.viewUser();

   }



   ngOnDestroy(): void {
     this.onDestroy.next()
     this.onDestroy.complete()
   }

   onClose() {
     this.dialogRef.close(false)
   }





getComments() {
  this.refferalServices.getCommentById(this.id).subscribe((response: any) => {
    if (response.statusCode === 200 && response.data) {
      this.comment = response.data;  // not an array – extract data directly
      console.log('comment data:', this.comment);
    }
  }, error => {
    console.error('Error fetching bill:', error);
  });
}


 }
