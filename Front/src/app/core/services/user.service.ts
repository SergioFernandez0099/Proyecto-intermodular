import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { API_BASE } from '../constants/api';
import { IUser } from '../../models/user';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  updateProfile(name: string, lastname: string) {
    return this.http.put<{ data: IUser }>(`${API_BASE}/auth/me`, {
      name,
      lastname
    }).pipe(
      tap(res => {
        localStorage.setItem('user_session', this.encrypt(res.data));
      })
    );
  }

  setLanguage(language: string) {
    this.translate.use(language);
    localStorage.setItem('language', language);
  }

  getLanguage(): string {
    return localStorage.getItem('language') || 'es';
  }

  private encrypt(data: any): string {
    return btoa(JSON.stringify(data));
  }
}
