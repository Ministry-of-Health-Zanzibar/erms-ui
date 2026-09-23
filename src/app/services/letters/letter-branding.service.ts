import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface LetterBrandingState {
  signature_path: string;
  stamp_path: string;
  signature_url: string;
  stamp_url: string;
  using_default_signature: boolean;
  using_default_stamp: boolean;
  updated_at?: string | null;
  updated_by?: {
    full_name?: string;
    email?: string;
  } | null;
}

interface LetterBrandingResponse {
  data: LetterBrandingState;
  message?: string;
  statusCode: number;
}

@Injectable({ providedIn: 'root' })
export class LetterBrandingService {
  private readonly endpoint = `${environment.baseUrl}letter-branding`;

  constructor(private readonly http: HttpClient) {}

  get(): Observable<LetterBrandingResponse> {
    return this.http.get<LetterBrandingResponse>(this.endpoint);
  }

  update(signature: File | null, stamp: File | null): Observable<LetterBrandingResponse> {
    const body = new FormData();

    if (signature) {
      body.append('signature', signature, signature.name);
    }

    if (stamp) {
      body.append('stamp', stamp, stamp.name);
    }

    return this.http.post<LetterBrandingResponse>(this.endpoint, body);
  }

  reset(): Observable<LetterBrandingResponse> {
    return this.http.delete<LetterBrandingResponse>(this.endpoint);
  }
}
