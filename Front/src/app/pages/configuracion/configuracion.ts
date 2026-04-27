import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Menu } from '../../components/menu/menu';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
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
  private userService = inject(UserService);
  private translate = inject(TranslateService);

  name: string = '';
  lastname: string = '';
  currentLanguage: string = 'es';
  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loadUserData();
    this.currentLanguage = this.userService.getLanguage();
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
    this.userService.updateProfile(this.name, this.lastname).subscribe({
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
    this.userService.setLanguage(language);
    this.currentLanguage = language;
  }
}
