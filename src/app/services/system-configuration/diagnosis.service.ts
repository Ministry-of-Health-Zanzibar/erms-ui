import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable,tap} from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class DiagnosisService {

  private baseUrl: string = `${environment.baseUrl}`;
  private href = `${this.baseUrl}diagnoses`;
  private href_upload = `${this.baseUrl}diagnoses/import`;

  constructor(private http: HttpClient) {}

  searchDiagnosis(query: string) {
    const params = { q: query };
    return this.http.get<any>(`${this.href}/search`, { params });
  }

  public getAllDiagnosis(): Observable<any> {
    return this.http.get<any>(`${this.href}`);
  }

  public getDiagnosises(): Observable<any> {
    return this.http.get<any>(`${this.href}`);
  }

  public addDiagnoses(diagnosis: any): Observable<any> {
    return this.http.post(this.href, diagnosis);
  }

  public addDiagnosis(diagnosis: any): Observable<any> {
    const req = new HttpRequest('POST', this.href_upload, diagnosis, {
      reportProgress: true // Enable progress tracking
    });
    return this.http.request(req)
      .pipe(
        tap(event => {
          if (event.type === HttpEventType.UploadProgress) {
            // Calculate and log progress percentage
            if (event.total) {
              const percentDone = Math.round((100 * event.loaded) / event.total);
            }
          } else if (event.type === HttpEventType.Response) {
          }
        })
      )
  }

  public deleteDiagnosis(id:any): Observable<any>{
    return this.http.delete(`${this.href}/${id}`);
  }

  public unblockDiagnosis(id: any): Observable<any> {
  return this.http.post(`${this.href}/restore/${id}`, {});
}

  public updateDiagnosis(user:any, id:any): Observable<any>{
    return this.http.patch(`${this.href}/${id}`,user)
  }

  public getDiagnosis(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}diagnoses`);
  }
}

