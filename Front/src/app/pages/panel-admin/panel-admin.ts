import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Menu } from '../../components/menu/menu';
import { UserService } from '../../services/user';
import { IUser } from '../../models/user';
import { ERole } from '../../models/role';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, Menu],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdmin implements OnInit {
  private userService = inject(UserService);
  private translate = inject(TranslateService);

  allUsers = signal<IUser[]>([]);
  searchQuery = signal<string>('');
  loading = signal<boolean>(false);
  pageMessage = signal<string>('');
  pageMessageType = signal<'success' | 'error'>('success');

  // Promote modal
  showPromoteModal = signal<boolean>(false);
  selectedUserToPromote = signal<IUser | null>(null);

  // Deactivate/activate modal
  showToggleModal = signal<boolean>(false);
  selectedUserToToggle = signal<IUser | null>(null);

  computed_filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.allUsers();
    return this.allUsers().filter(
      (u: IUser) =>
        u.name.toLowerCase().includes(query) ||
        u.lastname.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users: IUser[]) => {
        this.allUsers.set(users.filter((u: IUser) => u.role !== ERole.admin));
      },
      error: () => {
        this.showMessage(this.translate.instant('PanelAdmin.error_cargar'), 'error');
      },
    });
  }

  // --- Promote to admin ---
  openPromoteModal(user: IUser): void {
    this.selectedUserToPromote.set(user);
    this.showPromoteModal.set(true);
  }

  closePromoteModal(): void {
    this.showPromoteModal.set(false);
    this.selectedUserToPromote.set(null);
  }

  promoteToAdmin(): void {
    const user = this.selectedUserToPromote();
    if (!user) return;
    this.loading.set(true);
    const updated: IUser = { ...user, role: ERole.admin };
    this.userService.updateUser(updated, user.id).subscribe({
      next: () => {
        this.showMessage(this.translate.instant('PanelAdmin.exito_promover'), 'success');
        this.closePromoteModal();
        this.loadUsers();
      },
      error: () => {
        this.showMessage(this.translate.instant('PanelAdmin.error_promover'), 'error');
      },
      complete: () => this.loading.set(false),
    });
  }

  // --- Deactivate / activate ---
  openToggleModal(user: IUser): void {
    this.selectedUserToToggle.set(user);
    this.showToggleModal.set(true);
  }

  closeToggleModal(): void {
    this.showToggleModal.set(false);
    this.selectedUserToToggle.set(null);
  }

  toggleUserActive(): void {
    const user = this.selectedUserToToggle();
    if (!user) return;
    this.loading.set(true);
    const action$ = user.active
      ? this.userService.deactivateUser(user.id)
      : this.userService.activateUser(user.id);
    const successKey = user.active ? 'PanelAdmin.exito_baja' : 'PanelAdmin.exito_alta';
    action$.subscribe({
      next: () => {
        this.showMessage(this.translate.instant(successKey), 'success');
        this.closeToggleModal();
        this.loadUsers();
      },
      error: () => {
        this.showMessage(this.translate.instant('PanelAdmin.error_toggle'), 'error');
      },
      complete: () => this.loading.set(false),
    });
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.pageMessage.set(msg);
    this.pageMessageType.set(type);
    setTimeout(() => this.pageMessage.set(''), 4000);
  }
}

