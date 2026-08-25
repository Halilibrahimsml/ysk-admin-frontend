import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://ysk-admin-backend-production.up.railway.app/api/auth/login';

  constructor(private http: HttpClient) {}

  // İsteği atan metodumuz
  login(loginBilgileri: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, loginBilgileri);
  }
}


