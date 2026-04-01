import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {

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
}
