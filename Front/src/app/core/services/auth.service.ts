import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { from, throwError } from 'rxjs';
import { API_BASE, SERVER_BASE } from '../constants/api';
import { IUser } from '../../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<IUser | null>(null);

  /** Debe llamarse UNA VEZ antes de login/register para obtener el CSRF cookie */
  getCsrfCookie() {
    return this.http.get(`${SERVER_BASE}/sanctum/csrf-cookie`);
  }

  login(email: string, password: string) {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<{ data: IUser }>(`${API_BASE}/auth/login`, { email, password })
      ),
      tap(res => {
        this.currentUser.set(res.data);
        localStorage.setItem('user_session', this.encrypt(res.data));
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  register(name: string, lastname: string, email: string, password: string, password_confirmation: string) {
    return this.getCsrfCookie().pipe(
      switchMap(() =>
        this.http.post<{ data: IUser }>(`${API_BASE}/auth/register`, {
          name, lastname, email, password, password_confirmation
        })
      ),
      tap(res => {
        this.currentUser.set(res.data);
        localStorage.setItem('user_session', this.encrypt(res.data));
      })
    );
  }

  logout() {
    return this.http.post(`${API_BASE}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        localStorage.removeItem('user_session');
      })
    );
  }

  me() {
    return this.http.get<{ data: IUser }>(`${API_BASE}/auth/me`).pipe(
      tap(res => this.currentUser.set(res.data))
    );
  }

  private encrypt(data: any): string {
    return btoa(JSON.stringify(data));
  }

  private decrypt(encrypted: string): any {
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }
}