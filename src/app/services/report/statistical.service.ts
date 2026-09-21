import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class StatisticalService {

  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}reports/referralByHospital`;

  private workflowcount = `${this.baseUrl}reports/workflowStatusReport`;

  private href_statistical = `${this.baseUrl}getClientComplainReports`;
  private href_reasons = `${this.baseUrl}reports/referralsByType`;




  constructor(private http: HttpClient) { }

  public getHospitalCount(): Observable<any> {
    return this.http.get<any>(this.href);
  }
    public getCount(): Observable<any> {
    return this.http.get<any>(this.href);
  }

   public getWorkFlowCount(): Observable<any> {
    return this.http.get<any>(this.workflowcount);
  }
   public getTypeCount(): Observable<any> {
    return this.http.get<any>(this.href_reasons);
  }

  public getClientReport(): Observable<any> {
    return this.http.get<any>(this.href_statistical);
  }

  public getReferralPerMonthReport(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}referralPerMonthReport`);
  }

  public getReferralReport(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}hospitalCountReport`);
  }

  public getComplainReports(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}complainReports`);
  }
}
