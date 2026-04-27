import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Explorar } from './pages/explorar/explorar';
import { Configuracion } from './pages/configuracion/configuracion';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { AnyadirLibro } from './pages/anyadir-libro/anyadir-libro';
import { MisLibros } from './pages/mis-libros/mis-libros';

export const routes: Routes = [

    { path: '', component: Login, canActivate: [NoAuthGuard] },
    { path: 'register', component: Register, canActivate: [NoAuthGuard] },
    { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
    { path: 'explorar', component: Explorar, canActivate: [AuthGuard] },
    { path: 'configuracion', component: Configuracion, canActivate: [AuthGuard] },
    { path: 'añadirLibro', component: AnyadirLibro, canActivate: [AuthGuard] },
    { path: 'misLibros', component: MisLibros, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '' }
];
