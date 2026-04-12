import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {

  constructor(private router: Router) {}
  userName: string = 'Usuario';
  userEmail: string = '';
  userRole: string = 'Lector';
  userInitial: string = 'U';

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const sessionData = localStorage.getItem('user_session');
    
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        
        this.userName = user.name || '';
        this.userEmail = user.email || '';
        this.userRole = user.role || '';

        if (this.userEmail && this.userEmail.length > 0) {
          this.userInitial = this.userEmail.charAt(0).toUpperCase();
        }

      } catch (error) {
        console.error('Error al parsear user_session desde localStorage:', error);
      }
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goExplorar() {
    this.router.navigate(['/explorar']);
  }

  goMisLibros() {
    this.router.navigate(['/mis-libros']);
  }

  goPrestamos() {
    this.router.navigate(['/prestamos']);
  }

  goAnyadirLibro() {
    this.router.navigate(['/añadir-libro']);
  }
}
