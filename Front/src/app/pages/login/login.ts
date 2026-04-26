import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Footer } from '../../components/footer/footer';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs';

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

  isLoading = false;
  toastTimeout: any;

  constructor(private authService: AuthService, private router: Router) {}
  

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning', callback?: () => void) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.modalConfig = { show: true, title, message, type };

    this.toastTimeout = setTimeout(() => {
      this.modalConfig.show = false;
      if (callback) callback();
    },3000);
  }

  onLogin() { 
  const { email, password } = this.loginData;

  if (!email || !password) {
    this.showToast('Atención', 'Rellena todos los campos', 'warning');
    return;
  }

  this.isLoading = true;

  this.authService.login(email, password).subscribe({
    next: (res: any) => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      this.isLoading = false; // IMPORTANTE: Primero desbloqueamos la UI
      
      // Intentamos capturar el mensaje exacto que enviaste antes
      const errorMsg = err.error?.errors?.['email or password']?.[0] || 'Credenciales incorrectas';
      
      this.showToast('Error de Login', errorMsg, 'error');
    }
  });
}
}