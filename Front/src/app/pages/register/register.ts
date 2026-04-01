import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Footer } from '../../components/footer/footer';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule, Footer, RouterLink, Header],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  showPassword = false;
  toastTimeout: any;

  modalConfig = {
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning',
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.modalConfig = { show: true, title, message, type };

    this.toastTimeout = setTimeout(() => {
      this.modalConfig.show = false;

      if (type === 'success') {
        this.router.navigate(['']);
      }
    });
  }

  onSubmit() {
    const { password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.showToast('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.showToast('Campos  ', 'Por favor rellene todos los campos.', 'warning');
      return;
    }

    if (this.registerForm.valid) {
      const newUser = {
        name: `${this.registerForm.value.name} ${this.registerForm.value.lastname}`,
        email: this.registerForm.value.email,
        password: password,
        role: 'user',
      };

      this.userService.createUser(newUser).subscribe({
        next: () => {
          this.showToast('Éxito', 'Usuario registrado correctamente.', 'success');
        },

        error: (err) => {
          //console.log('ERROR BACKEND:', err);

          this.showToast(
            'Error de registro',
            err?.error?.message || 'El email ya existe o el servidor falló.',
            'error',
          );
        },
      });
    } else {
      this.showToast('Atención', 'Rellena todos los campos correctamente.', 'warning');
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
