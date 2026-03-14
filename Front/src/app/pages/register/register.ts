import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Footer } from '../../components/footer/footer';
import { RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-register',
  imports: [CommonModule, TranslateModule,FormsModule, Footer, RouterLink, Header],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

}
