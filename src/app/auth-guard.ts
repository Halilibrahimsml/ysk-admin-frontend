import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // LocalStorage'da 'girisYapildi' anahtarı var mı diye bakıyoruz
  if (localStorage.getItem('girisYapildi') === 'true') {
    return true; // Kartı var, içeri al
  } else {
    router.navigate(['/login']); // Kartı yok, logine geri fırlat
    return false; // İçeri alma
  }
};