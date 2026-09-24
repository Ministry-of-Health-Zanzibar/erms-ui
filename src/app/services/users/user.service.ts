import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}userAccounts`;
  private hospitalUrl = `${this.baseUrl}hospitals/internal-referral-hospitals`;

  
  private href_member = `${this.baseUrl}userAccounts/board-members`;

  constructor(private http: HttpClient) {}

  public getAllMemberList(): Observable<any> {
    return this.http.get<any>(this.href_member);
  }

  public getAllUsers(options: { page?: number; per_page?: number; search?: string } = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<any>(this.href, { params });
  }

  public addUser(user: any): Observable<any> {
    return this.http.post(this.href, user);
  }

  public getUserById(id: any) {
    return this.http.get<any>(`${this.href}/${id}`);
  }

  public updateUser(user: any,id: any): Observable<any> {
    return this.http.put(`${this.href}/${id}`, user);
  }

  public blockUser(id:any): Observable<any>{
    return this.http.delete(`${this.href}/${id}`);
  }

  public activateUser(id:any): Observable<any>{
    return this.http.get(`${this.baseUrl}unBlockUser/${id}`)
  }

  public getLogs(options: {
    page?: number;
    per_page?: number;
    search?: string;
    action?: string;
    module?: string;
    user_id?: number;
    entity_id?: number;
    patient_history_id?: number;
    patient_id?: number;
    date_from?: string;
    date_to?: string;
  } = {}): Observable<any>{
    let params = new HttpParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get(`${this.baseUrl}audit-logs`, { params });
  }

  public getAuditLog(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}audit-logs/${id}`);
  }

  // assign hospital to user
  public assignHospitalToUser(userId: number, payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}users/${userId}/assign-hospital`, payload);
  }

  // Optional: method to fetch hospitals
  public getHospitals(): Observable<any> {
    return this.http.get(`${this.hospitalUrl}`);
  }

   resetPassword(userId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });

    return this.http.post(
      `${this.baseUrl}resetPassword`,
      { user_id: userId },
      { headers }
    );
  }


}
