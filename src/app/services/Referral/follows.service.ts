import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class FollowsService {
   private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}hospital-letters`;

constructor(private http: HttpClient) {}
  //body list

    public getFollowListById(id: any) {
    return this.http.get<any>(`${this.baseUrl}hospital-letters/followup-by-referral-id/${id}`);
  }
   public getAllBodyList(): Observable<any> {
    return this.http.get<any>(this.href);
  }

    public addBodyList(Partient: any): Observable<any> {
    return this.http.post(this.href, Partient);
  }


    public addFollowform(follow: any): Observable<any> {
    return this.http.post(this.href, follow);
  }

  public reviewFollowUpApproval(letterId: number, payload: { decision: 'confirmed' | 'rejected'; comments?: string }): Observable<any> {
    return this.http.post(
      `${this.href}/${letterId}/follow-up-approval`,
      payload,
    );
  }

    public deletePatientList(id:any): Observable<any>{
    return this.http.delete(`${this.href}/${id}`);
  }

  public updatePartientList(patient:any, id:any): Observable<any>{
    return this.http.post(`${this.href}/update/${id}`,patient)
  }

  public unblockPatientList(data: any, id:any): Observable<any>{
    return this.http.patch(`${this.href}/body-form/${id}`,data)
  }


}
