import { FormFieldDirective } from '@shared/ui';
import { SearchableSelectDirective } from '@shared/ui';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { HDividerComponent } from '@elementar/components';
import { finalize, map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { UserService } from '../../../../services/users/user.service';
import { LocationService } from '../../../../services/system-configuration/location.service';
import { RolePermissionService } from '../../../../services/users/role-permission.service';
import { GlobalConstants } from '@shared/global-constants';
import { CouncilService } from '../../../../services/system-configuration/council.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { getApiErrorMessage } from '@shared/utils/api-error';
import { FormHeaderComponent, SectionCardComponent, TextInputComponent } from '@shared/ui';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    FormFieldDirective,
    SearchableSelectDirective,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatLabel,
    MatDialogModule,
    MatCheckbox,
    MatError,
    ReactiveFormsModule,
    HDividerComponent,
    MatAutocompleteModule,
    MatSelect,
    AsyncPipe,
    MatDatepickerModule,
    FormHeaderComponent,
    SectionCardComponent,
    TextInputComponent,
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent {
  private readonly uiFeedback = inject(FeedbackService);

  private readonly onDestroy = new Subject<void>()
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible:boolean = true

  userForm: FormGroup;
  user: any;
  userData: any;
  locations: any;
  councils: any;
  roles: any;
  options: any[] = [];
  myControl = new FormControl('');
  filteredOptions: Observable<any[]>;
  submitting = false;
  roleHistory: any[] = [];
  roleHistoryPage = 1;
  roleHistoryLastPage = 1;
  loadingRoleHistory = false;
  roleHistoryError = '';

  constructor(
    private userService: UserService,
    private locationService: LocationService,
    private councilService: CouncilService,
    private roleService: RolePermissionService,
    private dialogRef: MatDialogRef<AddUserComponent>) {

  }

  ngOnInit(): void {
    if(this.data){
      this.userData = this.data.data;
     // this.getHospital(this.id);
    }
    this.configForm();
    this.getRoles();
    if (this.userData?.id) {
      this.loadRoleHistory();
    }
  }
  //   this.getLocation();

  // }

  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }

  onClose() {
    this.dialogRef.close(false)
  }

  configForm(){
    this.userForm = new FormGroup({
      first_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
      middle_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
      last_name: new FormControl(null, [Validators.required,Validators.pattern(GlobalConstants.nameRegexOnly)]),
      // location_id: new FormControl(null, Validators.required),
      address: new FormControl(null, Validators.required),
      phone_no: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.phoneNoRegex)]),
      email: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.emailRegex)]),
      gender: new FormControl(null, Validators.required),
      date_of_birth: new FormControl(null, Validators.required),
      role_id: new FormControl(null, Validators.required)
    });
    if(this.userData){
      this.userForm.patchValue(this.userData);
      this.userForm.patchValue({ role_id: Number(this.userData.role_id) || null });
    }
  }

  getLocation() {
    this.locationService.getLocation().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.locations = response.data;
      this.options = response.data;
      this.filteredOptions = this.userForm.get('location_id')!.valueChanges.pipe(
        startWith(''),
        map((value: any) => typeof value === 'string' ? this._filter(value) : this.options.slice())
      );
    });
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.label.toLowerCase().includes(filterValue));
  }

  displayFn(option: any): string {
    return option ? option.label : '';
  }

  trackById(index: number, option: any): any {
    return option.location_id;
  }



  getRoles() {
    this.roleService.getAllRoles().pipe(takeUntil(this.onDestroy)).subscribe(response => {
      this.roles = (response.data || []).map((role: any) => ({ ...role, id: Number(role.id) }));
      // console.log("role",this.roles)
    });
  }

  loadRoleHistory(page = 1): void {
    this.loadingRoleHistory = true;
    this.roleHistoryError = '';
    this.userService.getRoleHistory(Number(this.userData.id), page)
      .pipe(takeUntil(this.onDestroy), finalize(() => this.loadingRoleHistory = false))
      .subscribe({
        next: (response) => {
          this.roleHistory = response.data || [];
          this.roleHistoryPage = response.meta?.current_page || page;
          this.roleHistoryLastPage = response.meta?.last_page || 1;
        },
        error: (error: unknown) => this.roleHistoryError = getApiErrorMessage(error, 'Unable to load role history.'),
      });
  }

  roleNames(roles: any[]): string {
    return roles?.map((role) => role.name).join(', ') || 'No assigned role';
  }

  // getUser(userData: any) {
  //   this.userService.getUserById(userData).subscribe(response=>{
  //     if(response.statusCode == 200){
  //       this.user = response.data[0];
  //       this.userForm.patchValue(this.user);
  //     }
  //     else{
  //       this.uiFeedback.fire({
  //         title: "error",
  //         text: response.message,
  //         icon: "error",
  //         confirmButtonColor: "#4690eb",
  //         confirmButtonText: "Close"
  //       });
  //     }
  //   })
  // }
        saveUser(){
         if(this.userForm.valid && !this.submitting){
           this.submitting = true;
           this.userService.addUser(this.userForm.value).pipe(
             takeUntil(this.onDestroy),
             finalize(() => this.submitting = false)
           ).subscribe({
             next: response=>{
             if(response.statusCode == 201){
               this.uiFeedback.fire({
                 title: "Success",
                 text: "User saved successfully",
                 html: "<b>Default Credential</b><br> Username: <b>"+response.email +"</b><br> Password: <b>" +response.password +"</b>",
                 icon: "success",
                 confirmButtonColor: "#4690eb",
                 confirmButtonText: "Continue"
               }).then(() => this.dialogRef.close(true));
             }else{
               this.uiFeedback.fire({
                 title: "Error",
                 text: response.message,
                 icon: "error",
                 confirmButtonColor: "#4690eb",
                 confirmButtonText: "Continue"
               });
             }
           },
           error: error => this.showRequestError(error)
         });
         }else{
           this.userForm.markAllAsTouched();
         }
       }

       updateUser(){
         if(this.userForm.valid && !this.submitting){
          this.submitting = true;
          this.userService.updateUser(this.userForm.value, this.userData.id).pipe(
            takeUntil(this.onDestroy),
            finalize(() => this.submitting = false)
          ).subscribe({
            next: response=>{
             if(response.statusCode == 201){
               this.uiFeedback.fire({
                 title: "Success",
                 text: "User updated successfully",
                 icon: "success",
                 confirmButtonColor: "#4690eb",
                 confirmButtonText: "Continue"
               }).then(() => this.dialogRef.close(true));
             }else{
               this.uiFeedback.fire({
                 title: "Error",
                 text: response.message,
                 icon: "error",
                 confirmButtonColor: "#4690eb",
                 confirmButtonText: "Continue"
               });
             }
           },
           error: error => this.showRequestError(error)
         });
         }else{
           this.userForm.markAllAsTouched();
         }
       }

       private showRequestError(error: any): void {
         this.uiFeedback.fire({
           title: 'Error',
           text: getApiErrorMessage(error, 'Unable to save the user. Please try again.'),
           icon: 'error',
           confirmButtonColor: '#4690eb',
           confirmButtonText: 'Continue'
         });
       }
 }
