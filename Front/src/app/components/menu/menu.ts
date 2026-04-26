import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {

  constructor(private router: Router) {}
  private authService = inject(AuthService);
  userName: string = 'Usuario';
  userEmail: string = '';
  userRole: string = 'Lector';
  userInitial: string = 'U';

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.userName = user.name;
      this.userEmail = user.email;
      this.userRole = user.role === 'admin' ? 'Administrador' : 'Lector';
      this.userInitial = user.name.charAt(0).toUpperCase();
    } else {
      // Si no hay, intentar cargar de localStorage
      const encrypted = localStorage.getItem('user_session');
      if (encrypted) {
        const user = this.decrypt(encrypted);
        if (user) {
          this.userName = user.name;
          this.userEmail = user.email;
          this.userRole = user.role === 'admin' ? 'Administrador' : 'Lector';
          this.userInitial = user.name.charAt(0).toUpperCase();
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

  public isActive(route: string): boolean {
    return this.router.url === route;
  }

  public goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  public goExplorar() {
    this.router.navigate(['/explorar']);
  }

  public goMisLibros() {
    this.router.navigate(['/misLibros']);
  }

  public goPrestamos() {
    this.router.navigate(['/prestamos']);
  }

  public goAnyadirLibro() {
    this.router.navigate(['/añadirLibro']);
  }

  public logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
