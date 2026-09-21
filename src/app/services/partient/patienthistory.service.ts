import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PatienthistoryService {
  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}patientsHistories`;

  constructor(private http: HttpClient) {}
  
  // Haina haja ya page wala perPage tena, inaleta orodha nzima
  public getBodyList(): Observable<any> {
    return this.http.get<any>(this.href);
  }

  // Unaweza kuacha hii kwa usalama kama bado inaitwa sehemu nyingine
  public getAllBodyList(): Observable<any> {
    return this.http.get<any>(this.href);
  }

  public addBodyList(formData: any): Observable<any> {
    return this.http.post(this.href, formData);
  }

  public addPatientfromBodyList(patient: any): Observable<any> {
    return this.http.post(this.href, patient);
  }

  public deletePatientList(id: any): Observable<any> {
    return this.http.delete(`${this.href}/${id}`);
  }

  public updatePartientList(patient: any, id: any): Observable<any> {
    return this.http.post(`${this.href}/update/${id}`, patient);
  }

  public unblockPatientList(data: any, id: any): Observable<any> {
    return this.http.patch(`${this.href}/body-form/${id}`, data);
  }

  public getBodyListById(id: any) {
    return this.http.get<any>(`${this.href}/body-form/${id}`);
  }
}