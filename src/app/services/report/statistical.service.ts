import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class StatisticalService {

  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}reports/referralByHospital`;

  private workflowcount = `${this.baseUrl}reports/workflowStatusReport`;
  private caseStatusTrackingUrl = `${this.baseUrl}reports/caseStatusTracking`;

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

  public getCaseStatusTracking(filters: Record<string, unknown> = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((item) => params = params.append(key + '[]', String(item)));
      } else {
        params = params.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
      }
    });
    return this.http.get<any>(this.caseStatusTrackingUrl, { params, headers: { 'X-Skip-Cache': 'true' } });
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
