import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Footer } from '../../components/footer/footer';
import { RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, TranslateModule,FormsModule, Footer, RouterLink, Header],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
 
})
export class Login {


  loginData = {
    email: '',
    password: ''
  };
}
