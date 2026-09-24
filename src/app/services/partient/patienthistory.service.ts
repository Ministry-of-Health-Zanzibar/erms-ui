import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PatienthistoryService {
  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}patientsHistories`;

  constructor(private http: HttpClient) {}
  
  public getBodyList(options: { page?: number; per_page?: number; search?: string; status?: string } = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<any>(this.href, { params });
  }

  public getAllBodyList(options: { page?: number; per_page?: number; search?: string; status?: string } = {}): Observable<any> {
    return this.getBodyList(options);
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
