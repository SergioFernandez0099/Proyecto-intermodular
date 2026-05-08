import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Menu } from '../../components/menu/menu';
import { AuthService } from '../../core/services/auth.service';
import { UserService as ProfileUserService } from '../../core/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, Menu],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  private authService = inject(AuthService);
  private profileUserService = inject(ProfileUserService);
  private translate = inject(TranslateService);

  name: string = '';
  lastname: string = '';
  currentLanguage: string = 'es';
  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  public toastState = signal<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.currentLanguage = this.profileUserService.getLanguage();
  }

  private loadUserData(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.name = user.name;
      this.lastname = user.lastname;
    } else {
      const encrypted = localStorage.getItem('user_session');
      if (encrypted) {
        const user = this.decrypt(encrypted);
        if (user) {
          this.name = user.name;
          this.lastname = user.lastname;
        }
      }
    }
  }

  private decrypt(encrypted: string): any {
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }

 saveProfile(): void {
  if (!this.name.trim() || !this.lastname.trim()) {
    this.showToast(
      this.translate.instant('error.warning_title'),
      this.translate.instant('error.fill_fields'),
      'warning'
    );
    return;
  }

  let pass: string | undefined = undefined;
  let passConf: string | undefined = undefined;

  if (this.newPassword || this.confirmPassword) {
    if (this.newPassword !== this.confirmPassword) {
      this.showToast(this.translate.instant('error.title'), this.translate.instant('error.password_mismatch'), 'error');
      return;
    }
    if (this.newPassword.length < 8) {
      this.showToast(this.translate.instant('error.title'), this.translate.instant('error.password_min'), 'error');
      return;
    }
    pass = this.newPassword;
    passConf = this.confirmPassword;
  }

  this.loading = true;

  // 3. Llamada al servicio
  this.profileUserService.updateProfile(this.name, this.lastname, pass, passConf).subscribe({
    next: () => {
      this.loading = false;
      this.showToast(
        this.translate.instant('error.success_title'),
        this.translate.instant('error.success_msg'),
        'success'
      );

      if (pass) {
        setTimeout(() => {
          this.authService.logout().subscribe({
            next: () => this.router.navigate(['/']),
            error: () => {
              localStorage.clear();
              this.router.navigate(['/']);
            }
          });
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    },
    error: (err) => {
      this.loading = false;
      console.error(err);
      const backendError = err.error?.errors?.password?.[0];
      const errorMessage = backendError || this.translate.instant('error.generic');
      this.showToast(this.translate.instant('error.title'), errorMessage, 'error');
    }
  });
}

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning'): void {
    this.toastState.set({ title, message, type });

    setTimeout(() => {
      this.closeToast();
    }, 3000);
  }

  closeToast(): void {
    this.toastState.set(null);
  }
  changeLanguage(language: string): void {
    this.profileUserService.setLanguage(language);
    this.currentLanguage = language;
  }
}
