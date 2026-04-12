import { Component } from '@angular/core';
import { Menu } from '../../components/menu/menu';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Menu],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

}
