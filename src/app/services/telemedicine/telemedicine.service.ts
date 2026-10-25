import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class TelemedicineService {
  private readonly baseUrl = `${environment.baseUrl}telemedicine`;

  constructor(private readonly http: HttpClient) {}

  getRequests(options: { page?: number; per_page?: number; search?: string; status?: string; request_type?: string } = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<any>(`${this.baseUrl}/requests`, { params, headers: { 'X-Skip-Cache': 'true' } });
  }

  searchPatients(search: string): Observable<any> {
    const params = new HttpParams().set('search', search).set('per_page', '15');
    return this.http.get<any>(`${this.baseUrl}/patients`, { params, headers: { 'X-Skip-Cache': 'true' } });
  }

  getHospitals(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/hospitals`, { headers: { 'X-Skip-Cache': 'true' } });
  }

  getCoordinators(hospitalId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/hospitals/${hospitalId}/coordinators`, { headers: { 'X-Skip-Cache': 'true' } });
  }

  getDoctors(hospitalId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/hospitals/${hospitalId}/doctors`, { headers: { 'X-Skip-Cache': 'true' } });
  }

  createRequest(payload: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/requests`, payload);
  }

  schedule(requestId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/requests/${requestId}/appointment`, payload);
  }

  reviewAppointment(requestId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/requests/${requestId}/appointment-decision`, payload);
  }

  uploadReport(requestId: number, payload: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/requests/${requestId}/report`, payload);
  }

  recordDecision(requestId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/requests/${requestId}/decision`, payload);
  }

  getFile(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }
}
