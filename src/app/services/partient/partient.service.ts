import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class PartientService {
  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}patients`;
  private hrefe = `${this.baseUrl}`;

  private baseForBoard = `${this.baseUrl}patient-lists`;

  private href_for_addreferral = `${this.baseUrl}patient-histories/allowed-to-assign/patients`;

  private hrefee = `${this.baseUrl}patients/patients-for-referral`;
  private href_bodylist = `${this.baseUrl}patient-lists`;
  private href_insurances = `${this.baseUrl}insurances`;
  private href_patientInsurance = `${this.baseUrl}patients-withinsurance`;

  private addMultiple = `${this.baseUrl}patient-lists/assign-patients`;

  constructor(private http: HttpClient) {}

  public addBodyList(formData: any): Observable<any> {
    return this.http.post(this.href_bodylist, formData);
  }

  public addPatientfromBodyList(patient: any): Observable<any> {
    return this.http.post(this.href, patient);
  }

  public deletePatientList(id: any): Observable<any> {
    return this.http.delete(`${this.href_bodylist}/${id}`);
  }

  public updatePartientList(patient: any, id: any): Observable<any> {
    return this.http.post(`${this.href_bodylist}/update/${id}`, patient);
  }

  public unblockPatientList(data: any, id: any): Observable<any> {
    return this.http.patch(`${this.href_bodylist}/body-form/${id}`, data);
  }

  public getBodyListById(id: any) {
    return this.http.get<any>(`${this.href_bodylist}/body-form/${id}`);
  }

  public getPartients(): Observable<any> {
    return this.http.get<any>(this.href);
  }

  public getAllPatients(): Observable<any> {
    return this.http.get<any>(this.href);
  }

  /** Lightweight data for the patient table; detail screens keep the full API. */
  public getPatientList(): Observable<any> {
    return this.http.get<any>(this.href, { params: { summary: '1' } });
  }

  public getBodyList(): Observable<any> {
    return this.http.get<any>(this.href_bodylist);
  }


  public getAllPartientforReferral(): Observable<any> {
    // This queue is changed by hospital users in other sessions, so it must be
    // fresh whenever the Medical Board opens the assignment dialog.
    return this.http.get<any>(this.href_for_addreferral, {
      headers: { 'X-Skip-Cache': 'true' },
    });
  }

  public getAllPartientsForReferal(): Observable<any> {
    return this.http.get<any>(this.hrefee);
  }

  public addPartient(Partient: any): Observable<any> {
    return this.http.post(`${this.href}/storePatientAndHistory`, Partient);
  }

  public getPartientById(id: any) {
    return this.http.get<any>(`${this.hrefe}patient-histories/${id}`);
  }

  public getPartientHistoryListById(id: any) {
    return this.http.get<any>(`${this.href}/histories/${id}`);
  }

  updateStatus(id: any, payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}patient-histories/update-status/${id}`,
      payload,
    );
  }

  public forwardToDG(id: number, comment: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}patient-histories/${id}/mkurugenzi-tiba`,
      comment,
    );
  }

  public showForUpdate(patientId: number): Observable<any> {
    return this.http.get(`${this.hrefe}patients/showForUpdate/${patientId}`);
  }

  updatePatient(patient_id: number, data: FormData) {
    return this.http.post(`${this.hrefe}patients/updatePatientAndHistory/${patient_id}`,data);
  }

  public deletePatients(id: any): Observable<any> {
    return this.http.delete(`${this.href}/${id}`);
  }

  public unblockPatients(data: any, id: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}patients/unBlock/${id}`, data);
  }

  public deletePatient(id: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}patient-lists/${id}`);
  }
  public unblockPatient(id: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}patient-lists/unblock/${id}`, {});
  }

  public updatePartient(patient: any, id: number): Observable<any> {
    return this.http.post(`${this.href}/update/${id}`, patient);
  }

  public addMultiplePartient(patient: any, id: number): Observable<any> {
    return this.http.post(`${this.addMultiple}/${id}`, patient);
  }

  public updateMedicalBoard(
    patient: any,
    patient_list_id: any,
  ): Observable<any> {
    return this.http.post(
      `${this.baseForBoard}/update/${patient_list_id}`,
      patient,
    );
  }

  //insurances
  public addInsurances(insurance: any): Observable<any> {
    return this.http.post(this.href_insurances, insurance);
  }

  public uploadInsurances(insurance: any): Observable<any> {
    const req = new HttpRequest('POST', this.href_insurances, insurance, {
      reportProgress: true, // Enable progress tracking
    });
    return this.http.request(req).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Calculate and log progress percentage
          if (event.total) {
            const percentDone = Math.round((100 * event.loaded) / event.total);
          }
        } else if (event.type === HttpEventType.Response) {
        }
      }),
    );
  }

  public getPatientInsurances(id: any) {
    return this.http.get<any>(`${this.href_patientInsurance}/${id}`); // adjust endpoint as needed
  }
  public unblockPatientInsurances(data: any, id: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}patients/unblock/${id}`, data);
  }

  public searchPatientEligibility(payload: any) {
    return this.http.post(
      `${environment.baseUrl}patients/search-eligibility`,
      payload,
    );
  }
}
