import { Routes } from '@angular/router';
import { LoginComponent } from './login/login'; 
import { OgrenciListeComponent } from './ogrenci-liste/ogrenci-liste'; 
import { authGuard } from './auth-guard'; 
import { ProfilimComponent } from './profilim/profilim'; // <-- Dosya yolunu düzelttik

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, 
  { path: 'login', component: LoginComponent },
  { path: 'ogrenciler', component: OgrenciListeComponent, canActivate: [authGuard] },
  { path: 'profilim', component: ProfilimComponent , canActivate: [authGuard]} 
];