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

  allUsers = signal<IUser[]>([]);
  searchQuery = signal<string>('');
  showConfirmModal = signal<boolean>(false);
  selectedUserToPromote = signal<IUser | null>(null);
  adminLoading = signal<boolean>(false);
  adminMessage = signal<string>('');

  computed_filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.allUsers();
    }
    return this.allUsers().filter((user: IUser) =>
      user.name.toLowerCase().includes(query) ||
      user.lastname.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadUserData();
    this.currentLanguage = this.profileUserService.getLanguage();
    
    const currentUser = this.authService.currentUser();
    if (currentUser?.role === 'admin') {
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

  saveProfile(): void {
    if (!this.name.trim() || !this.lastname.trim()) {
      this.message = 'Por favor completa todos los campos';
      this.messageType = 'error';
      return;
    }

    this.loading = true;
    this.profileUserService.updateProfile(this.name, this.lastname).subscribe({
      next: () => {
        window.location.reload();
      },
      error: () => {
        this.message = 'Error al actualizar el perfil';
        this.messageType = 'error';
        this.loading = false;
      }
    });
  }

  changeLanguage(language: string): void {
    this.profileUserService.setLanguage(language);
    this.currentLanguage = language;
  }

  private loadAllUsers(): void {
    this.adminUserService.getUsers().subscribe({
      next: (users: IUser[]) => {
        this.allUsers.set(users.filter((u: IUser) => u.role !== 'admin'));
      },
      error: () => {
        this.adminMessage.set(this.translate.instant('Configuracion.admin.error'));
      }
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
        role: 'admin'
      };
      await firstValueFrom(this.adminUserService.updateUser(updatedUser, user.id));
      
      this.adminMessage.set(this.translate.instant('Configuracion.admin.exito'));
      this.closeConfirmModal();
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.loadAllUsers();
    } catch (error) {
      this.adminMessage.set(this.translate.instant('Configuracion.admin.error_promover'));
    } finally {
      this.adminLoading.set(false);
    }
  }
}
