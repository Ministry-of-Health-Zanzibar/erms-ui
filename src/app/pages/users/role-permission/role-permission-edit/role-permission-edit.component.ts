import { inject, Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GlobalConstants } from '@shared/global-constants';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { RolePermissionService } from '../../../../services/users/role-permission.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-role-permission-edit',
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
  templateUrl: './role-permission-edit.component.html',
  styleUrl: './role-permission-edit.component.scss'
})
export class RolePermissionEditComponent implements OnInit,OnDestroy {
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()
  public sidebarVisible:boolean = true

  editRoleForm :any = FormGroup;
  checklist: any[] = [];
  filteredChecklist: any[] = [];
  onEditRolesPermission = new EventEmitter();

  roleName: any[] = [];

  // permissions: any;
  permissions: any[] = [];
  checkedAll = false;
  countAllPermission: number = 0;
  countAllowedPermission: number = 0;
  submitting = false;

  constructor(@Inject(MAT_DIALOG_DATA) public dialogData:any,
  private formBuilder:FormBuilder,
  private roleService:RolePermissionService,
  private dialogRef:MatDialogRef<RolePermissionEditComponent>){


  }

  ngOnInit(): void {
    this.rolesFormData();
    this.permissionData();
  }
  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }
  onClose() {
    this.dialogRef.close(false)
  }

  public rolesFormData(){
    this.editRoleForm = this.formBuilder.group({
      name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
      permissionName: new FormArray([]),
    });
  }


  permissionData() {
    this.roleService.displayRolesPermission(this.dialogData.data.id).pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
      this.permissions = response.permission;
      this.roleName = response.roles;
      this.editRoleForm.get("name")!.setValue(this.roleName[0].name);
      this.initPermission();
    });
  }



  initPermission(){
    this.roleService.allPermissions().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.checklist = response.data;
      // console.log(this.checklist);
      for (var i = 0; i < this.checklist.length; i++) {
        this.countAllowedPermission = 0;
        for (var j = 0; j < this.permissions.length; j++) {
          if(this.checklist[i].name == this.permissions[j].name){
            const selectedPermissions = (this.editRoleForm.get('permissionName') as FormArray);
            selectedPermissions.push(new FormControl(this.checklist[i].name));
            this.checklist[i].isSelected = true;
            this.filteredChecklist = [...this.checklist];
          }
          this.countAllowedPermission++;
        }
        this.countAllPermission++;
      }
      if(this.countAllPermission == this.countAllowedPermission)
        this.checkedAll = true;
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
    const selectedPermissions = (this.editRoleForm.get('permissionName') as FormArray);
    if (event.checked) {
      selectedPermissions.push(new FormControl(name));
    } else {
      const index = selectedPermissions.controls.findIndex(x => x.value === name);
      selectedPermissions.removeAt(index);
    }
  }


    // The master checkbox will check/ uncheck all items
  checkUncheckAll(event:any) {
    if(event.checked){
      for (var i = 0; i < this.checklist.length; i++) {
        this.checklist[i].isSelected = true;
        this.onCheckboxChange(this.checklist[i].name, event);
      }
    }else{
      for (var i = 0; i < this.checklist.length; i++) {
        this.checklist[i].isSelected = false;
        this.onCheckboxChange(this.checklist[i].name, event);
      }
    }
  }


  editRolePermission(){
    const data = {
      name: this.editRoleForm.value.name,
      permission_id: this.editRoleForm.value.permissionName
    }

    if(this.editRoleForm.value.permissionName.length > 0 && !this.submitting){
      this.submitting = true;
      this.roleService.updateRoles(data,this.dialogData.data.id).pipe(
        takeUntil(this.onDestroy),
        finalize(() => this.submitting = false)
      ).subscribe({
        next: response => {
        if(response.statusCode == 200){
          this.uiFeedback.fire({
            title: "Success",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#4690eb",
            confirmButtonText: "Continue"
          }).then(() => {
            this.onEditRolesPermission.emit();
            this.dialogRef.close(true);
          });
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
            text: getApiErrorMessage(error, 'Unable to update the role. Please try again.'),
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
