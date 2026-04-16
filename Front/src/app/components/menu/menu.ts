import { Component, inject } from '@angular/core';
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
export class Menu {

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
    this.authService.me().subscribe({
      next: (user) => {
        this.userName = user.data.name;
        this.userEmail = user.data.email;
        this.userRole = user.data.role;
        this.userInitial = user.data.name.charAt(0).toUpperCase();
      },
      error: (err) => console.error(err)
    });
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
    this.router.navigate(['/mis-libros']);
  }

  public goPrestamos() {
    this.router.navigate(['/prestamos']);
  }

  public goAnyadirLibro() {
    this.router.navigate(['/añadir-libro']);
  }
}
