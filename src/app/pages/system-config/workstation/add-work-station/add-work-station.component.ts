import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HDividerComponent } from '@elementar/components';
import { finalize, map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { WorkStationService } from '../../../../services/work-station.service';
import { LocationService } from '../../../../services/system-configuration/location.service';
import { EmployerService } from '../../../../services/system-configuration/employer.service';
import { GlobalConstants } from '@shared/global-constants';
import { getApiErrorMessage } from '@shared/utils/api-error';

@Component({
  selector: 'app-add-work-station',
  standalone: true,
  imports: [
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
    AsyncPipe
  ],
  templateUrl: './add-work-station.component.html',
  styleUrl: './add-work-station.component.scss'
})
export class AddWorkStationComponent implements OnInit, OnDestroy {

  private readonly onDestroy = new Subject<void>()
  readonly data = inject<any>(MAT_DIALOG_DATA);
  public sidebarVisible:boolean = true

  workStationForm: FormGroup;
  id: any;
  workStations: any;
  locations: any;
  employers: any;
  options: any[] = [];
  employerOptions: any[] = [];
  myControl = new FormControl('');
  filteredOptions: Observable<any[]>;
  filteredEmployer: Observable<any[]>;
  submitting = false;

  constructor(
    private workStationService: WorkStationService,
    private locationService: LocationService,
    private empoyerService: EmployerService,
    private dialogRef: MatDialogRef<AddWorkStationComponent>) {

  }

  ngOnInit(): void {
    this.configForm();
    if(this.data?.id){
      this.id = this.data.id;
      this.getWorkStation(this.id);
    }
    this.getLocation();
    this.getEmployer();
  }

  ngOnDestroy(): void {
    this.onDestroy.next()
    this.onDestroy.complete()
  }

  onClose() {
    this.dialogRef.close(false)
  }

  configForm(){
    this.workStationForm = new FormGroup({
      workstation_name: new FormControl(null, [Validators.required, Validators.pattern(GlobalConstants.nameRegexOnly)]),
      location_id: new FormControl(null, Validators.required),
      employer_id: new FormControl(null, Validators.required),
    });
  }

  getLocation() {
    this.locationService.getLocation().pipe(takeUntil(this.onDestroy)).subscribe({ next: response => {
      this.locations = response.data;
      this.options = response.data;
      this.filteredOptions = this.workStationForm.get('location_id')!.valueChanges.pipe(
        startWith(''),
        map((value: any) => typeof value === 'string' ? this._filter(value) : this.options.slice())
      );
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load locations.')) });
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.label.toLowerCase().includes(filterValue));
  }

  displayFn(option: any): string {
    return option ? option.label : '';
  }

  trackById(index: number, option: any): any {
    return option.form_type_id;
  }

  getEmployer() {
    this.empoyerService.getAllEmployer().pipe(takeUntil(this.onDestroy)).subscribe({ next: response => {
      this.employers = response.data;
      this.employerOptions = this.employers;
      this.filteredEmployer = this.workStationForm.get('employer_id')!.valueChanges.pipe(
        startWith(''),
        map((value: any) => typeof value === 'string' ? this._filterEmployer(value) : this.employerOptions.slice())
      );
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load employers.')) });
  }

  private _filterEmployer(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.employerOptions.filter(option => option.employer_name.toLowerCase().includes(filterValue));
  }

  displayEmployerFn(option: any): string {
    return option ? option.employer_name : '';
  }

  trackEmployerById(index: number, option: any): any {
    return option.employer_id;
  }

  getWorkStation(id: any) {
    this.workStationService.getWorkStationById(id).pipe(takeUntil(this.onDestroy)).subscribe({ next: response=>{
      if(response.statusCode == 200){
        this.workStations = response.data[0];
        this.workStationForm.patchValue({
          workstation_name: this.workStations.workstation_name,
          employer_id: { employer_id: this.workStations.employer_id, employer_name: this.workStations.employer_name},
          location_id: { location_id: this.workStations.location_id, label: this.workStations.label},
        })
      }
      else{
        Swal.fire({
          title: "error",
          text: response.message,
          icon: "error",
          confirmButtonColor: "#4690eb",
          confirmButtonText: "Close"
        });
      }
    }, error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to load the workstation.')) })
  }

  saveWorkStation(){
    this.save(false);
  }

  updateWorkStation(){
    this.save(true);
  }

  private save(isUpdate: boolean): void {
    if (this.workStationForm.invalid || this.submitting) {
      this.workStationForm.markAllAsTouched();
      return;
    }

    const selectedLocation = this.workStationForm.value.location_id;
    const selectedEmployer = this.workStationForm.value.employer_id;
    const payload = {
      ...this.workStationForm.value,
      location_id: typeof selectedLocation === 'object' ? selectedLocation?.location_id : selectedLocation,
      employer_id: typeof selectedEmployer === 'object' ? selectedEmployer?.employer_id : selectedEmployer
    };
    const request = isUpdate
      ? this.workStationService.updateWorkStation(payload, this.id)
      : this.workStationService.addWorkStation(payload);

    this.submitting = true;
    request.pipe(takeUntil(this.onDestroy), finalize(() => this.submitting = false)).subscribe({
      next: response => {
        if (response.statusCode === 200 || response.statusCode === 201) {
          Swal.fire({
            title: 'Success',
            text: response.message,
            icon: 'success',
            confirmButtonColor: '#4690eb',
            confirmButtonText: 'Continue'
          }).then(() => this.dialogRef.close(true));
          return;
        }
        this.showError(response.message || 'Unable to save the workstation.');
      },
      error: (error: unknown) => this.showError(getApiErrorMessage(error, 'Unable to save the workstation.'))
    });
  }

  private showError(message: string): void {
    Swal.fire({ title: 'Error', text: message, icon: 'error', confirmButtonColor: '#4690eb', confirmButtonText: 'Close' });
  }
}
