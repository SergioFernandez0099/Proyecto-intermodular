import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Menu } from '../../components/menu/menu';
import { AuthService } from '../../core/services/auth.service';
import { UserService as AdminUserService } from '../../services/user';
import { UserService as ProfileUserService } from '../../core/services/user.service';
import { IUser } from '../../models/user';
import { ERole } from '../../models/role';
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
  private adminUserService = inject(AdminUserService);
  private profileUserService = inject(ProfileUserService);
  private translate = inject(TranslateService);

  name: string = '';
  lastname: string = '';
  currentLanguage: string = 'es';
  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isAdmin: boolean = false;

  allUsers = signal<IUser[]>([]);
  searchQuery = signal<string>('');
  showConfirmModal = signal<boolean>(false);
  selectedUserToPromote = signal<IUser | null>(null);
  adminLoading = signal<boolean>(false);
  adminMessage = signal<string>('');
  public toastState = signal<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  newPassword: string = '';
  confirmPassword: string = '';

  computed_filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.allUsers();
    }
    return this.allUsers().filter(
      (user: IUser) =>
        user.name.toLowerCase().includes(query) ||
        user.lastname.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  });
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
    this.currentLanguage = this.profileUserService.getLanguage();

    this.isAdmin = this.getIsAdminFromStorage();
    if (this.isAdmin) {
      this.loadAllUsers();
    }
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

  private getIsAdminFromStorage(): boolean {
    const encrypted = localStorage.getItem('user_session');
    if (encrypted) {
      const user = this.decrypt(encrypted) as IUser | null;
      return user?.role === ERole.admin;
    }

    const currentUser = this.authService.currentUser();
    return currentUser?.role === ERole.admin;
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

  private loadAllUsers(): void {
    this.adminUserService.getUsers().subscribe({
      next: (users: IUser[]) => {
        this.allUsers.set(users.filter((u: IUser) => u.role !== ERole.admin));
      },
      error: () => {
        this.adminMessage.set(this.translate.instant('Configuracion.admin.error'));
      },
    });
  }

  openPromoteConfirm(user: IUser): void {
    this.selectedUserToPromote.set(user);
    this.showConfirmModal.set(true);
    this.adminMessage.set('');
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.selectedUserToPromote.set(null);
  }

  async promoteToAdmin(): Promise<void> {
    const user = this.selectedUserToPromote();
    if (!user) return;

    this.adminLoading.set(true);
    try {
      const updatedUser: IUser = {
        ...user,
        role: ERole.admin,
      };
      await firstValueFrom(this.adminUserService.updateUser(updatedUser, user.id));

      this.adminMessage.set(this.translate.instant('Configuracion.admin.exito'));
      this.closeConfirmModal();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.loadAllUsers();
    } catch (error) {
      this.adminMessage.set(this.translate.instant('Configuracion.admin.error_promover'));
    } finally {
      this.adminLoading.set(false);
    }
  }
}
