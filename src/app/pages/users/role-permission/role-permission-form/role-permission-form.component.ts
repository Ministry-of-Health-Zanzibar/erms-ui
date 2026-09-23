import { inject, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { GlobalConstants } from '@shared/global-constants';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { RolePermissionService } from '../../../../services/users/role-permission.service';
import { CommonModule } from '@angular/common';
import { HDividerComponent } from '@elementar/components';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-role-permission-form',
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
    HDividerComponent

  ],
  templateUrl: './role-permission-form.component.html',
  styleUrl: './role-permission-form.component.scss'
})
export class RolePermissionFormComponent implements OnInit,OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);


  private readonly onDestroy = new Subject<void>()
  public sidebarVisible:boolean = true

  roleForm:any = FormGroup;
  checklist: any[] = [];
  filteredChecklist: any[] = [];
  submitting = false;

  constructor(private formBuilder:FormBuilder,
    private permissionService:RolePermissionService,
    private roleService:RolePermissionService,
    private dialogRef: MatDialogRef<RolePermissionFormComponent>) {
      this.initPermission();
  }

  ngOnInit(): void {
    this.rolesFormData();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  onClose() {
    this.dialogRef.close(false)
  }

  public rolesFormData(){
    this.roleForm = this.formBuilder.group({
      name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
      permissionID: new FormArray([]),
    });
  }

  initPermission() {
    this.permissionService.allPermissions().pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
      this.checklist = response.data;
      this.filteredChecklist = [...this.checklist]; // Initialize filtered list with all permissions
    });
  }

    // filter permisiion
    applyFilter(event: any) {
      const searchTerm = event.target.value.toLowerCase();

      // Filter the checklist based on the search term
      this.filteredChecklist = this.checklist.filter(
        (item) => item.name.toLowerCase().includes(searchTerm)
      );
    }


    onCheckboxChange(name: string, event: any) {
      const selectedPermissions = (this.roleForm.get('permissionID') as FormArray);
      if (event.checked) {
        selectedPermissions.push(new FormControl(name));
      } else {
        const index = selectedPermissions.controls.findIndex(x => x.value === name);
        selectedPermissions.removeAt(index);
      }
    }

    checkUncheckAll(event: any) {
      const selectedPermission = (this.roleForm.get('permissionID') as FormArray);
      // Clear the existing array
      selectedPermission.clear();
      for (var i = 0; i < this.checklist.length; i++) {
        this.checklist[i].isSelected = event.checked;
        if (event.checked) {
          this.onCheckboxChange(this.checklist[i].name, event);
          // console.log(this.checklist[i]);
        }
      }
    }

  createRolePermission(){
    const data = {
      name: this.roleForm.value.name,
      permission_id: this.roleForm.value.permissionID
    }
    if(this.roleForm.value.permissionID.length > 0 && !this.submitting){
      this.submitting = true;
      this.roleService.addRoles(data).pipe(
        takeUntil(this.onDestroy),
        finalize(() => this.submitting = false)
      ).subscribe({
        next: response => {
        if(response.statusCode == 201){
          this.uiFeedback.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          }).then(() => this.dialogRef.close(true));
        }else{
          this.uiFeedback.fire({
            title: "error",
            text: response.message,
            icon: "error",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Close"
          });
        }

      },
      error: error => {
          this.uiFeedback.fire({
            title: "Error",
            text: getApiErrorMessage(error, 'Unable to create the role. Please try again.'),
            icon: "error",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          });
      }});
    }else{
      this.uiFeedback.fire({
        title: "warning",
      text: 'No permission selected. Please select at least one permission for this role.',
        icon: "warning",
        confirmButtonColor: "#4690eb",
        confirmButtonText: "Continue"
      });
    }

  }

}
