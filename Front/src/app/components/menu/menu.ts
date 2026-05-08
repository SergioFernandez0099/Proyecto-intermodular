import { Component, HostListener, inject, OnInit } from '@angular/core';
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
  isAdmin: boolean = false;

  // Control de colapso
  isCollapsed = false;

  ngOnInit(): void {
    this.loadUserData();
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
  if (window.innerWidth >= 769) {
    this.isCollapsed = false; 
  } else {
    this.isCollapsed = true;  
  }
}

  toggleMenu(): void {
    if (window.innerWidth < 769) {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  private loadUserData(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.userName = user.name;
      this.userEmail = user.email;
      this.userRole = user.role === 'admin' ? 'Administrador' : 'Lector';
      this.userInitial = user.name.charAt(0).toUpperCase();
      this.isAdmin = user.role === 'admin';
    } else {
      const encrypted = localStorage.getItem('user_session');
      if (encrypted) {
        const user = this.decrypt(encrypted);
        if (user) {
          this.userName = user.name;
          this.userEmail = user.email;
          this.userRole = user.role === 'admin' ? 'Administrador' : 'Lector';
          this.userInitial = user.name.charAt(0).toUpperCase();
          this.isAdmin = user.role === 'admin';
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

  public goDashboard() { this.router.navigate(['/dashboard']); }
  public goExplorar() { this.router.navigate(['/explorar']); }
  public goMisLibros() { this.router.navigate(['/misLibros']); }
  public goPrestamos() { this.router.navigate(['/prestamos']); }
  public goAnyadirLibro() { this.router.navigate(['/añadirLibro']); }
  public goConfiguracion() { this.router.navigate(['/configuracion']); }
  public goPanelAdmin() { this.router.navigate(['/panelAdmin']); }

  public logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
