import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { Subject, takeUntil } from 'rxjs';
import { RolePermissionService } from '../../../../services/users/role-permission.service';

@Component({
  selector: 'app-role-permission-display',
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
  templateUrl: './role-permission-display.component.html',
  styleUrl: './role-permission-display.component.scss'
})
export class RolePermissionDisplayComponent implements OnInit,OnDestroy{

  private readonly onDestroy = new Subject<void>()

  diplayRoleForm :any = FormGroup;
  roleName:any;

  checklist: any[] = [];
  filteredChecklist: any[] = [];
  public sidebarVisible:boolean = true


  constructor(@Inject(MAT_DIALOG_DATA) public dialogData:any,
    private formBuilder:FormBuilder,
    private roleService:RolePermissionService,
    private dialogRef: MatDialogRef<RolePermissionDisplayComponent>) {
      this.initPermission();
  }

  ngOnInit(): void {
    this.roleName= this.dialogData.data.name ,
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
    this.diplayRoleForm = this.formBuilder.group({
      permissionID: new FormArray([]),
    });
  }


  initPermission() {
    this.roleService.displayRolesPermission(this.dialogData.data.id).pipe(takeUntil(this.onDestroy)).subscribe((response: any) => {
      this.checklist = response.permission;
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


}
