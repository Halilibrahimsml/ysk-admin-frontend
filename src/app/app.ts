import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// 1. Bizim hazırladığımız tablo sayfasını projeye dahil ediyoruz
import { OgrenciListeComponent } from './ogrenci-liste/ogrenci-liste'; // Eğer dosya adı ogrenci-liste.component.ts ise sonunu ona göre değiştir

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. Ana sayfaya "Benim içimde bu bileşeni kullanmana izin veriyorum" diyoruz
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'ogrenci-frontend';
}
