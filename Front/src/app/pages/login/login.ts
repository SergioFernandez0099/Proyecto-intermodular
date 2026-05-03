import { Component, signal } from '@angular/core';
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
  toast = signal<{ message: string; type: 'error' | 'success' | 'warning'} | null>(null);


  constructor(private authService: AuthService, private router: Router) {}
  

  onLogin() { 
    const { email, password } = this.loginData;

    if (!email || !password) {
      this.showToast('Rellena todos los campos', 'warning');  
      return;
    }

    this.isLoading = true;

    this.authService.login(email, password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
      this.isLoading = false;

      console.log('LOGIN ERROR:', err); // debug útil

      const errorMsg =
        err?.error?.errors?.['email or password']?.[0] ||
        err?.error?.message ||
        'Credenciales incorrectas';

      this.showToast(errorMsg, 'error');
      }
    });
  }
  private showToast(message: string, type: 'error' | 'success' | 'warning') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000); 
  }
}