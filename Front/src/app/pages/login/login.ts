import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Footer } from '../../components/footer/footer';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, Footer, RouterLink, Header],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loginData = { email: '', password: '' }; 
  modalConfig = {
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning'
  };

  toastTimeout: any;

  constructor(private userService: UserService, private router: Router) {}
  

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning', callback?: () => void) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.modalConfig = { show: true, title, message, type };

    this.toastTimeout = setTimeout(() => {
      this.modalConfig.show = false;
      if (callback) callback();
    }, 3000);
  }

  onLogin() { 
  const { email, password } = this.loginData;

  if (!email || !password) {
    this.showToast('Atención', 'Rellena todos los campos', 'warning');
    return;
  }

  this.userService.loginUser({ email, password }).subscribe({
    next: (res: any) => {
      this.showToast('¡Bienvenido!', 'Sesión iniciada correctamente', 'success', () => {
        localStorage.setItem('user_session', JSON.stringify(res.user));
        this.router.navigate(['/register']); 
      });
    },
    error: (err) => {
      const errorMsg = err.error?.message || 'Error de conexión';
      this.showToast('Error de Login', errorMsg, 'error');
    }
  });
}
}