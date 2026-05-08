import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ERole } from '../../models/role';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.currentUser();
    if (user?.role === ERole.admin) {
      return true;
    }

    // Fallback: check localStorage
    const encrypted = localStorage.getItem('user_session');
    if (encrypted) {
      try {
        const stored = JSON.parse(atob(encrypted));
        if (stored?.role === ERole.admin) {
          return true;
        }
      } catch {
        // ignore
      }
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
