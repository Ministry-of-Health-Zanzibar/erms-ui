import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';



@Injectable({
  providedIn: 'root'
})
export class ReferralService {

  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}referrals`;
  private href_byid = `${this.baseUrl}patient-histories`;
  private bill = `${this.baseUrl}bills`;
  private comment = `${this.baseUrl}referralLetters/comment/referral`;
  private href_withBill = `${this.baseUrl}referralwithbills`;
  private href_letter = `${this.baseUrl}referralLetters`;
  private referralFlights = `${this.baseUrl}referral-flights`;

  constructor(private http: HttpClient) {}

  public addReferralLetter(referral: any): Observable<any> {
    return this.http.post(this.href_letter,referral);
  }

  getReportById(id: number) {
    return this.http.get(`${this.baseUrl}reports/showEverythingByReferralId/${id}`);
  }

  public addReferralFlight(data: any): Observable<any> {
    return this.http.post(
      this.referralFlights,
      data
    );
  }

  /**
 * Get flight information for a referral
 */
public getReferralFlights(referralId: number): Observable<any> {
  return this.http.get(
    `${this.referralFlights}/referral/${referralId}`
  );
}

public getReferralFlight(id: number): Observable<any> {
  return this.http.get(
    `${this.referralFlights}/${id}`
  );
}

public updateReferralFlight(
  id: number,
  data: any
): Observable<any> {
  return this.http.put(
    `${this.referralFlights}/${id}`,
    data
  );
}

public deleteReferralFlight(id: number): Observable<any> {
  return this.http.delete(
    `${this.referralFlights}/${id}`
  );
}

  public getAllRefferal(): Observable<any> {
    return this.http.get<any>(this.href);
  }

  public getReferralById(
    id: any,
    type: 'referral' | 'history' = 'referral'
  ): Observable<any> {
  
    const params = new HttpParams()
      .set('type', type);
  
    return this.http.get<any>(
      `${this.href}/${id}`,
      { params }
    );
  }

  public getReferralsById(id: any): Observable<any> {
    return this.http.get<any>(`${this.href_byid}/${id}`);
  }

  public addReferral(referral: any): Observable<any> {
    return this.http.post(this.href,referral);
  }

  public deleteReferral(id:any): Observable<any>{
    return this.http.delete(`${this.href}/${id}`);
  }

  public updateReferral(referral:any, id:any): Observable<any>{
    return this.http.patch(`${this.href}/${id}`,referral)
  }

  public unblockReferral(id: any): Observable<any> {
    return this.http.patch(`${this.href}/unBlock/${id}`, {});
  }

  public getReferralwithBills(): Observable<any> {
    return this.http.get<any>(this.href_withBill);
  }

  public getBillById(id: any): Observable<any> {
    return this.http.get<any>(`${this.bill}/${id}`);
  }

  public getCommentById(id: any): Observable<any> {
    return this.http.get<any>(`${this.comment}/${id}`);
  }

}
