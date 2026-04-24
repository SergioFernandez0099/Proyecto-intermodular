import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Footer } from '../../components/footer/footer';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { AuthService } from '../../core/services/auth.service';

// Validador personalizado para confirmar contraseñas
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('password_confirmation');
  if (password && confirm && password.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

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
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(8)]],
    }, { validators: passwordMatchValidator });
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'warning') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.modalConfig = { show: true, title, message, type };

    this.toastTimeout = setTimeout(() => {
      this.modalConfig.show = false;

      if (type === 'success') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      if (this.registerForm.errors?.['passwordMismatch']) {
        this.showToast('Error', 'Las contraseñas no coinciden.', 'error');
      } else if (this.registerForm.get('password')?.errors?.['minlength'] || this.registerForm.get('password_confirmation')?.errors?.['minlength']) {
        this.showToast('Error', 'La contraseña debe tener al menos 8 caracteres.', 'error');
      } else {
        this.showToast('Campos', 'Por favor rellene todos los campos correctamente.', 'warning');
      }
      return;
    }

    const formValue = this.registerForm.value;
    this.authService.register(formValue.name, formValue.lastname, formValue.email, formValue.password, formValue.password_confirmation).subscribe({
      next: (res: any) => {
        this.showToast('Éxito', 'Usuario registrado correctamente.', 'success');
      },
      error: (err) => {
        this.showToast(
          'Error de registro',
          err?.error?.message || 'El email ya existe o el servidor falló.',
          'error',
        );
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
